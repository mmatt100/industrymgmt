import { z } from 'zod';

export const productIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const categoryEnum = z.enum(['electronics', 'clothing', 'food', 'books']);

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1).max(50),
  price: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
  category: categoryEnum,
});

export const stockChangeBodySchema = z.object({
  quantity: z.number().int().positive(),
});
