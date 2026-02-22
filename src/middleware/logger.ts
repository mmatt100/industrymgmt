import pinoHttp from 'pino-http';
import { logger } from '../lib/logger';

export const loggerMiddleware = pinoHttp({
  logger,
  genReqId: (req) => (req as { id: string }).id,
  customProps: (req) => ({ requestId: (req as { id?: string }).id }),
});
