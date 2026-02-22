import { NotFoundError } from '../../../errors/app-error';
import { orderReadRepository } from '../order.read-repository';
import type { OrderWithItems } from '../order.read-repository';

export const getOrderQueryHandler = (id: number): OrderWithItems => {
  const order = orderReadRepository.getOrderById(id);
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  return order;
};
