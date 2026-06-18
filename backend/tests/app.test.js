const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_USER = process.env.DB_USER || 'ci_user';
process.env.DB_PASS = process.env.DB_PASS || 'ci_pass';
process.env.DB_NAME = process.env.DB_NAME || 'ci_db';

const app = require('../index');

describe('Backend API', () => {
  it('GET /api/health responde con mensaje de salud', async () => {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.match(response.text, /Backend de La Número 1/i);
  });

  it('GET /resultados responde JSON (array o error de BD)', async () => {
    const response = await request(app).get('/resultados');

    assert.ok([200, 500].includes(response.status));
    assert.equal(typeof response.body, 'object');
  });
});
