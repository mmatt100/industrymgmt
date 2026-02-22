import { orderReadRepository } from '../order.read-repository';
import type { OrderRow } from '../order.read-repository';

export const listOrdersQueryHandler = (): OrderRow[] => {
  return orderReadRepository.listOrders();
};
