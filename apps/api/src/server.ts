import 'dotenv/config';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';
import { syncChainProjection } from './modules/chain/chain.service.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'TraceChain API started');
});

let chainSyncTimer: NodeJS.Timeout | undefined;

async function bootstrapChainSync() {
  if (!env.CONTRACT_ADDRESS || !env.RPC_URL) {
    logger.warn('Chain sync disabled because CONTRACT_ADDRESS or RPC_URL is missing');
    return;
  }

  try {
    await syncChainProjection();
  } catch (error) {
    logger.error({ err: error }, 'Initial chain projection sync failed');
  }

  chainSyncTimer = setInterval(() => {
    void syncChainProjection().catch((error) => {
      logger.error({ err: error }, 'Scheduled chain projection sync failed');
    });
  }, env.CHAIN_SYNC_INTERVAL_MS);
}

void bootstrapChainSync();

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down TraceChain API');

  if (chainSyncTimer) {
    clearInterval(chainSyncTimer);
  }

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
