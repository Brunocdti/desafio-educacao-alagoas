import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { env } from './lib/env';
import { errorHandler } from './middleware/errorHandler';
import { openapiSpec } from './lib/openapiSpec';
import { uploadHandler, uploadMiddleware } from './api/upload';
import { filtrosHandler } from './api/filtros';
import { seriesHandler } from './api/series';
import { rankingHandler } from './api/ranking';
import { indicadoresHandler } from './api/indicadores';
import { dadosHandler } from './api/dados';
import { evolucaoHandler } from './api/evolucao';

export const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Todas as rotas da API registradas aqui, num lugar só (ver README, decisões de arquitetura).
app.post('/api/upload', uploadMiddleware, uploadHandler);
app.get('/api/filtros', filtrosHandler);
app.get('/api/series', seriesHandler);
app.get('/api/ranking', rankingHandler);
app.get('/api/indicadores', indicadoresHandler);
app.get('/api/dados', dadosHandler);
app.get('/api/evolucao', evolucaoHandler);

app.use(errorHandler);
