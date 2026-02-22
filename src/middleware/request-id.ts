import { randomUUID } from 'crypto';
import { type NextFunction, type Request, type Response } from 'express';

const getRequestIdFromHeader = (header: string | string[] | undefined) => {
  if (typeof header === 'string' && header.length > 0) {
    return header;
  }
  if (Array.isArray(header) && header[0]) {
    return header[0];
  }
  return undefined;
};

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const headerId = getRequestIdFromHeader(req.headers['x-request-id']);
  const existingId = typeof req.id === 'string' ? req.id : undefined;
  const id = existingId ?? headerId ?? randomUUID();
  (req as { id?: string }).id = id;
  res.setHeader('x-request-id', id);
  next();
};
