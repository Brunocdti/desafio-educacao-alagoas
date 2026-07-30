import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { FiltrosStore } from '../core/filtros';

interface LinhaFiltros {
  municipios: { coMun: string; noMun: string }[];
  anos: number[];
  redes: string[];
  etapas: string[];
  variaveis: string[];
}

/**
 * Uma única consulta (5 subselects resolvidos pelo Postgres) em vez de 5 idas
 * e voltas separadas — com a base completa (145 mil linhas), 5 round-trips até
 * o Neon levavam >2s; consolidado em uma chamada fica na casa de algumas
 * centenas de ms.
 */
export const filtrosStore: FiltrosStore = {
  async obterFiltros() {
    const [linha] = await prisma.$queryRaw<LinhaFiltros[]>(Prisma.sql`
      SELECT
        (SELECT COALESCE(jsonb_agg(jsonb_build_object('coMun', co_mun, 'noMun', no_mun) ORDER BY no_mun), '[]'::jsonb)
           FROM (SELECT DISTINCT co_mun, no_mun FROM medida) t) AS municipios,
        (SELECT COALESCE(jsonb_agg(ano ORDER BY ano), '[]'::jsonb)
           FROM (SELECT DISTINCT ano FROM medida) t) AS anos,
        (SELECT COALESCE(jsonb_agg(ensino_rede), '[]'::jsonb)
           FROM (SELECT DISTINCT ensino_rede FROM medida) t) AS redes,
        (SELECT COALESCE(jsonb_agg(ensino_tipo), '[]'::jsonb)
           FROM (SELECT DISTINCT ensino_tipo FROM medida) t) AS etapas,
        (SELECT COALESCE(jsonb_agg(variavel), '[]'::jsonb)
           FROM (SELECT DISTINCT variavel FROM medida) t) AS variaveis
    `);

    return {
      municipios: linha?.municipios ?? [],
      anos: linha?.anos ?? [],
      redes: linha?.redes ?? [],
      etapas: linha?.etapas ?? [],
      variaveis: linha?.variaveis ?? [],
    };
  },
};
