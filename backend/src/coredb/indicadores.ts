import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { VARIAVEL_MATRICULA, redeEfetiva } from '../lib/dominio';
import { filtroAno, filtroAnoIntervalo, filtroEtapa, filtroMunicipios, filtroRede } from '../lib/whereBuilder';
import { FiltroBase } from '../lib/filtroQuery';
import { Indicadores, IndicadoresStore } from '../core/indicadores';

async function mediaPonderada(
  variavel: string,
  ano: number,
  rede: string,
  filtro: FiltroBase,
): Promise<number | null> {
  const clausulas = Prisma.join(
    [filtroMunicipios(filtro.municipio), filtroRede(rede), filtroEtapa(filtro.etapa), filtroAno(ano)],
    ' ',
  );
  const rows = await prisma.$queryRaw<{ valor: number | null }[]>(Prisma.sql`
    SELECT (SUM(m.valor * COALESCE(mat.valor, 1)) / NULLIF(SUM(COALESCE(mat.valor, 1)), 0))::float8 AS valor
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
  `);
  return rows[0]?.valor ?? null;
}

async function somaMatriculas(
  ano: number,
  rede: string,
  filtro: FiltroBase,
): Promise<number | null> {
  const clausulas = Prisma.join(
    [filtroMunicipios(filtro.municipio), filtroRede(rede), filtroEtapa(filtro.etapa), filtroAno(ano)],
    ' ',
  );
  const rows = await prisma.$queryRaw<{ valor: number | null }[]>(Prisma.sql`
    SELECT SUM(m.valor)::float8 AS valor
    FROM medida m
    WHERE m.variavel = ${VARIAVEL_MATRICULA}
      ${clausulas}
  `);
  return rows[0]?.valor ?? null;
}

export const indicadoresStore: IndicadoresStore = {
  async obterIndicadores(filtro: FiltroBase): Promise<Indicadores> {
    const redeEducacional = redeEfetiva(VARIAVEL_MATRICULA, filtro.rede);

    const clausulasAno = Prisma.join(
      [
        filtroMunicipios(filtro.municipio),
        filtroRede(redeEducacional),
        filtroAnoIntervalo(filtro.anoInicio, filtro.anoFim),
      ],
      ' ',
    );
    const anoRows = await prisma.$queryRaw<{ ano: number | null }[]>(Prisma.sql`
      SELECT MAX(m.ano) AS ano FROM medida m
      WHERE m.variavel = ${VARIAVEL_MATRICULA} ${clausulasAno}
    `);
    const anoReferencia = anoRows[0]?.ano ?? null;

    if (anoReferencia === null) {
      return {
        anoReferencia: null,
        totalMatriculas: null,
        totalEscolas: { valor: null, rotulo: filtro.etapa ? 'escolas' : 'ofertas de ensino' },
        taxaAprovacaoMedia: { valor: null, metodo: 'ponderada por matrícula' },
        taxaAbandonoMedia: { valor: null, metodo: 'ponderada por matrícula' },
        variacaoMatriculasAnoAAno: null,
        observacao: 'Sem dado no período selecionado.',
      };
    }

    const [totalMatriculas, totalEscolasRows, taxaAprovacaoMedia, taxaAbandonoMedia, anoAnteriorRows] =
      await Promise.all([
        somaMatriculas(anoReferencia, redeEducacional, filtro),
        prisma.$queryRaw<{ valor: number | null }[]>(Prisma.sql`
          SELECT SUM(m.valor)::float8 AS valor
          FROM medida m
          WHERE m.variavel = 'Escolas'
            ${Prisma.join(
              [
                filtroMunicipios(filtro.municipio),
                filtroRede(redeEducacional),
                filtroEtapa(filtro.etapa),
                filtroAno(anoReferencia),
              ],
              ' ',
            )}
        `),
        mediaPonderada('Taxa de Aprovação', anoReferencia, redeEducacional, filtro),
        mediaPonderada('Taxa de Abandono', anoReferencia, redeEducacional, filtro),
        prisma.$queryRaw<{ ano: number | null }[]>(Prisma.sql`
          SELECT MAX(m.ano) AS ano FROM medida m
          WHERE m.variavel = ${VARIAVEL_MATRICULA} AND m.ano < ${anoReferencia} ${clausulasAno}
        `),
      ]);

    const anoAnterior = anoAnteriorRows[0]?.ano ?? null;
    let variacaoMatriculasAnoAAno: Indicadores['variacaoMatriculasAnoAAno'] = null;
    if (anoAnterior !== null) {
      const valorAnterior = await somaMatriculas(anoAnterior, redeEducacional, filtro);
      if (valorAnterior !== null && valorAnterior !== 0 && totalMatriculas !== null) {
        variacaoMatriculasAnoAAno = {
          anoAnterior,
          valorAnterior,
          percentual: ((totalMatriculas - valorAnterior) / valorAnterior) * 100,
        };
      }
    }

    return {
      anoReferencia,
      totalMatriculas,
      totalEscolas: {
        valor: totalEscolasRows[0]?.valor ?? null,
        rotulo: filtro.etapa ? 'escolas' : 'ofertas de ensino',
      },
      taxaAprovacaoMedia: { valor: taxaAprovacaoMedia, metodo: 'ponderada por matrícula' },
      taxaAbandonoMedia: { valor: taxaAbandonoMedia, metodo: 'ponderada por matrícula' },
      variacaoMatriculasAnoAAno,
    };
  },
};
