import { useFiltrosStore } from '../../../store/filtrosStore';
import { useFiltrosDisponiveis } from '../hooks/useFiltrosDisponiveis';

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
    return <div className="rounded border border-gray-200 bg-white p-4 text-gray-500">Carregando filtros…</div>;
  }

  if (isError || !data) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
        Não foi possível carregar os filtros. Verifique se a API está no ar e se há dados
        importados.
      </div>
    );
  }

  const todosSelecionados = municipios.length === 0;

  return (
    <div className="grid grid-cols-1 gap-4 rounded border border-gray-200 bg-white p-4 sm:grid-cols-4">
      <div>
        <span className="block text-sm font-medium text-gray-700">Município</span>
        <label className="mt-1 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={todosSelecionados}
            onChange={() => setMunicipios([])}
          />
          Todos
        </label>
        <div className="mt-1 max-h-40 overflow-y-auto rounded border border-gray-100 p-1">
          {data.municipios.map((m) => (
            <label key={m.coMun} className="flex items-center gap-2 text-sm">
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
        <label className="block text-sm font-medium text-gray-700" htmlFor="ano-inicio">
          Ano (de)
        </label>
        <select
          id="ano-inicio"
          className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm"
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

        <label className="mt-2 block text-sm font-medium text-gray-700" htmlFor="ano-fim">
          Ano (até)
        </label>
        <select
          id="ano-fim"
          className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm"
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
        <label className="block text-sm font-medium text-gray-700" htmlFor="rede">
          Rede de ensino
        </label>
        <select
          id="rede"
          className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm"
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
        <label className="block text-sm font-medium text-gray-700" htmlFor="etapa">
          Etapa de ensino
        </label>
        <select
          id="etapa"
          className="mt-1 w-full rounded border border-gray-300 p-1.5 text-sm"
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
  );
}
