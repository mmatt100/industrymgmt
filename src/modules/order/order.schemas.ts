import { z } from 'zod';

export const createOrderBodySchema = z.object({
  customerId: z.number().int().positive(),
  products: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
