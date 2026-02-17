import { z } from 'zod';

export const contactIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const contactBodySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().trim().min(1).optional().nullable(),
});
