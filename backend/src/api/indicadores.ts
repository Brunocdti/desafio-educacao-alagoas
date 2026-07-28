import { RequestHandler } from 'express';
import { filtroBaseSchema } from '../lib/filtroQuery';
import { indicadoresStore } from '../coredb/indicadores';

export const indicadoresHandler: RequestHandler = async (req, res, next) => {
  try {
    const filtro = filtroBaseSchema.parse(req.query);
    res.json(await indicadoresStore.obterIndicadores(filtro));
  } catch (err) {
    next(err);
  }
};
