import { Router } from 'express';
import { obterFiltros } from '../core/filtros';

export const filtrosRouter = Router();

filtrosRouter.get('/filtros', async (_req, res, next) => {
  try {
    res.json(await obterFiltros());
  } catch (err) {
    next(err);
  }
});
