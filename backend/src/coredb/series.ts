import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { TODAS_VARIAVEIS, VARIAVEIS_PERCENTUAL, VARIAVEL_MATRICULA, redeEfetiva } from '../lib/dominio';
import { filtroEtapa, filtroMunicipios, filtroRede } from '../lib/whereBuilder';
import { PontoSerie, SeriesStore } from '../core/series';

export const seriesStore: SeriesStore = {
  async obterSerie(variavel, filtro) {
    if (!TODAS_VARIAVEIS.includes(variavel)) {
      throw new AppError(`variavel desconhecida: ${variavel}`);
    }

    const rede = redeEfetiva(variavel, filtro.rede);
    const clausulas = Prisma.join(
      [filtroMunicipios(filtro.municipio), filtroRede(rede), filtroEtapa(filtro.etapa)],
      ' ',
    );
    const observacao =
      variavel === 'Escolas' && !filtro.etapa
        ? 'Sem etapa fixada, o valor soma ofertas de ensino entre etapas — uma escola com mais de uma etapa é contada mais de uma vez. Não é o total de escolas do município.'
        : undefined;

    if (VARIAVEIS_PERCENTUAL.has(variavel)) {
      // Média ponderada por matrícula quando o recorte cruza mais de um município.
      // Quando não há matrícula correspondente (ex.: taxas de alfabetização, que não
      // têm par em censo_escolar), o peso cai pra 1 e o resultado vira média simples.
      const rows = await prisma.$queryRaw<PontoSerie[]>(Prisma.sql`
        SELECT m.ano AS ano,
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
          ${clausulas}
        GROUP BY m.ano
        ORDER BY m.ano
      `);
      return { pontos: rows, observacao };
    }

    const rows = await prisma.$queryRaw<PontoSerie[]>(Prisma.sql`
      SELECT m.ano AS ano, SUM(m.valor)::float8 AS valor
      FROM medida m
      WHERE m.variavel = ${variavel}
        ${clausulas}
      GROUP BY m.ano
      ORDER BY m.ano
    `);
    return { pontos: rows, observacao };
  },
};
