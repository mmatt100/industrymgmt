import app from './app';
import { closeDb } from './lib/db';
import { config } from './lib/config';
import { logger } from './lib/logger';
const port = config.PORT;

const server = app.listen(port, () => {
  logger.info({ port }, 'Server listening');
});

const SHUTDOWN_TIMEOUT_MS = 10_000;
let isShuttingDown = false;

const shutdown = (signal: string, exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  logger.info({ signal }, 'Shutdown signal received');

  const timeout = setTimeout(() => {
    logger.fatal({ signal }, 'Forced shutdown');
    process.exit(exitCode === 0 ? 1 : exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  if (typeof timeout.unref === 'function') {
    timeout.unref();
  }

  const finishShutdown = async () => {
    try {
      await closeDb();
    } catch (err) {
      logger.error({ err }, 'Failed to close database');
    }
    clearTimeout(timeout);
    process.exit(exitCode);
  };

  try {
    server.close(() => {
      void finishShutdown();
    });
  } catch (err) {
    logger.error({ err }, 'Failed to close server');
    void finishShutdown();
  }
};

server.on('error', (err) => {
  logger.fatal({ err }, 'Server error');
  shutdown('SERVER_ERROR', 1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  shutdown('uncaughtException', 1);
});
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  shutdown('unhandledRejection', 1);
});
