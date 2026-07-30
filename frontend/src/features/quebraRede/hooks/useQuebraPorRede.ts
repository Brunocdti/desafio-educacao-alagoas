import { useQueries } from '@tanstack/react-query';
import { apiGet } from '../../../lib/apiClient';
import { useFiltrosParams } from '../../../store/useFiltrosParams';
import type { ResultadoSerie } from '../../series/types';

/**
 * As 4 categorias-folha da hierarquia de rede — nunca Total/Pública, que são
 * agregados e somariam o mesmo aluno mais de uma vez (seção 4.1 do desafio).
 */
export const REDES_FOLHA = ['Estadual', 'Municipal', 'Federal', 'Privada'] as const;

export interface ItemQuebraRede {
  rede: string;
  valor: number | null;
}

/**
 * Ignora deliberadamente o filtro global de `rede` — este gráfico sempre busca
 * as 4 folhas lado a lado, independente do que estiver selecionado no filtro.
 */
export function useQuebraPorRede(variavel: string) {
  const { municipio, anoInicio, anoFim, etapa } = useFiltrosParams();

  const resultados = useQueries({
    queries: REDES_FOLHA.map((rede) => ({
      queryKey: ['series-rede', { municipio, anoInicio, anoFim, etapa, rede, variavel }],
      queryFn: () =>
        apiGet<ResultadoSerie>('/api/series', {
          municipio,
          anoInicio,
          anoFim,
          etapa,
          rede,
          variavel,
        }),
      placeholderData: (dadosAnteriores: ResultadoSerie | undefined) => dadosAnteriores,
    })),
  });

  const isLoading = resultados.some((r) => r.isLoading);
  const isError = resultados.some((r) => r.isError);
  const dados: ItemQuebraRede[] = REDES_FOLHA.map((rede, i) => {
    const pontos = resultados[i].data?.pontos ?? [];
    const ultimo = pontos[pontos.length - 1];
    return { rede, valor: ultimo?.valor ?? null };
  });

  return { dados, isLoading, isError };
}
