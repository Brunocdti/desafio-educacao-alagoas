import { z } from 'zod';

const TAMANHO_MAXIMO_MB = 30;

export const arquivoCsvSchema = z
  .instanceof(File, { message: 'Selecione um arquivo.' })
  .refine((arquivo) => arquivo.name.toLowerCase().endsWith('.csv'), {
    message: 'O arquivo precisa ter extensão .csv.',
  })
  .refine((arquivo) => arquivo.size > 0, { message: 'O arquivo está vazio.' })
  .refine((arquivo) => arquivo.size <= TAMANHO_MAXIMO_MB * 1024 * 1024, {
    message: `O arquivo excede o limite de ${TAMANHO_MAXIMO_MB}MB.`,
  });
