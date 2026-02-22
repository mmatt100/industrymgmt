import { getDb } from '../../lib/db';

type InsertOrderInput = {
  customerId: number;
  totalPrice: number;
};

type InsertOrderItemInput = {
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  lineTotal: number;
};

const insertOrder = (input: InsertOrderInput): number => {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO orders (customer_id, total_price) VALUES (?, ?)')
    .run(input.customerId, input.totalPrice);
  return Number(result.lastInsertRowid);
};

const insertOrderItem = (input: InsertOrderItemInput): void => {
  const db = getDb();
  db.prepare(
    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount_applied, line_total) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    input.orderId,
    input.productId,
    input.quantity,
    input.unitPrice,
    input.discountApplied,
    input.lineTotal,
  );
};

export const orderWriteRepository = {
  insertOrder,
  insertOrderItem,
};
