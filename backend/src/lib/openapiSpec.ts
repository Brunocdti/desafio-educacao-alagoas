import { ENSINO_REDES, ENSINO_TIPOS, FONTES, TODAS_VARIAVEIS } from './dominio';

const erroResposta = {
  type: 'object',
  properties: { erro: { type: 'string' } },
  required: ['erro'],
};

const filtroComum = [
  {
    name: 'municipio',
    in: 'query',
    description: 'Código IBGE de um ou mais municípios, separados por vírgula (ex.: 2704302,2700300).',
    schema: { type: 'string' },
  },
  {
    name: 'anoInicio',
    in: 'query',
    schema: { type: 'integer' },
  },
  {
    name: 'anoFim',
    in: 'query',
    schema: { type: 'integer' },
  },
  {
    name: 'rede',
    in: 'query',
    description:
      'Filtro de valor único (nunca soma a hierarquia). Default: "Total" para variáveis educacionais, "Não se aplica" para variáveis demográficas.',
    schema: { type: 'string', enum: [...ENSINO_REDES] },
  },
  {
    name: 'etapa',
    in: 'query',
    schema: { type: 'string', enum: [...ENSINO_TIPOS] },
  },
];

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'API — Educação Alagoas',
    version: '1.0.0',
    description:
      'API de upload e agregação de dados públicos de educação de municípios de Alagoas (2007–2025).',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/upload': {
      post: {
        summary: 'Envia um CSV para processar e substituir a base atual',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  arquivo: { type: 'string', format: 'binary' },
                },
                required: ['arquivo'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Resumo do processamento',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ResumoUpload' } },
            },
          },
          '400': {
            description: 'Cabeçalho inválido, arquivo não é .csv ou nenhum arquivo enviado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErroResposta' } } },
          },
        },
      },
    },
    '/filtros': {
      get: {
        summary: 'Lista os valores distintos disponíveis para montar os filtros do dashboard',
        responses: {
          '200': {
            description: 'Filtros disponíveis, direto do banco (nunca fixados no código)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/FiltrosDisponiveis' } },
            },
          },
        },
      },
    },
    '/series': {
      get: {
        summary: 'Série temporal de uma variável, agregada por ano',
        parameters: [
          {
            name: 'variavel',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: [...TODAS_VARIAVEIS] },
          },
          ...filtroComum,
        ],
        responses: {
          '200': {
            description: 'Pontos da série (só anos com dado; sem zero-fill)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ResultadoSerie' } },
            },
          },
          '400': {
            description: 'Variável desconhecida ou parâmetro inválido',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErroResposta' } } },
          },
        },
      },
    },
    '/ranking': {
      get: {
        summary: 'Ranking de municípios para uma variável, num ano específico',
        parameters: [
          {
            name: 'variavel',
            in: 'query',
            required: true,
            schema: { type: 'string', enum: [...TODAS_VARIAVEIS] },
          },
          { name: 'ano', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'limite', in: 'query', schema: { type: 'integer', default: 20 } },
          ...filtroComum,
        ],
        responses: {
          '200': {
            description: 'Municípios ordenados por valor (desc)',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/ItemRanking' } },
              },
            },
          },
        },
      },
    },
    '/indicadores': {
      get: {
        summary: 'Indicadores agregados do recorte selecionado (para os cards do dashboard)',
        parameters: filtroComum,
        responses: {
          '200': {
            description: 'Cards do recorte, com o ano de referência usado',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Indicadores' } } },
          },
        },
      },
    },
    '/dados': {
      get: {
        summary: 'Tabela paginada com os dados brutos do recorte atual',
        parameters: [
          ...filtroComum,
          { name: 'variavel', in: 'query', schema: { type: 'string', enum: [...TODAS_VARIAVEIS] } },
          { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'tamanho', in: 'query', schema: { type: 'integer', default: 50, maximum: 500 } },
        ],
        responses: {
          '200': {
            description: 'Página de linhas + total do recorte (paginação no servidor)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginaDados' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ErroResposta: erroResposta,
      ResumoUpload: {
        type: 'object',
        properties: {
          linhasLidas: { type: 'integer' },
          linhasImportadas: { type: 'integer' },
          linhasRejeitadas: { type: 'integer' },
          erros: {
            type: 'array',
            items: {
              type: 'object',
              properties: { linha: { type: 'integer' }, motivo: { type: 'string' } },
            },
          },
        },
      },
      MunicipioFiltro: {
        type: 'object',
        properties: { coMun: { type: 'string' }, noMun: { type: 'string' } },
      },
      FiltrosDisponiveis: {
        type: 'object',
        properties: {
          municipios: { type: 'array', items: { $ref: '#/components/schemas/MunicipioFiltro' } },
          anos: { type: 'array', items: { type: 'integer' } },
          redes: { type: 'array', items: { type: 'string' }, example: ENSINO_REDES },
          etapas: { type: 'array', items: { type: 'string' }, example: ENSINO_TIPOS },
          variaveis: { type: 'array', items: { type: 'string' }, example: TODAS_VARIAVEIS },
        },
      },
      PontoSerie: {
        type: 'object',
        properties: { ano: { type: 'integer' }, valor: { type: 'number' } },
      },
      ResultadoSerie: {
        type: 'object',
        properties: {
          pontos: { type: 'array', items: { $ref: '#/components/schemas/PontoSerie' } },
          observacao: { type: 'string', nullable: true },
        },
      },
      ItemRanking: {
        type: 'object',
        properties: {
          coMun: { type: 'string' },
          noMun: { type: 'string' },
          valor: { type: 'number' },
        },
      },
      Indicadores: {
        type: 'object',
        properties: {
          anoReferencia: { type: 'integer', nullable: true },
          totalMatriculas: { type: 'number', nullable: true },
          totalEscolas: {
            type: 'object',
            properties: {
              valor: { type: 'number', nullable: true },
              rotulo: { type: 'string', enum: ['escolas', 'ofertas de ensino'] },
            },
          },
          taxaAprovacaoMedia: {
            type: 'object',
            properties: {
              valor: { type: 'number', nullable: true },
              metodo: { type: 'string', enum: ['ponderada por matrícula'] },
            },
          },
          taxaAbandonoMedia: {
            type: 'object',
            properties: {
              valor: { type: 'number', nullable: true },
              metodo: { type: 'string', enum: ['ponderada por matrícula'] },
            },
          },
          variacaoMatriculasAnoAAno: {
            type: 'object',
            nullable: true,
            properties: {
              anoAnterior: { type: 'integer' },
              valorAnterior: { type: 'number' },
              percentual: { type: 'number' },
            },
          },
          observacao: { type: 'string' },
        },
      },
      ItemDado: {
        type: 'object',
        properties: {
          coMun: { type: 'string' },
          noMun: { type: 'string' },
          ano: { type: 'integer' },
          fonte: { type: 'string', enum: [...FONTES] },
          variavel: { type: 'string', example: TODAS_VARIAVEIS },
          ensinoRede: { type: 'string', enum: [...ENSINO_REDES] },
          ensinoTipo: { type: 'string', enum: [...ENSINO_TIPOS] },
          valor: { type: 'number' },
        },
      },
      PaginaDados: {
        type: 'object',
        properties: {
          itens: { type: 'array', items: { $ref: '#/components/schemas/ItemDado' } },
          total: { type: 'integer' },
          pagina: { type: 'integer' },
          tamanho: { type: 'integer' },
        },
      },
    },
  },
};
