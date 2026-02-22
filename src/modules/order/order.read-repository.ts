import { getDb } from '../../lib/db';
import type { Product } from '../product/product.repository';

export type Customer = {
  id: number;
  name: string;
  location: string;
};

export type OrderRow = {
  id: number;
  customerId: number;
  totalPrice: number;
  createdAt: string;
};

export type OrderItemRow = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountApplied: number;
  lineTotal: number;
};

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

const ORDER_COLUMNS =
  'id, customer_id AS customerId, total_price AS totalPrice, created_at AS createdAt';

const ITEM_COLUMNS =
  'id, order_id AS orderId, product_id AS productId, quantity, unit_price AS unitPrice, discount_applied AS discountApplied, line_total AS lineTotal';

const getCustomerById = (id: number): Customer | null => {
  const db = getDb();
  const row = db
    .prepare('SELECT id, name, location FROM customers WHERE id = ?')
    .get(id) as Customer | undefined;
  return row ?? null;
};

const getProductsByIds = (ids: number[]): Product[] => {
  const db = getDb();
  const placeholders = ids.map(() => '?').join(', ');
  return db
    .prepare(
      `SELECT id, name, description, price, stock, category, created_at AS createdAt FROM products WHERE id IN (${placeholders})`,
    )
    .all(...ids) as Product[];
};

const getOrderById = (id: number): OrderWithItems | null => {
  const db = getDb();
  const order = db
    .prepare(`SELECT ${ORDER_COLUMNS} FROM orders WHERE id = ?`)
    .get(id) as OrderRow | undefined;

  if (!order) return null;

  const items = db
    .prepare(`SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_id = ?`)
    .all(id) as OrderItemRow[];

  return { ...order, items };
};

const listOrders = (): OrderRow[] => {
  const db = getDb();
  return db
    .prepare(`SELECT ${ORDER_COLUMNS} FROM orders ORDER BY id ASC`)
    .all() as OrderRow[];
};

export const orderReadRepository = {
  getCustomerById,
  getProductsByIds,
  getOrderById,
  listOrders,
};
