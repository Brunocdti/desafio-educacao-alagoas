import { useFiltrosStore } from './filtrosStore';

/** Traduz o estado do filtro global para os parâmetros de query que a API espera. */
export function useFiltrosParams() {
  const { municipios, anoInicio, anoFim, rede, etapa } = useFiltrosStore();
  return {
    municipio: municipios.length > 0 ? municipios.join(',') : undefined,
    anoInicio,
    anoFim,
    rede,
    etapa,
  };
}
