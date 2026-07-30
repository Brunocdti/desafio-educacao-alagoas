import { Card } from '../../../components/Card';
import { useFiltrosStore } from '../../../store/filtrosStore';
import { useFiltrosDisponiveis } from '../hooks/useFiltrosDisponiveis';

const selectClasses =
  'mt-1 w-full rounded border border-slate-300 bg-white p-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none';
const labelClasses = 'block text-sm font-medium text-slate-900';

function alternarMunicipio(selecionados: string[], coMun: string): string[] {
  return selecionados.includes(coMun)
    ? selecionados.filter((m) => m !== coMun)
    : [...selecionados, coMun];
}

export function FiltrosBar() {
  const { data, isLoading, isError } = useFiltrosDisponiveis();
  const {
    municipios,
    anoInicio,
    anoFim,
    rede,
    etapa,
    setMunicipios,
    setAnoInicio,
    setAnoFim,
    setRede,
    setEtapa,
  } = useFiltrosStore();

  if (isLoading) {
    return <p className="text-sm text-slate-400">Carregando filtros…</p>;
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-red-600">
        Não foi possível carregar os filtros. Verifique se a API está no ar e se há dados
        importados.
      </p>
    );
  }

  const todosSelecionados = municipios.length === 0;

  return (
    <Card title="Filtros">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div>
          <span className={labelClasses}>Município</span>
          <label className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={todosSelecionados} onChange={() => setMunicipios([])} />
            Todos
          </label>
          <div className="mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 p-1">
            {data.municipios.map((m) => (
              <label key={m.coMun} className="flex items-center gap-2 text-sm text-slate-600">

                <input
                  type="checkbox"
                  checked={municipios.includes(m.coMun)}
                  onChange={() => setMunicipios(alternarMunicipio(municipios, m.coMun))}
                />
                {m.noMun}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className={labelClasses} htmlFor="ano-inicio">
            Ano (de)
          </label>
          <select
            id="ano-inicio"
            className={selectClasses}
            value={anoInicio ?? ''}
            onChange={(e) => setAnoInicio(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Início dos dados</option>
            {data.anos.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>

          <label className={`mt-2 ${labelClasses}`} htmlFor="ano-fim">
            Ano (até)
          </label>
          <select
            id="ano-fim"
            className={selectClasses}
            value={anoFim ?? ''}
            onChange={(e) => setAnoFim(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">Fim dos dados</option>
            {data.anos.map((ano) => (
              <option key={ano} value={ano}>
                {ano}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses} htmlFor="rede">
            Rede de ensino
          </label>
          <select
            id="rede"
            className={selectClasses}
            value={rede ?? ''}
            onChange={(e) => setRede(e.target.value || undefined)}
          >
            <option value="">Total (padrão)</option>
            {data.redes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClasses} htmlFor="etapa">
            Etapa de ensino
          </label>
          <select
            id="etapa"
            className={selectClasses}
            value={etapa ?? ''}
            onChange={(e) => setEtapa(e.target.value || undefined)}
          >
            <option value="">Todas as etapas</option>
            {data.etapas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
