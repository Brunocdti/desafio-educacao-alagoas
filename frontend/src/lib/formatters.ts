const numeroInteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const numeroCompacto = new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const percentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return numeroInteiro.format(valor);
}

export function formatarNumeroCompacto(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return numeroCompacto.format(valor);
}

export function formatarPercentual(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return `${percentual.format(valor)}%`;
}
