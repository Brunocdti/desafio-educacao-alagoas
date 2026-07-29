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
- `frontend/` — React + TypeScript + Vite + Tailwind CSS *(em desenvolvimento)*

## Status

Backend completo: upload com validação/streaming, e os 5 endpoints de agregação
(`/api/filtros`, `/api/series`, `/api/ranking`, `/api/indicadores`, `/api/dados`). Frontend
ainda não iniciado.

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

Outros comandos úteis (dentro de `backend/`):

- `npm test` — roda os testes (vitest), incluindo os principais casos de upload (cabeçalho
  errado, coluna renomeada, arquivo vazio, arquivo inválido, reimportação).
  **Atenção:** os testes rodam contra o banco configurado em `DATABASE_URL` e apagam a tabela
  `medida` antes de cada teste — não rode contra um banco com dados que você queira manter.
- `npm run lint` — ESLint.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run build` — compila para `dist/`.

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

## Dificuldades encontradas

**TypeScript no backend.** Uso TypeScript no dia a dia principalmente no frontend; escrever
tipagem de queries SQL cruas (`prisma.$queryRaw<T>`), lidar com o tipo union que o Prisma gera
para `createMany` (`data: X | X[]`), e acompanhar a mudança de `moduleResolution` (de `"node"`,
que descobri estar depreciado, para `"node10"` — também já depreciado na mesma versão do TS —
até `"nodenext"`, que é o recomendado hoje) foram coisas novas pra mim nesse projeto. Levou mais
tempo do que eu esperava só para deixar o `tsconfig.json` correto antes de escrever a primeira
linha de código de feature.

**Troca de arquitetura no meio do caminho.** Comecei com `core/` fazendo o papel de lógica de
negócio + acesso a dados junto (2 camadas: `api` + `core`). Ao perceber que isso divergia do
padrão de 3 camadas que uso e entendo bem em outro projeto (Go), refatorei `upload`, `filtros` e
`series` — que já estavam prontos — para separar o contrato (`core`) da implementação (`coredb`).
Como já registrado acima, essa troca foi mais por preferência de organização pessoal do que por
necessidade técnica; vale o registro para ser honesto sobre o motivo real da mudança.

## O que ficou de fora (por enquanto)

- Frontend (React + Vite + Tailwind) — próxima etapa.
- Mapa coroplético, escolas individuais e outros enriquecimentos com dados externos — avaliar se
  sobra tempo depois do núcleo (frontend) estar pronto.
- Swagger/OpenAPI, GitHub Actions e deploy público — ainda não feitos.

## Licença

Ver [LICENSE](LICENSE).
