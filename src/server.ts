import app from './app';
import { closeDb } from './lib/db';
import { config } from './lib/config';
import { logger } from './lib/logger';
const port = config.PORT;

const server = app.listen(port, () => {
  logger.info({ port }, 'Server listening');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Shutdown signal received');
  server.close(async () => {
    try {
      await closeDb();
    } catch (err) {
      logger.error({ err }, 'Failed to close database');
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
