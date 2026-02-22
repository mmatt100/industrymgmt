export type AppErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL';

export class AppError extends Error {
  code: AppErrorCode;
  details?: Record<string, unknown>;

  constructor(code: AppErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(details?: Record<string, unknown>) {
    super('VALIDATION', 'Validation failed', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: Record<string, unknown>) {
    super('CONFLICT', message, details);
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal error', details?: Record<string, unknown>) {
    super('INTERNAL', message, details);
  }
}
