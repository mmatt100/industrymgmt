import request from 'supertest';
import app from '../src/app';

describe('Health Check', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      status: 'ok',
      timestamp: expect.any(String),
    });
  });
});
