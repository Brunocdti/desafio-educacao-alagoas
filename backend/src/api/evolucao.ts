import { RequestHandler } from 'express';
import { z } from 'zod';
import { filtroBaseSchema } from '../lib/filtroQuery';
import { evolucaoStore } from '../coredb/evolucao';

const querySchema = filtroBaseSchema
  .omit({ anoInicio: true, anoFim: true })
  .extend({
    variavel: z.string().trim().min(1, 'variavel é obrigatório'),
    anoInicio: z.coerce.number().int(),
    anoFim: z.coerce.number().int(),
    limite: z.coerce.number().int().positive().max(200).default(15),
  });

export const evolucaoHandler: RequestHandler = async (req, res, next) => {
  try {
    const { variavel, ...params } = querySchema.parse(req.query);
    const resultado = await evolucaoStore.obterEvolucao(variavel, params);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
};
