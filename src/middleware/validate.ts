import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from 'express';
import { z, type ZodTypeAny } from 'zod';
import { asyncHandler } from './async-handler';
import { ValidationError } from '../errors/app-error';

type ValidationSchema = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

type TypedRequest<S extends ValidationSchema> = Request<
  S['params'] extends ZodTypeAny ? z.infer<S['params']> : Record<string, never>,
  unknown,
  S['body'] extends ZodTypeAny ? z.infer<S['body']> : unknown,
  S['query'] extends ZodTypeAny ? z.infer<S['query']> : Record<string, never>
>;

export const validate = (schema: ValidationSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Record<string, unknown> = {};
    let hasError = false;

    if (schema.body) {
      const result = schema.body.safeParse(req.body);
      if (!result.success) {
        errors.body = result.error.flatten();
        hasError = true;
      } else {
        (req as Request).body = result.data;
      }
    }

    if (schema.params) {
      const result = schema.params.safeParse(req.params);
      if (!result.success) {
        errors.params = result.error.flatten();
        hasError = true;
      } else {
        (req as Request).params = result.data;
      }
    }

    if (schema.query) {
      const result = schema.query.safeParse(req.query);
      if (!result.success) {
        errors.query = result.error.flatten();
        hasError = true;
      } else {
        (req as Request).query = result.data;
      }
    }

    if (hasError) {
      throw new ValidationError(errors);
    }

    next();
  };
};

export const validatedHandler = <S extends ValidationSchema>(
  schema: S,
  handler: (req: TypedRequest<S>, res: Response, next: NextFunction) => unknown,
): RequestHandler => {
  return asyncHandler(async (req, res, next) => {
    validate(schema)(req, res, (err?: unknown) => {
      if (err) {
        throw err;
      }
    });

    await handler(req as TypedRequest<S>, res, next);
  });
};
