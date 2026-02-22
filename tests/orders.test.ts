import request from 'supertest';
import app from '../src/app';
import { createProduct, queryOrder, queryOrderItems, queryProductStock } from './helpers';

describe('Orders API', () => {
  it('creates an order with correct DB state', async () => {
    const product = await createProduct({ stock: 50, price: 1000 });
    const productId = product.body.id as number;

    const res = await request(app).post('/orders').send({
      customerId: 1,
      products: [{ productId, quantity: 2 }],
    });

    expect(res.status).toBe(201);
    const orderId = res.body.id as number;

    // Verify order row
    const order = queryOrder(orderId);
    expect(order).toBeDefined();
    expect(order!.customer_id).toBe(1);
    expect(order!.total_price).toBe(2000); // 1000 * 2, no discount (qty < 5)

    // Verify order_items row
    const items = queryOrderItems(orderId);
    expect(items).toHaveLength(1);
    expect(items[0].product_id).toBe(productId);
    expect(items[0].quantity).toBe(2);
    expect(items[0].unit_price).toBe(1000);
    expect(items[0].discount_applied).toBe(0);
    expect(items[0].line_total).toBe(2000);

    // Verify stock deduction
    expect(queryProductStock(productId)).toBe(48);
  });

  it('rejects invalid orders', async () => {
    const product = await createProduct({ stock: 3 });

    // empty products → 400
    const emptyRes = await request(app).post('/orders').send({ customerId: 1, products: [] });
    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body.error).toBe('Validation failed');

    // invalid body → 400
    const invalidRes = await request(app).post('/orders').send({ customerId: 'abc' });
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error).toBe('Validation failed');

    // non-existent customer → 404
    const noCustomer = await request(app).post('/orders').send({
      customerId: 9999,
      products: [{ productId: product.body.id, quantity: 1 }],
    });
    expect(noCustomer.status).toBe(404);
    expect(noCustomer.body.error).toBe('Customer not found');

    // non-existent product → 404
    const noProduct = await request(app).post('/orders').send({
      customerId: 1,
      products: [{ productId: 9999, quantity: 1 }],
    });
    expect(noProduct.status).toBe(404);
    expect(noProduct.body.error).toMatch(/Product with id 9999 not found/);

    // insufficient stock → 409
    const noStock = await request(app).post('/orders').send({
      customerId: 1,
      products: [{ productId: product.body.id, quantity: 5 }],
    });
    expect(noStock.status).toBe(409);
    expect(noStock.body.error).toBe('Insufficient stock');
    expect(noStock.body.requestId).toBeDefined();
  });

  it('aggregates duplicate product entries', async () => {
    const product = await createProduct({ stock: 20 });
    const productId = product.body.id as number;

    const res = await request(app).post('/orders').send({
      customerId: 1,
      products: [
        { productId, quantity: 3 },
        { productId, quantity: 4 },
      ],
    });

    expect(res.status).toBe(201);
    const orderId = res.body.id as number;

    // DB: single order_item with aggregated quantity 7
    const items = queryOrderItems(orderId);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(7);

    // Stock deducted by 7
    expect(queryProductStock(productId)).toBe(13);
  });

  it('applies volume discount per line item', async () => {
    const p1 = await createProduct({ name: 'A', stock: 100, price: 1000 });
    const p2 = await createProduct({ name: 'B', stock: 100, price: 500, category: 'food' });

    const res = await request(app).post('/orders').send({
      customerId: 1,
      products: [
        { productId: p1.body.id, quantity: 5 },
        { productId: p2.body.id, quantity: 3 },
      ],
    });

    expect(res.status).toBe(201);
    const orderId = res.body.id as number;

    // volume discount applies to the line with quantity 5 only
    const items = queryOrderItems(orderId);
    expect(items).toHaveLength(2);

    const itemA = items.find(i => i.product_id === p1.body.id)!;
    expect(itemA.discount_applied).toBe(0.1);
    expect(itemA.line_total).toBe(4500); // 1000 * 0.9 * 5

    const itemB = items.find(i => i.product_id === p2.body.id)!;
    expect(itemB.discount_applied).toBe(0);
    expect(itemB.line_total).toBe(1500); // 500 * 3

    const order = queryOrder(orderId);
    expect(order!.total_price).toBe(6000);
  });

  it('applies location and holiday pricing', async () => {
    // Europe location multiplier (1.15x)
    const product = await createProduct({ stock: 100, price: 1000 });

    const europeRes = await request(app).post('/orders').send({
      customerId: 2, // Bob — Europe
      products: [{ productId: product.body.id, quantity: 1 }],
    });

    expect(europeRes.status).toBe(201);
    const europeItems = queryOrderItems(europeRes.body.id);
    expect(europeItems[0].line_total).toBe(1150); // 1000 * 1.15

    // Black Friday pricing via fake timers
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date(Date.UTC(2026, 10, 27, 12, 0, 0)));

      const bfProduct = await createProduct({ stock: 100, price: 1000 });
      const bfRes = await request(app).post('/orders').send({
        customerId: 1,
        products: [{ productId: bfProduct.body.id, quantity: 2 }],
      });

      expect(bfRes.status).toBe(201);
      const bfItems = queryOrderItems(bfRes.body.id);
      expect(bfItems[0].discount_applied).toBe(0.25);
      expect(bfItems[0].line_total).toBe(1500); // 1000 * 0.75 * 2
    } finally {
      jest.useRealTimers();
    }
  });

  it('lists and retrieves orders', async () => {
    const product = await createProduct({ stock: 100 });

    // create two orders
    const order1 = await request(app).post('/orders').send({
      customerId: 1,
      products: [{ productId: product.body.id, quantity: 1 }],
    });
    await request(app).post('/orders').send({
      customerId: 2,
      products: [{ productId: product.body.id, quantity: 1 }],
    });

    // GET /orders returns array
    const listRes = await request(app).get('/orders');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(2);

    // GET /orders/:id returns order with items
    const getRes = await request(app).get(`/orders/${order1.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(order1.body.id);
    expect(getRes.body.items).toHaveLength(1);

    // GET /orders/99999 → 404
    const notFound = await request(app).get('/orders/99999');
    expect(notFound.status).toBe(404);
    expect(notFound.body.error).toBe('Order not found');
  });
});
