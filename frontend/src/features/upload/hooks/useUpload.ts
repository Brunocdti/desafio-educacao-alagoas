import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiUpload } from '../../../lib/apiClient';
import type { ResumoUpload } from '../types';

export function useUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (arquivo: File) => apiUpload<ResumoUpload>('/api/upload', arquivo),
    onSuccess: () => {
      // Reimportação substitui os dados: invalida tudo que depende deles.
      queryClient.invalidateQueries();
    },
  });
}
