import { Router } from 'express';
import { filtrosStore } from '../coredb/filtros';

export const filtrosRouter = Router();

filtrosRouter.get('/filtros', async (_req, res, next) => {
  try {
    res.json(await filtrosStore.obterFiltros());
  } catch (err) {
    next(err);
  }
});
