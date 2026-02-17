import request from 'supertest';
import app from '../src/app';

type ContactPayload = {
  name: string;
  email: string;
  phone?: string | null;
};

const createContact = async (overrides: Partial<ContactPayload> = {}) => {
  const payload: ContactPayload = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '123-456-7890',
    ...overrides,
  };

  return request(app).post('/contacts').send(payload);
};

describe('Contacts API', () => {
  it('creates and lists contacts', async () => {
    const createRes = await createContact();
    expect(createRes.status).toBe(201);
    expect(createRes.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Test User',
        email: 'test@example.com',
        phone: '123-456-7890',
      }),
    );

    const listRes = await request(app).get('/contacts');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createRes.body.id }),
      ]),
    );
  });

  it('reads, updates, and deletes a contact', async () => {
    const createRes = await createContact();
    const id = createRes.body.id as number;

    const getRes = await request(app).get(`/contacts/${id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual(expect.objectContaining({ id }));

    const updateRes = await request(app)
      .put(`/contacts/${id}`)
      .send({ name: 'Updated', email: 'updated@example.com', phone: null });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body).toEqual(
      expect.objectContaining({
        id,
        name: 'Updated',
        email: 'updated@example.com',
        phone: null,
      }),
    );

    const deleteRes = await request(app).delete(`/contacts/${id}`);
    expect(deleteRes.status).toBe(204);

    const missingRes = await request(app).get(`/contacts/${id}`);
    expect(missingRes.status).toBe(404);
  });

  it('returns validation errors for bad input', async () => {
    const res = await request(app)
      .post('/contacts')
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
    expect(res.body.requestId).toBeDefined();
  });

  it('validates id params', async () => {
    const res = await request(app).get('/contacts/abc');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('includes request id in headers and errors', async () => {
    const res = await request(app).get('/contacts');
    expect(res.headers['x-request-id']).toBeDefined();

    const missingRes = await request(app).get('/does-not-exist');
    expect(missingRes.status).toBe(404);
    expect(missingRes.body.requestId).toBeDefined();
  });
});
