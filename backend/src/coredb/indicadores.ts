import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { VARIAVEL_MATRICULA, redeEfetiva } from '../lib/dominio';
import { filtroAnoIntervalo, filtroEtapa, filtroMunicipios, filtroRede } from '../lib/whereBuilder';
import { FiltroBase } from '../lib/filtroQuery';
import { Indicadores, IndicadoresStore } from '../core/indicadores';

/**
 * 3 idas ao banco (era até 7): uma pros anos de referência, uma pra
 * matrículas+escolas dos dois anos juntos (FILTER em vez de query separada),
 * uma pras duas taxas ponderadas juntas. Com a base completa (145 mil linhas),
 * cada round-trip ao Neon custa ~150-200ms — 7 delas estourava o 1s exigido
 * pelos endpoints de agregação; 3 fica com folga confortável.
 */
export const indicadoresStore: IndicadoresStore = {
  async obterIndicadores(filtro: FiltroBase): Promise<Indicadores> {
    const redeEducacional = redeEfetiva(VARIAVEL_MATRICULA, filtro.rede);

    const clausulasFiltro = Prisma.join(
      [
        filtroMunicipios(filtro.municipio),
        filtroRede(redeEducacional),
        filtroAnoIntervalo(filtro.anoInicio, filtro.anoFim),
      ],
      ' ',
    );

    const [anos] = await prisma.$queryRaw<{ anoReferencia: number | null; anoAnterior: number | null }[]>(
      Prisma.sql`
        WITH ref AS (
          SELECT MAX(m.ano) AS ano_referencia
          FROM medida m
          WHERE m.variavel = ${VARIAVEL_MATRICULA} ${clausulasFiltro}
        )
        SELECT
          ref.ano_referencia AS "anoReferencia",
          (
            SELECT MAX(m.ano) FROM medida m
            WHERE m.variavel = ${VARIAVEL_MATRICULA}
              AND m.ano < ref.ano_referencia
              ${clausulasFiltro}
          ) AS "anoAnterior"
        FROM ref
      `,
    );
    const anoReferencia = anos?.anoReferencia ?? null;

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
    const anoAnterior = anos.anoAnterior ?? null;

    const clausulasSemAno = Prisma.join(
      [filtroMunicipios(filtro.municipio), filtroRede(redeEducacional), filtroEtapa(filtro.etapa)],
      ' ',
    );
    const anosParaBuscar = anoAnterior !== null ? [anoReferencia, anoAnterior] : [anoReferencia];

    const [porAno, taxas] = await Promise.all([
      prisma.$queryRaw<{ ano: number; matriculas: number | null; escolas: number | null }[]>(Prisma.sql`
        SELECT
          m.ano AS ano,
          SUM(m.valor) FILTER (WHERE m.variavel = ${VARIAVEL_MATRICULA})::float8 AS matriculas,
          SUM(m.valor) FILTER (WHERE m.variavel = 'Escolas')::float8 AS escolas
        FROM medida m
        WHERE m.ano IN (${Prisma.join(anosParaBuscar)})
          ${clausulasSemAno}
        GROUP BY m.ano
      `),
      prisma.$queryRaw<{ taxaAprovacao: number | null; taxaAbandono: number | null }[]>(Prisma.sql`
        SELECT
          (SUM(m.valor * COALESCE(mat.valor, 1)) FILTER (WHERE m.variavel = 'Taxa de Aprovação')
            / NULLIF(SUM(COALESCE(mat.valor, 1)) FILTER (WHERE m.variavel = 'Taxa de Aprovação'), 0))::float8 AS "taxaAprovacao",
          (SUM(m.valor * COALESCE(mat.valor, 1)) FILTER (WHERE m.variavel = 'Taxa de Abandono')
            / NULLIF(SUM(COALESCE(mat.valor, 1)) FILTER (WHERE m.variavel = 'Taxa de Abandono'), 0))::float8 AS "taxaAbandono"
        FROM medida m
        LEFT JOIN medida mat
          ON mat.co_mun = m.co_mun
         AND mat.ano = m.ano
         AND mat.ensino_rede = m.ensino_rede
         AND mat.ensino_tipo = m.ensino_tipo
         AND mat.fonte = 'censo_escolar'
         AND mat.variavel = ${VARIAVEL_MATRICULA}
        WHERE m.variavel IN ('Taxa de Aprovação', 'Taxa de Abandono') AND m.ano = ${anoReferencia}
          ${clausulasSemAno}
      `),
    ]);

    const taxa = taxas[0];
    const linhaReferencia = porAno.find((l) => l.ano === anoReferencia);
    const linhaAnterior = anoAnterior !== null ? porAno.find((l) => l.ano === anoAnterior) : undefined;
    const totalMatriculas = linhaReferencia?.matriculas ?? null;

    let variacaoMatriculasAnoAAno: Indicadores['variacaoMatriculasAnoAAno'] = null;
    if (anoAnterior !== null && linhaAnterior?.matriculas != null && linhaAnterior.matriculas !== 0 && totalMatriculas !== null) {
      variacaoMatriculasAnoAAno = {
        anoAnterior,
        valorAnterior: linhaAnterior.matriculas,
        percentual: ((totalMatriculas - linhaAnterior.matriculas) / linhaAnterior.matriculas) * 100,
      };
    }

    return {
      anoReferencia,
      totalMatriculas,
      totalEscolas: {
        valor: linhaReferencia?.escolas ?? null,
        rotulo: filtro.etapa ? 'escolas' : 'ofertas de ensino',
      },
      taxaAprovacaoMedia: { valor: taxa?.taxaAprovacao ?? null, metodo: 'ponderada por matrícula' },
      taxaAbandonoMedia: { valor: taxa?.taxaAbandono ?? null, metodo: 'ponderada por matrícula' },
      variacaoMatriculasAnoAAno,
    };
  },
};
