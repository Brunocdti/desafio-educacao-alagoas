import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import type { ItemRanking } from '../types';

export function useRanking(variavel: string, ano: number | undefined, limite: number) {
  const { municipio, rede, etapa } = useFiltrosParams();
  const params = { municipio, rede, etapa, variavel, ano, limite };
  return useQuery({
    queryKey: ['ranking', params],
    queryFn: () => apiGet<ItemRanking[]>('/api/ranking', params),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
    enabled: ano !== undefined,
  });
}
