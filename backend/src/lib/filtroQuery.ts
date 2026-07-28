import { z } from 'zod';

/** Aceita `municipio=a,b` ou `municipio=a&municipio=b` e normaliza para string[]. */
const municipiosSchema = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v): string[] | undefined => {
    if (v === undefined) return undefined;
    const lista = Array.isArray(v) ? v : v.split(',');
    const limpa = lista.map((s) => s.trim()).filter(Boolean);
    return limpa.length > 0 ? limpa : undefined;
  });

export const filtroBaseSchema = z.object({
  municipio: municipiosSchema,
  anoInicio: z.coerce.number().int().optional(),
  anoFim: z.coerce.number().int().optional(),
  rede: z.string().trim().min(1).optional(),
  etapa: z.string().trim().min(1).optional(),
});

export type FiltroBase = z.infer<typeof filtroBaseSchema>;

export const paginacaoSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  tamanho: z.coerce.number().int().positive().max(500).default(50),
});
