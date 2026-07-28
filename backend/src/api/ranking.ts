import { RequestHandler } from 'express';
import { z } from 'zod';
import { filtroBaseSchema } from '../lib/filtroQuery';
import { rankingStore } from '../coredb/ranking';

const querySchema = filtroBaseSchema.extend({
  variavel: z.string().trim().min(1, 'variavel é obrigatório'),
  ano: z.coerce.number().int(),
  limite: z.coerce.number().int().positive().max(200).default(20),
});

export const rankingHandler: RequestHandler = async (req, res, next) => {
  try {
    const { variavel, ...params } = querySchema.parse(req.query);
    const resultado = await rankingStore.obterRanking(variavel, params);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
};
