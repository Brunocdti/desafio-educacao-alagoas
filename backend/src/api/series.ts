import { Router } from 'express';
import { z } from 'zod';
import { filtroBaseSchema } from '../lib/filtroQuery';
import { seriesStore } from '../coredb/series';

export const seriesRouter = Router();

const querySchema = filtroBaseSchema.extend({
  variavel: z.string().trim().min(1, 'variavel é obrigatório'),
});

seriesRouter.get('/series', async (req, res, next) => {
  try {
    const { variavel, ...filtro } = querySchema.parse(req.query);
    const resultado = await seriesStore.obterSerie(variavel, filtro);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
});
