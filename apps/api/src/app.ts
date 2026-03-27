import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'node:url';

import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { attachRequestId } from './middleware/request-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.router.js';
import { batchesRouter } from './modules/batches/batches.router.js';
import { chainRouter } from './modules/chain/chain.router.js';
import { documentsRouter } from './modules/documents/documents.router.js';
import { organizationsRouter } from './modules/organizations/organizations.router.js';
import { statsRouter } from './modules/stats/stats.router.js';
import { telemetryRouter } from './modules/telemetry/telemetry.router.js';

const openApiPath = fileURLToPath(new URL('../openapi/openapi.yaml', import.meta.url));
const swaggerDocument = YAML.load(openApiPath);

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(attachRequestId);
  app.use(
    pinoHttp({
      logger,
      customProps(request) {
        return { requestId: request.requestId };
      }
    })
  );

  app.get('/health', (_request, response) => {
    response.json({
      service: 'tracechain-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      chainSyncEnabled: Boolean(env.CONTRACT_ADDRESS && env.RPC_URL)
    });
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.use('/api/auth', authRouter);
  app.use('/api/organizations', organizationsRouter);
  app.use('/api/batches', batchesRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/telemetry', telemetryRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/chain', chainRouter);

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
