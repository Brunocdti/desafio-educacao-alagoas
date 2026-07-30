import { useEffect, useState } from 'react';
import { Card } from '../../../components/Card';
import { formatarNumero, formatarPercentual } from '../../../lib/formatters';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import { useFiltrosDisponiveis } from '../../filtros/hooks/useFiltrosDisponiveis';
import { useDados } from '../hooks/useDados';

const TAMANHO_PAGINA = 20;
const ehPercentual = (variavel: string) => variavel.startsWith('Taxa de');

export function TabelaDados() {
  const { data: filtros } = useFiltrosDisponiveis();
  const filtroParams = useFiltrosParams();
  const [variavel, setVariavel] = useState('');
  const [pagina, setPagina] = useState(1);

  // volta pra página 1 sempre que o recorte selecionado muda
  const chaveFiltro = JSON.stringify(filtroParams);
  useEffect(() => {
    setPagina(1);
  }, [chaveFiltro, variavel]);

  const { data, isLoading, isError } = useDados(pagina, TAMANHO_PAGINA, variavel || undefined);
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / TAMANHO_PAGINA)) : 1;

  return (
    <Card title="Dados do recorte">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="text-sm font-medium text-slate-900" htmlFor="dados-variavel">
            Variável:{' '}
          </label>
          <select
            id="dados-variavel"
            className="rounded border border-slate-300 bg-white p-1 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            value={variavel}
            onChange={(e) => setVariavel(e.target.value)}
          >
            <option value="">Todas</option>
            {(filtros?.variaveis ?? []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <p className="text-sm text-slate-500">
            {formatarNumero(data.total)} linha{data.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-400">Carregando dados…</p>}
      {isError && <p className="text-sm text-red-600">Não foi possível carregar os dados.</p>}

      {data && data.itens.length === 0 && (
        <p className="text-sm text-slate-500">Sem dado para o recorte selecionado.</p>
      )}

      {data && data.itens.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">Município</th>
                  <th className="py-2 pr-3 font-medium">Ano</th>
                  <th className="py-2 pr-3 font-medium">Fonte</th>
                  <th className="py-2 pr-3 font-medium">Variável</th>
                  <th className="py-2 pr-3 font-medium">Rede</th>
                  <th className="py-2 pr-3 font-medium">Etapa</th>
                  <th className="py-2 pr-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {data.itens.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100 text-slate-800">
                    <td className="py-1.5 pr-3">{item.noMun}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{item.ano}</td>
                    <td className="py-1.5 pr-3">{item.fonte}</td>
                    <td className="py-1.5 pr-3">{item.variavel}</td>
                    <td className="py-1.5 pr-3">{item.ensinoRede}</td>
                    <td className="py-1.5 pr-3">{item.ensinoTipo}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {ehPercentual(item.variavel)
                        ? formatarPercentual(item.valor)
                        : formatarNumero(item.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina <= 1}
              className="rounded border border-slate-300 px-3 py-1 text-slate-700 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-slate-500">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="rounded border border-slate-300 px-3 py-1 text-slate-700 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </Card>
  );
}
