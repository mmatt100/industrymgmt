import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === undefined || value === '' ? undefined : value;

const envSchema = z.object({
  PORT: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : Number(value)),
    z.number().int().positive().finite().default(3000),
  ),
  SQLITE_DB_PATH: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default('data.sqlite'),
  ),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  ),
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(['development', 'test', 'production']).default('development'),
  ),
});

export const config = envSchema.parse(process.env);
