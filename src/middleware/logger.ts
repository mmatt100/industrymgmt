import { randomUUID } from 'crypto';
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

export const loggerMiddleware = pinoHttp({
  logger,
  genReqId: (req) => {
    const existingId = (req as { id?: string }).id;
    if (existingId) {
      return existingId;
    }
    const id = randomUUID();
    (req as { id?: string }).id = id;
    return id;
  },
  customProps: (req) => ({ requestId: (req as { id?: string }).id }),
});
