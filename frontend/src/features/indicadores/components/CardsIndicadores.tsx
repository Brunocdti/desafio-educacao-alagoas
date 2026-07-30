import { StatTile } from '../../../components/StatTile';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useIndicadores } from '../hooks/useIndicadores';

export function CardsIndicadores() {
  const { data, isLoading, isError } = useIndicadores();

  if (isLoading) {
    return <p className="text-sm text-slate-400">Carregando indicadores…</p>;
  }

  if (isError || !data) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-red-600">
        Não foi possível carregar os indicadores.
      </p>
    );
  }

  if (data.anoReferencia === null) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
        {data.observacao ?? 'Sem dado no período selecionado.'}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs text-slate-400">Ano de referência: {data.anoReferencia}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total de matrículas"
          value={formatarNumero(data.totalMatriculas)}
          delta={
            data.variacaoMatriculasAnoAAno
              ? {
                  valorPercentual: data.variacaoMatriculasAnoAAno.percentual,
                  rotulo: `vs. ${data.variacaoMatriculasAnoAAno.anoAnterior}`,
                  altaEBoa: true,
                }
              : undefined
          }
        />
        <StatTile
          label={data.totalEscolas.rotulo === 'escolas' ? 'Total de escolas' : 'Ofertas de ensino'}
          value={formatarNumero(data.totalEscolas.valor)}
          observacao={
            data.totalEscolas.rotulo === 'ofertas de ensino'
              ? 'Sem etapa fixada — uma escola com mais de uma etapa é contada mais de uma vez.'
              : undefined
          }
        />
        <StatTile
          label="Taxa de aprovação média"
          value={formatarPercentual(data.taxaAprovacaoMedia.valor)}
          observacao={data.taxaAprovacaoMedia.metodo}
        />
        <StatTile
          label="Taxa de abandono média"
          value={formatarPercentual(data.taxaAbandonoMedia.valor)}
          observacao={data.taxaAbandonoMedia.metodo}
        />
      </div>
    </div>
  );
}
