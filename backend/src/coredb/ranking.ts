import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { TODAS_VARIAVEIS, VARIAVEIS_PERCENTUAL, VARIAVEL_MATRICULA, redeEfetiva } from '../lib/dominio';
import { filtroEtapa, filtroMunicipios, filtroRede } from '../lib/whereBuilder';
import { ItemRanking, RankingStore } from '../core/ranking';

export const rankingStore: RankingStore = {
  async obterRanking(variavel, params) {
    if (!TODAS_VARIAVEIS.includes(variavel)) {
      throw new AppError(`variavel desconhecida: ${variavel}`);
    }

    const rede = redeEfetiva(variavel, params.rede);
    const clausulas = Prisma.join(
      [filtroMunicipios(params.municipio), filtroRede(rede), filtroEtapa(params.etapa)],
      ' ',
    );

    if (VARIAVEIS_PERCENTUAL.has(variavel)) {
      return prisma.$queryRaw<ItemRanking[]>(Prisma.sql`
        SELECT m.co_mun AS "coMun",
               m.no_mun AS municipio,
               (SUM(m.valor * COALESCE(mat.valor, 1)) / NULLIF(SUM(COALESCE(mat.valor, 1)), 0))::float8 AS valor
        FROM medida m
        LEFT JOIN medida mat
          ON mat.co_mun = m.co_mun
         AND mat.ano = m.ano
         AND mat.ensino_rede = m.ensino_rede
         AND mat.ensino_tipo = m.ensino_tipo
         AND mat.fonte = 'censo_escolar'
         AND mat.variavel = ${VARIAVEL_MATRICULA}
        WHERE m.variavel = ${variavel}
          AND m.ano = ${params.ano}
          ${clausulas}
        GROUP BY m.co_mun, m.no_mun
        ORDER BY valor DESC
        LIMIT ${params.limite}
      `);
    }

    return prisma.$queryRaw<ItemRanking[]>(Prisma.sql`
      SELECT m.co_mun AS "coMun", m.no_mun AS municipio, SUM(m.valor)::float8 AS valor
      FROM medida m
      WHERE m.variavel = ${variavel}
        AND m.ano = ${params.ano}
        ${clausulas}
      GROUP BY m.co_mun, m.no_mun
      ORDER BY valor DESC
      LIMIT ${params.limite}
    `);
  },
};
