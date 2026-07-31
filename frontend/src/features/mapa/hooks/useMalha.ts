import { useQuery } from '@tanstack/react-query';

export interface FeatureMunicipio {
  type: 'Feature';
  properties: { codarea: string };
  geometry: GeoJSON.Geometry;
}

export interface MalhaAlagoas {
  type: 'FeatureCollection';
  features: FeatureMunicipio[];
}

/**
 * Malha municipal do IBGE, baixada uma vez e versionada em `public/` — nunca
 * via `import` (entraria no bundle JS) e nunca buscada ao vivo na API do IBGE
 * em runtime (o app tem que funcionar só com o CSV, mesmo se o IBGE cair).
 */
export function useMalha() {
  return useQuery({
    queryKey: ['malha-alagoas'],
    queryFn: async () => {
      const res = await fetch('/malha-alagoas.geo.json');
      if (!res.ok) throw new Error('Não foi possível carregar a malha do IBGE.');
      return (await res.json()) as MalhaAlagoas;
    },
    staleTime: Infinity,
  });
}
