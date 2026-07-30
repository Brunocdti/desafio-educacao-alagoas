import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import type { PaginaDados } from '../types';

export function useDados(pagina: number, tamanho: number, variavel?: string) {
  const filtro = useFiltrosParams();
  const params = { ...filtro, variavel, pagina, tamanho };
  return useQuery({
    queryKey: ['dados', params],
    queryFn: () => apiGet<PaginaDados>('/api/dados', params),
    placeholderData: (dadosAnteriores) => dadosAnteriores,
  });
}
