import { Router } from 'express';
import { validatedHandler } from '../../middleware/validate';
import { createOrderBodySchema, orderIdParamsSchema } from './order.schemas';
import { createOrderCommandHandler } from './commands/create-order.command-handler';
import { listOrdersQueryHandler } from './queries/list-orders.query-handler';
import { getOrderQueryHandler } from './queries/get-order.query-handler';

const router = Router();

router.post(
  '/',
  validatedHandler({ body: createOrderBodySchema }, async (req, res) => {
    const { customerId, products } = req.body;
    const order = createOrderCommandHandler({ customerId, products });
    res.status(201).json(order);
  }),
);

router.get(
  '/',
  validatedHandler({}, async (_req, res) => {
    const orders = listOrdersQueryHandler();
    res.json(orders);
  }),
);

router.get(
  '/:id',
  validatedHandler({ params: orderIdParamsSchema }, async (req, res) => {
    const { id } = req.params;
    const order = getOrderQueryHandler(id);
    res.json(order);
  }),
);

export default router;
