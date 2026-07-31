import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import type { ItemEvolucao } from '../types';

export function useEvolucao(
  variavel: string,
  anoInicio: number | undefined,
  anoFim: number | undefined,
  limite: number,
) {
  const { municipio, rede, etapa } = useFiltrosParams();
  const params = { municipio, rede, etapa, variavel, anoInicio, anoFim, limite };
  return useQuery({
    queryKey: ['evolucao', params],
    queryFn: () => apiGet<ItemEvolucao[]>('/api/evolucao', params),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
    enabled: anoInicio !== undefined && anoFim !== undefined && anoInicio !== anoFim,
  });
}
