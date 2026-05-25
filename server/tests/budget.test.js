/**
 * tests/budget.test.js
 * Kiểm thử CRUD ngân sách và cảnh báo
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Budget User', email: 'budget@example.com', password: 'password123' };

let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

// Helper: tạo 1 budget nhanh
const createBudget = (overrides = {}) =>
  request(app)
    .post('/api/budgets')
    .set('Authorization', `Bearer ${token}`)
    .send({
      categoryName: 'Ăn uống',
      amount: 3000000,
      period: 'monthly',
      startDate: new Date().toISOString(),
      ...overrides,
    });

// ─── Tạo ngân sách ───────────────────────────────────────────────────────────

describe('POST /api/budgets', () => {
  it('Tạo ngân sách thành công → 201', async () => {
    const res = await createBudget();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(3000000);
    expect(res.body.data.period).toBe('monthly');
  });

  it('Thiếu categoryName → tạo ngân sách tổng thể (không cần categoryName)', async () => {
    // categoryName là optional — null nghĩa là ngân sách tổng thể cho toàn bộ chi tiêu
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000000, period: 'monthly' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('Amount âm (< 0) → lỗi', async () => {
    // min: 0 trong schema — âm là không hợp lệ
    const res = await createBudget({ amount: -500000 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('Không có token → 401', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .send({ categoryName: 'Test', amount: 1000000, period: 'monthly' });
    expect(res.status).toBe(401);
  });
});

// ─── Lấy danh sách ───────────────────────────────────────────────────────────

describe('GET /api/budgets', () => {
  it('Lấy danh sách thành công → 200 + array', async () => {
    await createBudget();
    await createBudget({ categoryName: 'Di chuyển', amount: 500000 });

    const res = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('Chỉ trả về ngân sách của user hiện tại', async () => {
    await createBudget();

    // Tạo user 2 và budget của họ
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User2', email: 'user2@example.com', password: 'password123' });
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${res2.body.data.token}`)
      .send({ categoryName: 'Giải trí', amount: 2000000, period: 'monthly' });

    // User 1 chỉ thấy budget của mình
    const res = await request(app)
      .get('/api/budgets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].categoryName).toBe('Ăn uống');
  });
});

// ─── Cập nhật ngân sách ──────────────────────────────────────────────────────

describe('PUT /api/budgets/:id', () => {
  it('Cập nhật amount thành công → 200', async () => {
    const created = await createBudget();
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/budgets/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000000 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(5000000);
  });
});

// ─── Xóa ngân sách ───────────────────────────────────────────────────────────

describe('DELETE /api/budgets/:id', () => {
  it('Xóa thành công → 200', async () => {
    const created = await createBudget();
    const id = created.body.data.id;

    const res = await request(app)
      .delete(`/api/budgets/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ─── Cảnh báo ngân sách ──────────────────────────────────────────────────────

describe('GET /api/budgets/alerts', () => {
  it('Trả về danh sách cảnh báo → 200', async () => {
    await createBudget({ amount: 100000 }); // ngân sách nhỏ dễ vượt

    // Tạo chi tiêu vượt 80%
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        category: 'Ăn uống',
        amount: 90000,
        date: new Date().toISOString(),
      });

    const res = await request(app)
      .get('/api/budgets/alerts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
