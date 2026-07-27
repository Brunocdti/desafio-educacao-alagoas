import { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ erro: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const primeira = err.issues[0];
    res.status(400).json({
      erro: primeira ? `${primeira.path.join('.')}: ${primeira.message}` : 'parâmetros inválidos',
    });
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ erro: `Falha no upload: ${err.message}` });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
};
