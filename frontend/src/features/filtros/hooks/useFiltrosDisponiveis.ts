import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import type { FiltrosDisponiveis } from '../types';

export function useFiltrosDisponiveis() {
  return useQuery({
    queryKey: ['filtros'],
    queryFn: () => apiGet<FiltrosDisponiveis>('/api/filtros'),
  });
}
