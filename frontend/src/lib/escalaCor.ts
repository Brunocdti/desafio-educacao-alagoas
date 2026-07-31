export interface FaixaCor {
  min: number;
  max: number;
  cor: string;
}

/** Rampa sequencial de matiz única (azul), do claro pro escuro — nunca arco-íris. */
const RAMPA_AZUL = ['#dbeafe', '#93c5fd', '#60a5fa', '#3b82f6', '#1d4ed8'];

/** Cinza pra município sem dado — nunca a cor do valor mais baixo. */
export const COR_SEM_DADO = '#e2e8f0';

/**
 * Quebras por quantil (não lineares): cada faixa tem aproximadamente a mesma
 * quantidade de municípios, o que evita que um outlier (Maceió, bem maior que
 * o resto) esmague todo o resto do mapa numa única cor clara.
 */
export function calcularFaixas(valores: number[], numFaixas = RAMPA_AZUL.length): FaixaCor[] {
  const ordenados = [...valores].sort((a, b) => a - b);
  const n = ordenados.length;
  if (n === 0) return [];

  const limites = [ordenados[0]];
  for (let i = 1; i < numFaixas; i++) {
    const idx = Math.min(Math.floor((i / numFaixas) * n), n - 1);
    limites.push(ordenados[idx]);
  }
  limites.push(ordenados[n - 1]);

  return Array.from({ length: numFaixas }, (_, i) => ({
    min: limites[i],
    max: limites[i + 1],
    cor: RAMPA_AZUL[i],
  }));
}

export function corParaValor(valor: number | null | undefined, faixas: FaixaCor[]): string {
  if (valor === null || valor === undefined || faixas.length === 0) return COR_SEM_DADO;
  for (let i = faixas.length - 1; i >= 0; i--) {
    if (valor >= faixas[i].min) return faixas[i].cor;
  }
  return faixas[0].cor;
}
