import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import {
  TODAS_VARIAVEIS,
  VARIAVEIS_PERCENTUAL,
  VARIAVEL_MATRICULA,
  aumentoEBom,
  redeEfetiva,
} from '../lib/dominio';
import { filtroEtapa, filtroMunicipios, filtroRede } from '../lib/whereBuilder';
import { EvolucaoStore, ItemEvolucao } from '../core/evolucao';

interface LinhaEvolucao {
  coMun: string;
  noMun: string;
  valorInicio: number | null;
  valorFim: number | null;
}

export const evolucaoStore: EvolucaoStore = {
  async obterEvolucao(variavel, params) {
    if (!TODAS_VARIAVEIS.includes(variavel)) {
      throw new AppError(`variavel desconhecida: ${variavel}`);
    }

    const rede = redeEfetiva(variavel, params.rede);
    const clausulas = Prisma.join(
      [filtroMunicipios(params.municipio), filtroRede(rede), filtroEtapa(params.etapa)],
      ' ',
    );

    const linhas = VARIAVEIS_PERCENTUAL.has(variavel)
      ? await prisma.$queryRaw<LinhaEvolucao[]>(Prisma.sql`
          SELECT
            m.co_mun AS "coMun",
            m.no_mun AS "noMun",
            (SUM(m.valor * COALESCE(mat.valor, 1)) FILTER (WHERE m.ano = ${params.anoInicio})
              / NULLIF(SUM(COALESCE(mat.valor, 1)) FILTER (WHERE m.ano = ${params.anoInicio}), 0))::float8 AS "valorInicio",
            (SUM(m.valor * COALESCE(mat.valor, 1)) FILTER (WHERE m.ano = ${params.anoFim})
              / NULLIF(SUM(COALESCE(mat.valor, 1)) FILTER (WHERE m.ano = ${params.anoFim}), 0))::float8 AS "valorFim"
          FROM medida m
          LEFT JOIN medida mat
            ON mat.co_mun = m.co_mun
           AND mat.ano = m.ano
           AND mat.ensino_rede = m.ensino_rede
           AND mat.ensino_tipo = m.ensino_tipo
           AND mat.fonte = 'censo_escolar'
           AND mat.variavel = ${VARIAVEL_MATRICULA}
          WHERE m.variavel = ${variavel} AND m.ano IN (${params.anoInicio}, ${params.anoFim})
            ${clausulas}
          GROUP BY m.co_mun, m.no_mun
        `)
      : await prisma.$queryRaw<LinhaEvolucao[]>(Prisma.sql`
          SELECT
            m.co_mun AS "coMun",
            m.no_mun AS "noMun",
            SUM(m.valor) FILTER (WHERE m.ano = ${params.anoInicio})::float8 AS "valorInicio",
            SUM(m.valor) FILTER (WHERE m.ano = ${params.anoFim})::float8 AS "valorFim"
          FROM medida m
          WHERE m.variavel = ${variavel} AND m.ano IN (${params.anoInicio}, ${params.anoFim})
            ${clausulas}
          GROUP BY m.co_mun, m.no_mun
        `);

    // Variável já percentual: comparar em pontos (diferença), não "% de um %". Variável
    // absoluta: comparar em variação percentual, senão município grande sempre domina o
    // ranking só por ter números maiores — mesmo motivo de não fazer média simples entre
    // municípios de porte diferente (ver "Decisões sobre tratamento dos dados" no README).
    const ehPercentual = VARIAVEIS_PERCENTUAL.has(variavel);
    const favoravel = aumentoEBom(variavel);
    const metrica = (item: ItemEvolucao) => (ehPercentual ? item.diferenca : (item.percentual ?? item.diferenca));

    const itens: ItemEvolucao[] = linhas
      .filter((l): l is LinhaEvolucao & { valorInicio: number; valorFim: number } =>
        l.valorInicio !== null && l.valorFim !== null,
      )
      .map((l) => ({
        coMun: l.coMun,
        noMun: l.noMun,
        valorInicio: l.valorInicio,
        valorFim: l.valorFim,
        diferenca: l.valorFim - l.valorInicio,
        percentual: l.valorInicio !== 0 ? ((l.valorFim - l.valorInicio) / l.valorInicio) * 100 : null,
      }))
      .sort((a, b) => (favoravel ? metrica(b) - metrica(a) : metrica(a) - metrica(b)))
      .slice(0, params.limite);

    return itens;
  },
};
