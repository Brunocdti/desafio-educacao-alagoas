# Desafio Educação Alagoas

Aplicação web para upload e análise de dados públicos de educação de municípios de Alagoas
(2007–2025). Recebe um CSV em formato longo (`co_mun,no_mun,ano,fonte,variavel,ensino_rede,ensino_tipo,valor`),
valida e processa esses dados no backend, e alimenta um dashboard com filtros, indicadores
agregados e gráficos.

O CSV é agregado (contagens e percentuais por município/ano/rede/etapa), não microdados de
escola. A amostra usada em desenvolvimento (`educacao_alagoas_amostra.csv`, 3.534 linhas, 10
municípios) está versionada no repositório como fixture de teste — não é carregada
automaticamente pela aplicação, só serve para os testes automatizados e para você testar o
upload manualmente sem precisar do arquivo completo (145 mil linhas) em mãos.

## Estrutura

- `backend/` — API Node.js + Express + TypeScript + Prisma (Postgres)
- `frontend/` — React + TypeScript + Vite + Tailwind CSS

## Status

Núcleo completo, ponta a ponta: upload com validação/streaming, os 5 endpoints de agregação
(`/api/filtros`, `/api/series`, `/api/ranking`, `/api/indicadores`, `/api/dados`), documentação
OpenAPI/Swagger em `/docs`, e o dashboard no frontend (upload, filtros globais, 4 cards de
indicadores, os 3 gráficos obrigatórios — série temporal, ranking entre municípios e quebra por
rede de ensino — e a tabela paginada). Validado com um arquivo sintético de ~145 mil linhas (ver
seção "Validação em escala" abaixo). Faltam só os diferenciais opcionais: CI, deploy público e
enriquecimento com dados externos (mapa, etc.).

## Como rodar o backend do zero

