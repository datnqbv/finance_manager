/**
 * tests/transaction.test.js
 * Kiểm thử CRUD giao dịch thu/chi
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Test User', email: 'tx@example.com', password: 'password123' };

let token;
let categoryName = 'Ăn uống'; // default category được tạo khi register

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

// Helper: tạo 1 giao dịch nhanh
const createTx = (overrides = {}) =>
  request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: 'expense',
      category: categoryName,
      amount: 100000,
      date: new Date().toISOString(),
      note: 'Chi tiêu test',
      ...overrides,
    });

// ─── Tạo giao dịch ───────────────────────────────────────────────────────────

describe('POST /api/transactions', () => {
  it('Tạo giao dịch chi tiêu thành công → 201', async () => {
    const res = await createTx();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(100000);
    expect(res.body.data.type).toBe('expense');
  });

  it('Tạo giao dịch thu nhập thành công → 201', async () => {
    const res = await createTx({ type: 'income', amount: 5000000 });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('income');
    expect(res.body.data.amount).toBe(5000000);
  });

  it('Thiếu amount → trả về lỗi 400', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', category: categoryName, date: new Date() });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('Amount âm → trả về lỗi', async () => {
    const res = await createTx({ amount: -50000 });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('Không có token → 401', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ type: 'expense', category: categoryName, amount: 50000 });

    expect(res.status).toBe(401);
  });
});

// ─── Lấy danh sách ───────────────────────────────────────────────────────────

describe('GET /api/transactions', () => {
  it('Lấy danh sách thành công → 200 + array', async () => {
    await createTx();
    await createTx({ amount: 200000 });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('Lọc theo type=income → chỉ trả về thu nhập', async () => {
    await createTx({ type: 'expense' });
    await createTx({ type: 'income', amount: 999000 });

    const res = await request(app)
      .get('/api/transactions?type=income')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const allIncome = res.body.data.every(t => t.type === 'income');
    expect(allIncome).toBe(true);
  });

  it('Không có token → 401', async () => {
    const res = await request(app).get('/api/transactions');
    expect(res.status).toBe(401);
  });
});

// ─── Cập nhật giao dịch ──────────────────────────────────────────────────────

describe('PUT /api/transactions/:id', () => {
  it('Cập nhật số tiền thành công → 200', async () => {
    const created = await createTx();
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 999999 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(999999);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .put('/api/transactions/64a000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 50000 });

    expect(res.status).toBe(404);
  });
});

// ─── Xóa giao dịch ───────────────────────────────────────────────────────────

describe('DELETE /api/transactions/:id', () => {
  it('Xóa thành công → 200', async () => {
    const created = await createTx();
    const id = created.body.data.id;

    const res = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Xóa xong thì không lấy được nữa', async () => {
    const created = await createTx();
    const id = created.body.data.id;

    await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    const found = res.body.data.find(t => t.id === id);
    expect(found).toBeUndefined();
  });

  it('Không xóa được của người khác', async () => {
    // Tạo user thứ 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User2', email: 'user2@example.com', password: 'password123' });
    const token2 = res2.body.data.token;

    // User 1 tạo giao dịch
    const created = await createTx();
    const id = created.body.data.id;

    // User 2 thử xóa → phải fail (404 hoặc 403)
    const del = await request(app)
      .delete(`/api/transactions/${id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(del.status).toBeGreaterThanOrEqual(400);
  });
});
