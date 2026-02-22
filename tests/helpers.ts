import request from 'supertest';
import app from '../src/app';
import { getDb } from '../src/lib/db';

// --- Types ---
export type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
};

// --- HTTP factories ---
export const createProduct = async (overrides: Partial<ProductPayload> = {}) => {
  const payload: ProductPayload = {
    name: 'Test Widget',
    description: 'A useful widget',
    price: 1999,
    stock: 50,
    category: 'electronics',
    ...overrides,
  };

  return request(app).post('/products').send(payload);
};

// --- DB query helpers ---
export const queryOrder = (id: number) =>
  getDb().prepare('SELECT * FROM orders WHERE id = ?').get(id) as {
    id: number;
    customer_id: number;
    total_price: number;
    created_at: string;
  } | undefined;

export const queryOrderItems = (orderId: number) =>
  getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as {
    id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    discount_applied: number;
    line_total: number;
  }[];

export const queryProductStock = (id: number) =>
  (getDb().prepare('SELECT stock FROM products WHERE id = ?').get(id) as { stock: number })?.stock;

// --- Utilities ---
export const utc = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month - 1, day));
