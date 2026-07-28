import { RequestHandler } from 'express';
import { filtrosStore } from '../coredb/filtros';

export const filtrosHandler: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await filtrosStore.obterFiltros());
  } catch (err) {
    next(err);
  }
};
