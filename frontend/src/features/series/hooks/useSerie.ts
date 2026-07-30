import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import type { ResultadoSerie } from '../types';

export function useSerie(variavel: string) {
  const filtro = useFiltrosParams();
  const params = { ...filtro, variavel };
  return useQuery({
    queryKey: ['series', params],
    queryFn: () => apiGet<ResultadoSerie>('/api/series', params),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  });
}
