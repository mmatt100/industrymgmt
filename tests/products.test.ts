import request from 'supertest';
import app from '../src/app';

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
};

const createProduct = async (overrides: Partial<ProductPayload> = {}) => {
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

  it('restocks a product', async () => {
    const createRes = await createProduct({ stock: 10 });
    const id = createRes.body.id as number;

    const restockRes = await request(app)
      .post(`/products/${id}/restock`)
      .send({ quantity: 5 });

    expect(restockRes.status).toBe(200);
    expect(restockRes.body.stock).toBe(15);
  });

  it('sells a product', async () => {
    const createRes = await createProduct({ stock: 10 });
    const id = createRes.body.id as number;

    const sellRes = await request(app)
      .post(`/products/${id}/sell`)
      .send({ quantity: 3 });

    expect(sellRes.status).toBe(200);
    expect(sellRes.body.stock).toBe(7);
  });

  it('sells exactly all remaining stock', async () => {
    const createRes = await createProduct({ stock: 5 });
    const id = createRes.body.id as number;

    const sellRes = await request(app)
      .post(`/products/${id}/sell`)
      .send({ quantity: 5 });

    expect(sellRes.status).toBe(200);
    expect(sellRes.body.stock).toBe(0);
  });

  it('rejects sell when insufficient stock', async () => {
    const createRes = await createProduct({ stock: 2 });
    const id = createRes.body.id as number;

    const sellRes = await request(app)
      .post(`/products/${id}/sell`)
      .send({ quantity: 5 });

    expect(sellRes.status).toBe(400);
    expect(sellRes.body.error).toBe('Validation failed');
    expect(sellRes.body.requestId).toBeDefined();
  });

  it('rejects negative/zero price', async () => {
    const res = await createProduct({ price: -10 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');

    const zeroRes = await createProduct({ price: 0 });
    expect(zeroRes.status).toBe(400);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
    expect(res.body.requestId).toBeDefined();
  });

  it('validates id params', async () => {
    const res = await request(app).post('/products/abc/restock').send({ quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('returns 404 for non-existent product on restock', async () => {
    const res = await request(app)
      .post('/products/99999/restock')
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
    expect(res.body.requestId).toBeDefined();
  });

  it('returns 404 for non-existent product on sell', async () => {
    const res = await request(app)
      .post('/products/99999/sell')
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Product not found');
    expect(res.body.requestId).toBeDefined();
  });

  it('includes requestId in responses', async () => {
    const res = await request(app).get('/products');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});