Pré-requisitos: Node.js 20+, uma connection string de Postgres (recomendado: [Neon](https://neon.tech),
free tier — não precisa instalar nada localmente; alternativamente, suba um Postgres local com
o `docker-compose.yml` na raiz do repo, se preferir e tiver Docker).

```bash
cd backend
npm install
cp .env.example .env        # preencha DATABASE_URL com sua connection string
npx prisma migrate dev      # cria a tabela `medida` no banco
npm run dev                 # sobe a API em http://localhost:3333
```

Verificação rápida:

```bash
curl http://localhost:3333/health
# depois de subir a API, envie o CSV pelo endpoint de upload:
curl -X POST http://localhost:3333/api/upload -F "arquivo=@../educacao_alagoas_amostra.csv"
```

Documentação interativa da API (Swagger UI): `http://localhost:3333/docs`. Spec crua em
`http://localhost:3333/openapi.json`.

Outros comandos úteis (dentro de `backend/`):

- `npm test` — roda os testes (vitest), incluindo os principais casos de upload (cabeçalho
  errado, coluna renomeada, arquivo vazio, arquivo inválido, reimportação).
  **Atenção:** os testes rodam contra o banco configurado em `DATABASE_URL` e apagam a tabela
  `medida` antes de cada teste — não rode contra um banco com dados que você queira manter.
- `npm run lint` — ESLint.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run build` — compila para `dist/`.

## Como rodar o frontend do zero

Com o backend já rodando em `http://localhost:3333` (seção acima):

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL já vem apontando pro backend local
npm run dev             # sobe em http://localhost:5173
```

Abra `http://localhost:5173`, suba o `educacao_alagoas_amostra.csv` pela tela de upload e use os
filtros — todo o resto do dashboard (cards, gráficos, tabela) reage ao filtro global.

Outros comandos (dentro de `frontend/`): `npm run lint` (oxlint) e `npm run build` (`tsc -b` +
build de produção do Vite).

## Decisões sobre tratamento dos dados

**Hierarquia de `ensino_rede` (Total = Pública + Privada; Pública = Estadual + Municipal +
Federal).** Nunca somo categorias da hierarquia entre si. Em toda a API, `rede` é um filtro
de valor único, nunca "todas as redes somadas". Quando o cliente não informa `rede`, o backend
aplica um default seguro (`redeEfetiva()` em `lib/dominio.ts`): `Total` para variáveis de
`censo_escolar`/`indicadores_rendimento`, e `Não se aplica` para variáveis de
`censo_demografico` (única rede que essas linhas têm). Isso existe porque deixar `rede`
indefinido chegar numa query de `SUM()` somaria Total+Pública+Estadual+Municipal+Federal+Privada
juntos, contando o mesmo aluno três vezes. A única exceção é o gráfico de "quebra por rede" no
dashboard, que busca deliberadamente as 4 categorias-folha (Estadual/Municipal/Federal/Privada)
lado a lado — isso é decomposição, não soma.

**`Escolas` contada mais de uma vez por `ensino_tipo`.** Uma escola que oferece Educação Infantil
e Ensino Fundamental aparece nas duas linhas. Por isso, quando o card/série de `Escolas` não tem
uma etapa fixada no filtro, a API rotula o resultado como `"ofertas de ensino"` (não "escolas") e
o dashboard usa esse rótulo. Com etapa fixada, o número já representa escolas de verdade daquela
etapa/rede/município.

**Percentuais não se somam nem aceitam média simples entre municípios.** Quando o recorte cruza
mais de um município, os endpoints de série/ranking/indicadores calculam a média **ponderada por
matrícula** (`soma(taxa × matrícula) / soma(matrícula)`), fazendo um `LEFT JOIN` com a linha de
`Matrícula` (`censo_escolar`) do mesmo município/ano/rede/etapa. Quando não existe matrícula
correspondente (as taxas de alfabetização de `censo_demografico` não têm par em `censo_escolar`),
o peso cai para 1 e o resultado vira média simples — nesses casos a API não afirma "ponderada"
para essas variáveis especificamente (fica documentado aqui; o dashboard rotula a métrica como
"média ponderada por matrícula" apenas quando faz sentido para a variável).

**Cobertura de anos por fonte.** `censo_escolar` e `indicadores_rendimento` são anuais;
`censo_demografico` só tem os anos em que o Censo/PNAD rodou (2010 e 2022 na amostra). A lista de
anos do filtro vem de `SELECT DISTINCT ano` no banco (`/api/filtros`), nunca fixada no código. Um
recorte que não cruza com nenhuma linha devolve lista vazia / campos `null` com um campo
`observacao` explicando — nunca zero disfarçado de dado real.

**Zero ≠ ausente.** Nunca preencho ausência de linha com valor 0. As séries temporais
(`/api/series`) devolvem só os pontos com linha correspondente no banco.

**Reimportação = substitui.** Cada upload roda dentro de uma transação que primeiro faz
`DELETE` na tabela `medida` e depois insere o arquivo novo em lotes de 2000 linhas. Escolhi
substituir (em vez de acumular ou bloquear) porque o dashboard representa "o estado atual dos
dados", não um histórico de uploads — e é a opção mais simples de raciocinar sobre consistência.

**Acentuação.** O CSV de amostra é UTF-8 correto; validei isso lendo o arquivo programaticamente
antes de começar a codar (os nomes com acento/cedilha — Maceió, Piaçabuçu — batem certo). Postgres,
Prisma e Express não fazem nenhuma conversão de charset por conta própria, então o UTF-8 se
mantém em toda a cadeia sem tratamento especial.

## Decisões de arquitetura

**Camadas `api` / `core` / `coredb`.** O backend segue um padrão de 3 camadas parecido com
ports & adapters: `core/{recurso}.ts` só tem tipos e uma interface (o contrato — ex.
`SeriesStore`, com o método `obterSerie`); `coredb/{recurso}.ts` implementa essa interface com
Prisma/SQL de verdade (e é onde os testes ficam, ao lado do código que testam); `api/{recurso}.ts`
expõe só o handler HTTP, chamando a implementação através do tipo do `core`. Essa separação
**não nasceu de uma necessidade técnica deste projeto** — um projeto deste tamanho (uma tabela,
6 endpoints de leitura, sem troca de banco nem mock em teste) se sustentaria bem com só 2 camadas.
A decisão foi tomada por **familiaridade pessoal**: é o padrão que uso em um projeto Go maior
(camadas `core`/`coredb`/`apiserver`), e optar por replicá-lo aqui foi mais uma questão de
organização e conforto de navegação no código do que de complexidade real — inclusive comecei o projeto com
só 2 camadas (`core` misturando tipo e lógica de banco) e refatorei no meio do caminho ao perceber
que estava fugindo do padrão que eu realmente entendo bem. Ambas as abordagens são defensáveis;
registrei aqui a real motivação para ser transparente.

**Rotas centralizadas em `app.ts`.** Cada `api/{recurso}.ts` exporta só a função handler (sem
`Router` próprio nem path declarado); todas as rotas da API são registradas explicitamente num
lugar só (`app.ts`), inspirado no `RegisterRoutes` do mesmo projeto Go. O objetivo é dar pra ver
o mapa de rotas inteiro numa tela só, sem abrir 6 arquivos.

**PostgreSQL via Neon, não Docker.** Optei por um Postgres gerenciado (Neon, free tier) para o
dia a dia de desenvolvimento, para não depender de instalar Docker Desktop no Windows. Um
`docker-compose.yml` com Postgres local ainda está no repositório como alternativa, mas não é o
que uso para desenvolver.

**Prisma na v5, não v6/v7.** O Prisma 7 (mais recente na época) exige um *driver adapter*
explícito (`@prisma/adapter-pg`) e um `prisma.config.ts` novo — setup bem maior do que o
`schema.prisma` simples com `url = env("DATABASE_URL")`. Como o ganho não compensava o custo de
configuração extra para este projeto, fiquei na v5.22, que segue mantida e amplamente usada.

**Agregação em SQL parametrizado, não em JavaScript.** Os 4 endpoints de agregação
(`series`, `ranking`, `indicadores`, `dados`) fazem a soma/média/paginação no banco
(`prisma.$queryRaw` com *tagged templates*, que parametrizam automaticamente — nunca
concatenação de string), com um índice composto em `(ano, variavel, ensino_rede, ensino_tipo)`.
Trazer a base completa (145 mil linhas) inteira para o Node agregar em array não escalaria nem
manteria as respostas rápidas.

## Decisões de interface

**Estrutura por feature no frontend.** `src/features/{upload,filtros,indicadores,series,ranking,
quebraRede,dados}/`, cada uma com `components/` e `hooks/` (o hook chama a API via React Query —
é o equivalente React ao `services/` do Angular/GRC-FRONT). Estado do filtro global fica num
único store Zustand (`store/filtrosStore.ts`); um hook derivado (`useFiltrosParams`) traduz esse
estado pros parâmetros de query que cada endpoint espera, então todo componente deriva do mesmo
lugar em vez de duplicar lógica de filtro.

**Paleta e método dos gráficos.** Os 3 gráficos obrigatórios usam uma única cor de destaque
(azul) validada por script de contraste/daltonismo antes de ir pro código — nenhum dos três
precisa de mais de uma cor de identidade (ranking e quebra por rede são categorias no eixo, não
séries concorrentes; a série temporal é uma linha só). Cor, espaçamento de barra, e a regra de
nunca desenhar borda ao redor de marca (usar espaço em branco pra separar) seguem um guia interno
de visualização de dados que seguí à risca antes de escrever a primeira linha de gráfico.
Direct labels (valor no topo da barra, valor mais recente da série em destaque) em vez de rótulo
em cada ponto; tooltip ao passar o mouse em todos os três.

**Paleta Indigo/Blue/Slate, sem dark mode.** A primeira versão usava uma paleta genérica e
respondia automaticamente ao tema do sistema operacional (`prefers-color-scheme`). Troquei pra uma
paleta inspirada no meu projeto GRC-FRONT (Indigo-600 nos botões, Blue-500 nos gráficos,
Slate nos textos/bordas, superfície branca) por dois motivos: fica mais parecido com o que eu uso
no dia a dia, e o próprio GRC-FRONT não tem modo escuro — copiei essa simplicidade de propósito em
vez de manter uma implementação de dark mode não testada e inconsistente com a referência.

**React Query + Zustand.** React Query cuida de cache/loading/erro de cada chamada de API
(inclusive mantendo o gráfico anterior visível, em vez de piscar um estado de carregando, quando
o filtro muda — `placeholderData`). Zustand só guarda os 5 campos do filtro global; não tem
Redux nem Context API caseiro.

## Validação em escala

O arquivo de amostra tem 3.534 linhas; a avaliação vai usar a base completa (145.028 linhas,
13MB). Antes de considerar o projeto pronto, gerei um CSV sintético de 144.894 linhas (41 cópias
dos 10 municípios da amostra, cada uma com um `co_mun` sintético) e testei os 5 endpoints contra
ele. Isso revelou dois problemas reais que não apareciam com a amostra pequena:

1. **`/api/series` ignorava o filtro de ano.** `anoInicio`/`anoFim` nunca eram aplicados na query
   — o filtro global de intervalo de anos simplesmente não afetava o gráfico de série temporal.
   Só ficou visível testando um recorte de anos que exclui os únicos anos com dado de
   `censo_demografico` (2010/2022) e vendo que a série voltava com valor mesmo assim.
2. **`/api/filtros` e `/api/indicadores` estouravam 1 segundo com a base completa** (2,2s e 1,17s
   respectivamente), mesmo com os índices certos. A causa não era falta de índice — era número de
   *round-trips* ao banco: `filtros` fazia 5 consultas separadas e `indicadores` fazia até 7
   (algumas em paralelo, mas com uma sequencial no fim). Cada ida e volta até o Neon custa uns
   150–200ms sozinha; 5–7 delas somam mais que 1s mesmo que cada consulta individual seja rápida.
   Consolidei `filtros` numa única query (5 subselects resolvidos pelo Postgres, não pelo Node) e
   `indicadores` em 3 (usando `FILTER` do Postgres pra combinar agregados que antes eram consultas
   separadas). Resultado: `filtros` caiu pra ~0,3–0,5s e `indicadores` pra ~0,2–0,4s.

Depois do fix, os 5 endpoints ficaram entre 0,15s e 0,53s contra as 144.894 linhas sintéticas, e os
6 números da seção de conferência continuaram batendo exatamente (validados de novo depois da
correção, com o arquivo real). O gerador do CSV sintético não ficou no repositório — foi só uma
ferramenta de teste, não faz parte da aplicação.

## Dificuldades encontradas

**TypeScript no backend.** Uso TypeScript no dia a dia principalmente no frontend; escrever
tipagem de queries SQL cruas (`prisma.$queryRaw<T>`), lidar com o tipo union que o Prisma gera
para `createMany` (`data: X | X[]`), e acompanhar a mudança de `moduleResolution` (de `"node"`,
que descobri estar depreciado, para `"node10"` — também já depreciado na mesma versão do TS —
até `"nodenext"`, que é o recomendado hoje) foram coisas novas pra mim nesse projeto. Levou mais
tempo do que eu esperava só para deixar o `tsconfig.json` correto antes de escrever a primeira
linha de código de feature. No frontend apareceu uma versão menor do mesmo tipo de problema: o
TypeScript 6 (usado pelo scaffold mais recente do Vite) tem uma flag nova, `erasableSyntaxOnly`,
que proíbe o atalho de *parameter properties* no construtor de classe (`constructor(public x: T)`)
— tive que reescrever `ApiError` no estilo mais explícito (campo declarado, atribuído no corpo do
construtor).

**Prisma 7 exigindo driver adapter.** No meio da configuração inicial, atualizei o Prisma pra
versão mais recente (7.9.1) só por rotina, e a migração quebrou: a versão nova não aceita mais
`url = env("DATABASE_URL")` direto no `schema.prisma`, exige um *driver adapter*
(`@prisma/adapter-pg`) e um arquivo `prisma.config.ts` novo. Como o ganho não compensava o custo de
configuração extra pra um projeto deste tamanho, revertei pra v5.22 (ainda mantida) — decisão
registrada em "Decisões de arquitetura" acima.

**Troca de arquitetura no meio do caminho.** Comecei com `core/` fazendo o papel de lógica de
negócio + acesso a dados junto (2 camadas: `api` + `core`). Ao perceber que isso divergia do
padrão de 3 camadas que uso e entendo bem em outro projeto (Go), refatorei `upload`, `filtros` e
`series` — que já estavam prontos — para separar o contrato (`core`) da implementação (`coredb`).
Como já registrado acima, essa troca foi mais por preferência de organização pessoal do que por
necessidade técnica; vale o registro para ser honesto sobre o motivo real da mudança.

**GRC-FRONT é Angular, não React.** Fui olhar meu outro projeto de frontend pra manter alguma
consistência de organização, esperando algo direto de copiar — mas é Angular (módulos, serviços
injetáveis, RxJS), que não tem equivalente 1:1 em React (sem injeção de dependência, sem
`services/` no sentido Angular). Adaptei o princípio (pastas por feature) em vez do código: no
frontend, `services/` virou `hooks/` (a forma idiomática de React de buscar dado, aqui com React
Query), sem tentar forçar um padrão de um framework diferente no outro.

**Os dois bugs achados só testando em escala** (filtro de ano não aplicado em `/api/series`, e
`/api/filtros`/`/api/indicadores` estourando 1 segundo com a base completa) — detalhados na seção
"Validação em escala" acima — foram a dificuldade mais séria do projeto: a amostra de 3.534 linhas
não tinha volume nem variação suficiente pra expor nenhum dos dois. Só apareceram depois que gerei
um CSV sintético do tamanho da base real e testei cada endpoint contra ele deliberadamente, em vez
de confiar que "funcionou com a amostra" significava "está pronto".

## O que ficou de fora (por enquanto)

- Mapa coroplético, escolas individuais e outros enriquecimentos com dados externos.
- GitHub Actions e deploy público.

## Licença

Ver [LICENSE](LICENSE).
