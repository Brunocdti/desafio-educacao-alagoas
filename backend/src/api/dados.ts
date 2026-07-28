import { RequestHandler } from 'express';
import { z } from 'zod';
import { filtroBaseSchema, paginacaoSchema } from '../lib/filtroQuery';
import { dadosStore } from '../coredb/dados';

const querySchema = filtroBaseSchema.merge(paginacaoSchema).extend({
  variavel: z.string().trim().min(1).optional(),
});

export const dadosHandler: RequestHandler = async (req, res, next) => {
  try {
    const params = querySchema.parse(req.query);
    res.json(await dadosStore.obterDados(params));
  } catch (err) {
    next(err);
  }
};
