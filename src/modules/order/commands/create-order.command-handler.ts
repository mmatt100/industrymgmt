import { z } from 'zod';
import { getDb } from '../../../lib/db';
import { NotFoundError, ValidationError } from '../../../errors/app-error';
import { orderReadRepository } from '../order.read-repository';
import type { OrderWithItems } from '../order.read-repository';
import { orderWriteRepository } from '../order.write-repository';
import { productRepository } from '../../product/product.repository';
import { createOrderBodySchema } from '../order.schemas';
import { pricingService } from '../services/pricing.service';

type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
type ProductInput = CreateOrderBody['products'][number];

export const createOrderCommandHandler = (
  command: CreateOrderBody,
): OrderWithItems => {
  const customer = orderReadRepository.getCustomerById(command.customerId);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const aggregated = aggregateProducts(command.products);
  const productIds = [...aggregated.keys()];

  const products = orderReadRepository.getProductsByIds(productIds);
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const id of productIds) {
    if (!productMap.has(id)) {
      throw new NotFoundError(`Product with id ${id} not found`);
    }
  }

  for (const [productId, quantity] of aggregated) {
    const product = productMap.get(productId)!;
    if (quantity > product.stock) {
      throw new ValidationError({
        stock: `Insufficient stock for product ${productId}: requested ${quantity}, available ${product.stock}`,
      });
    }
  }

  const { lineItems, totalPrice } = pricingService.calculateOrderTotal({
    items: [...aggregated].map(([productId, quantity]) => {
      const product = productMap.get(productId)!;
      return {
        productId,
        unitPrice: product.price,
        quantity,
        category: product.category,
      };
    }),
    location: customer.location,
    date: new Date(),
  });

  const db = getDb();
  const orderId = db.transaction(() => {
    for (const [productId, quantity] of aggregated) {
      const changed = productRepository.deductStock(productId, quantity);
      if (changed === 0) {
        throw new ValidationError({
          stock: `Failed to deduct stock for product ${productId}`,
        });
      }
    }

    const id = orderWriteRepository.insertOrder({
      customerId: command.customerId,
      totalPrice,
    });

    for (const item of lineItems) {
      orderWriteRepository.insertOrderItem({
        orderId: id,
        ...item,
      });
    }

    return id;
  })();

  return orderReadRepository.getOrderById(orderId)!;
};

const aggregateProducts = (products: ProductInput[]): Map<number, number> => {
  const map = new Map<number, number>();
  for (const { productId, quantity } of products) {
    map.set(productId, (map.get(productId) ?? 0) + quantity);
  }
  return map;
};
