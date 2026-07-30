import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import type { Indicadores } from '../types';

export function useIndicadores() {
  const params = useFiltrosParams();
  return useQuery({
    queryKey: ['indicadores', params],
    queryFn: () => apiGet<Indicadores>('/api/indicadores', params),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  });
}
