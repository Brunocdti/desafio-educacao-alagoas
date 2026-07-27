export const CABECALHO_ESPERADO = [
  'co_mun',
  'no_mun',
  'ano',
  'fonte',
  'variavel',
  'ensino_rede',
  'ensino_tipo',
  'valor',
] as const;

export const FONTES = ['censo_escolar', 'indicadores_rendimento', 'censo_demografico'] as const;

export const ENSINO_REDES = [
  'Estadual',
  'Municipal',
  'Federal',
  'Privada',
  'Pública',
  'Total',
  'Não se aplica',
] as const;

export const ENSINO_TIPOS = [
  'Educação Infantil',
  'Ensino Fundamental',
  'Ensino Médio',
  'Educação de Jovens e Adultos (EJA)',
  'Educação Profissional',
  'Pessoas de 15 anos ou mais de idade',
] as const;

export const VARIAVEIS_POR_FONTE: Record<(typeof FONTES)[number], string[]> = {
  censo_escolar: ['Escolas', 'Matrícula'],
  indicadores_rendimento: ['Taxa de Aprovação', 'Taxa de Reprovação', 'Taxa de Abandono'],
  censo_demografico: [
    'Pessoas Alfabetizadas',
    'Pessoas Total',
    'Taxa de Alfabetização',
    'Taxa de Analfabetismo',
  ],
};

export const TODAS_VARIAVEIS = Object.values(VARIAVEIS_POR_FONTE).flat();

export const VARIAVEIS_PERCENTUAL = new Set([
  'Taxa de Aprovação',
  'Taxa de Reprovação',
  'Taxa de Abandono',
  'Taxa de Alfabetização',
  'Taxa de Analfabetismo',
]);

export const VARIAVEL_MATRICULA = 'Matrícula';

export const ANO_MIN = 2007;
export const ANO_MAX = 2025;

const VARIAVEIS_DEMOGRAFICAS = new Set(VARIAVEIS_POR_FONTE.censo_demografico);

export function redeEfetiva(variavel: string, redeSolicitada?: string): string {
  if (redeSolicitada) return redeSolicitada;
  return VARIAVEIS_DEMOGRAFICAS.has(variavel) ? 'Não se aplica' : 'Total';
}
