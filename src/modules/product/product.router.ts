import { Router } from 'express';
import { validatedHandler } from '../../middleware/validate';
import {
  createProductBodySchema,
  productIdParamsSchema,
  stockChangeBodySchema,
} from './product.schemas';
import {
  createProduct,
  listProducts,
  restockProduct,
  sellProduct,
} from './product.service';

const router = Router();

router.get(
  '/',
  validatedHandler({}, async (_req, res) => {
    const products = await listProducts();
    res.json(products);
  }),
);

router.post(
  '/',
  validatedHandler({ body: createProductBodySchema }, async (req, res) => {
    const { name, description, price, stock, category } = req.body;
    const product = await createProduct({
      name,
      description,
      price,
      stock,
      category,
    });
    res.status(201).json(product);
  }),
);

router.post(
  '/:id/restock',
  validatedHandler(
    { params: productIdParamsSchema, body: stockChangeBodySchema },
    async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;
      const product = await restockProduct(id, quantity);
      res.json(product);
    },
  ),
);

router.post(
  '/:id/sell',
  validatedHandler(
    { params: productIdParamsSchema, body: stockChangeBodySchema },
    async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;
      const product = await sellProduct(id, quantity);
      res.json(product);
    },
  ),
);

export default router;
