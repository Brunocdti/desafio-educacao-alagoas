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
    const mensagem =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Arquivo excede o limite de 30MB.'
        : `Falha no upload: ${err.message}`;
    res.status(400).json({ erro: mensagem });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
};
