import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('Aura Expense API Integration Tests', () => {
  let authToken = '';
  const testEmail = `test_${Date.now()}@example.com`;

  it('GET /health - should return healthy server status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('Aura Expense API');
    expect(res.body.database).toBe('healthy');
  });

  it('POST /api/v1/auth/register - should create new user and default categories', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: 'password123',
        name: 'Integration Tester',
        currency: 'INR',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe(testEmail);
    authToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login - should authenticate user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('GET /api/v1/categories - should list seeded categories', async () => {
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/accounts - should create account with manual accountName like AD-HDFCBK-S', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        accountName: 'AD-HDFCBK-S',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accountName).toBe('AD-HDFCBK-S');
  });

  it('POST /api/v1/transactions - should create manual expense linked to accountName', async () => {
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 850.0,
        type: 'DEBIT',
        merchant: 'Swiggy',
        accountName: 'AD-HDFCBK-S',
        paymentMethod: 'UPI',
        notes: 'Lunch delivery',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(850.0);
    expect(res.body.data.accountName).toBe('AD-HDFCBK-S');
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('GET /api/v1/transactions - should list transactions with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/transactions?page=1&limit=10')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/budgets - should calculate real-time spent against budget', async () => {
    const res = await request(app)
      .get('/api/v1/budgets')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSpent).toBe(850.0);
  });

  it('GET /api/v1/reports/summary - should calculate monthly summary', async () => {
    const res = await request(app)
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentMonth.spent).toBe(850.0);
  });

  it('GET /api/v1/privacy/export - should export user financial data in CSV', async () => {
    const res = await request(app)
      .get('/api/v1/privacy/export?format=csv')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/csv');
    expect(res.text).toContain('Swiggy');
  });
});
