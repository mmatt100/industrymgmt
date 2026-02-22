import { type NextFunction, type Request, type Response } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../lib/logger';

const statusByCode: Record<AppError['code'], number> = {
  VALIDATION: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL: 500,
};
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) => {
  const requestId = req.id;
  if (err instanceof AppError) {
    const status = statusByCode[err.code] ?? 500;
    const body: Record<string, unknown> = { error: err.message, requestId };
    if (err.details) {
      body.details = err.details;
    }

    res.status(status).json(body);
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error', requestId });
};
