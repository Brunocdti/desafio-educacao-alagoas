import express from 'express';
import cors from 'cors';
import { env } from './lib/env';
import { errorHandler } from './middleware/errorHandler';
import { uploadRouter } from './api/upload';
import { filtrosRouter } from './api/filtros';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', uploadRouter);
app.use('/api', filtrosRouter);

app.use(errorHandler);
