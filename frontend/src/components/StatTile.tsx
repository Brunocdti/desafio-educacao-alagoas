export interface StatTileDelta {
  valorPercentual: number;
  rotulo: string;
  /** Se subir é bom (ex.: aprovação) ou ruim (ex.: abandono) — define a cor. */
  altaEBoa: boolean;
}

export function StatTile({
  label,
  value,
  delta,
  observacao,
}: {
  label: string;
  value: string;
  delta?: StatTileDelta;
  observacao?: string;
}) {
  const subiu = delta ? delta.valorPercentual >= 0 : null;
  const corDelta =
    subiu === null
      ? ''
      : (subiu && delta!.altaEBoa) || (!subiu && !delta!.altaEBoa)
        ? 'text-emerald-600'
        : 'text-red-600';

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
      {delta && (
        <p className={`mt-1 text-sm font-medium ${corDelta}`}>
          {subiu ? '▲' : '▼'} {Math.abs(delta.valorPercentual).toFixed(1)}% {delta.rotulo}
        </p>
      )}
      {observacao && <p className="mt-1 text-xs text-slate-400">{observacao}</p>}
    </div>
  );
}
