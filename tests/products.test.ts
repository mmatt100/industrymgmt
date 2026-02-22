import request from 'supertest';
import app from '../src/app';
import { createProduct } from './helpers';

describe('Products API', () => {
  it('creates and lists products', async () => {
    const createRes = await createProduct();
    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Test Widget',
        description: 'A useful widget',
        price: 1999,
        stock: 50,
        category: 'electronics',
        createdAt: expect.any(String),
      }),
    );

    const listRes = await request(app).get('/products');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createRes.body.id }),
      ]),
    );
  });

  it('restocks and sells a product', async () => {
    const createRes = await createProduct({ stock: 10 });
    const id = createRes.body.id as number;

    const restockRes = await request(app)
      .post(`/products/${id}/restock`)
      .send({ quantity: 5 });
    expect(restockRes.status).toBe(200);
    expect(restockRes.body.stock).toBe(15);

    const sellRes = await request(app)
      .post(`/products/${id}/sell`)
      .send({ quantity: 8 });
    expect(sellRes.status).toBe(200);
    expect(sellRes.body.stock).toBe(7);
  });

  it('rejects sell when insufficient stock', async () => {
    const createRes = await createProduct({ stock: 2 });
    const id = createRes.body.id as number;

    const sellRes = await request(app)
      .post(`/products/${id}/sell`)
      .send({ quantity: 5 });

    expect(sellRes.status).toBe(409);
    expect(sellRes.body.error).toBe('Insufficient stock');
    expect(sellRes.body.requestId).toBeDefined();
  });

  it('rejects invalid input', async () => {
    // negative price → 400
    const negPrice = await createProduct({ price: -10 });
    expect(negPrice.status).toBe(400);
    expect(negPrice.body.error).toBe('Validation failed');

    // missing fields → 400 + details + requestId
    const missing = await request(app).post('/products').send({ name: 'Only Name' });
    expect(missing.status).toBe(400);
    expect(missing.body.error).toBe('Validation failed');
    expect(missing.body.details).toBeDefined();
    expect(missing.body.requestId).toBeDefined();
  });

  it('returns 404 for non-existent product', async () => {
    const restockRes = await request(app)
      .post('/products/99999/restock')
      .send({ quantity: 1 });
    expect(restockRes.status).toBe(404);
    expect(restockRes.body.error).toBe('Product not found');
    expect(restockRes.body.requestId).toBeDefined();

    const sellRes = await request(app)
      .post('/products/99999/sell')
      .send({ quantity: 1 });
    expect(sellRes.status).toBe(404);
    expect(sellRes.body.error).toBe('Product not found');
  });
});
