import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { lerCabecalho, linhasDeDados, validarCabecalho, zipHeaderRow } from '../lib/csvParser';
import {
  ANO_MAX,
  ANO_MIN,
  ENSINO_REDES,
  ENSINO_TIPOS,
  FONTES,
  VARIAVEIS_PERCENTUAL,
  VARIAVEIS_POR_FONTE,
} from '../lib/dominio';
import { ResumoUpload, UploadStore } from '../core/upload';

const naoVazio = (label: string) =>
  z
    .string({ required_error: `${label} vazio` })
    .trim()
    .min(1, `${label} vazio`);

export const csvRowSchema = z
  .object({
    co_mun: naoVazio('co_mun').regex(/^\d{7}$/, 'co_mun deve ter 7 dígitos'),
    no_mun: naoVazio('no_mun'),
    ano: naoVazio('ano')
      .pipe(z.coerce.number({ invalid_type_error: 'ano não numérico' }))
      .pipe(
        z
          .number()
          .int('ano deve ser inteiro')
          .refine((v) => v >= ANO_MIN && v <= ANO_MAX, `ano fora da faixa ${ANO_MIN}-${ANO_MAX}`),
      ),
    fonte: naoVazio('fonte').refine(
      (v) => (FONTES as readonly string[]).includes(v),
      (v) => ({ message: `fonte desconhecida: ${v}` }),
    ),
    variavel: naoVazio('variavel'),
    ensino_rede: naoVazio('ensino_rede').refine(
      (v) => (ENSINO_REDES as readonly string[]).includes(v),
      (v) => ({ message: `ensino_rede desconhecida: ${v}` }),
    ),
    ensino_tipo: naoVazio('ensino_tipo').refine(
      (v) => (ENSINO_TIPOS as readonly string[]).includes(v),
      (v) => ({ message: `ensino_tipo desconhecido: ${v}` }),
    ),
    valor: naoVazio('valor').pipe(
      z.coerce.number({ invalid_type_error: 'valor não numérico' }).finite('valor não numérico'),
    ),
  })
  .superRefine((row, ctx) => {
    const variaveisValidas = VARIAVEIS_POR_FONTE[row.fonte as keyof typeof VARIAVEIS_POR_FONTE];
    if (!variaveisValidas?.includes(row.variavel)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `variável "${row.variavel}" não pertence à fonte "${row.fonte}"`,
        path: ['variavel'],
      });
      return;
    }
    if (VARIAVEIS_PERCENTUAL.has(row.variavel) && (row.valor < 0 || row.valor > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `valor fora da faixa 0-100 para variável percentual "${row.variavel}"`,
        path: ['valor'],
      });
      return;
    }
    if (!VARIAVEIS_PERCENTUAL.has(row.variavel) && row.valor < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `valor negativo para contagem absoluta "${row.variavel}"`,
        path: ['valor'],
      });
    }
  });

export type CsvRow = z.infer<typeof csvRowSchema>;

const TAMANHO_LOTE = 2000;
const MAX_ERROS_AMOSTRA = 50;

/**
 * Reimportação = substitui: a transação apaga tudo antes de inserir o novo arquivo.
 * Decisão documentada no README (seção "reimportação").
 */
export const uploadStore: UploadStore = {
  async processarUpload(buffer: Buffer): Promise<ResumoUpload> {
    const header = await lerCabecalho(buffer);
    validarCabecalho(header);

    let linhasLidas = 0;
    let linhasImportadas = 0;
    let linhasRejeitadas = 0;
    const erros: { linha: number; motivo: string }[] = [];

    await prisma.$transaction(
      async (tx) => {
        await tx.medida.deleteMany({});

        let lote: Prisma.MedidaCreateManyInput[] = [];

        const flush = async () => {
          if (lote.length === 0) return;
          await tx.medida.createMany({ data: lote });
          linhasImportadas += lote.length;
          lote = [];
        };

        for await (const { numeroLinha, registro } of linhasDeDados(buffer)) {
          linhasLidas++;
          const bruto = zipHeaderRow(header, registro);
          const resultado = csvRowSchema.safeParse(bruto);

          if (!resultado.success) {
            linhasRejeitadas++;
            if (erros.length < MAX_ERROS_AMOSTRA) {
              erros.push({
                linha: numeroLinha,
                motivo: resultado.error.issues[0]?.message ?? 'linha inválida',
              });
            }
            continue;
          }

          const row = resultado.data;
          lote.push({
            coMun: row.co_mun,
            noMun: row.no_mun,
            ano: row.ano,
            fonte: row.fonte,
            variavel: row.variavel,
            ensinoRede: row.ensino_rede,
            ensinoTipo: row.ensino_tipo,
            valor: row.valor,
          });

          if (lote.length >= TAMANHO_LOTE) {
            await flush();
          }
        }

        await flush();
      },
      { timeout: 120_000 },
    );

    if (linhasRejeitadas > erros.length) {
      erros.push({ linha: -1, motivo: `... e mais ${linhasRejeitadas - erros.length} erro(s)` });
    }

    return { linhasLidas, linhasImportadas, linhasRejeitadas, erros };
  },
};
