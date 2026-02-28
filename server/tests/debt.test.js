/**
 * tests/debt.test.js
 * Kiểm thử CRUD khoản nợ + thanh toán + tất toán
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Debt User', email: 'debt@example.com', password: 'password123' };
const otherUser = { name: 'Other User', email: 'other_debt@example.com', password: 'password123' };

let token;
let otherToken;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;

  const res2 = await request(app).post('/api/auth/register').send(otherUser);
  otherToken = res2.body.data.token;
});

// Helper: tạo 1 khoản nợ nhanh
const createDebt = (overrides = {}) =>
  request(app)
    .post('/api/debts')
    .set('Authorization', `Bearer ${token}`)
    .send({
      type: 'lend',
      personName: 'Nguyễn Văn A',
      amount: 500000,
      description: 'Cho mượn tiền ăn',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    });

// ─── Tạo khoản nợ ─────────────────────────────────────────────────────────────

describe('POST /api/debts', () => {
  it('Tạo khoản cho vay (lend) thành công → 201', async () => {
    const res = await createDebt();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.type).toBe('lend');
    expect(res.body.data.amount).toBe(500000);
    expect(res.body.data.remainingAmount).toBe(500000);
    expect(res.body.data.personName).toBe('Nguyễn Văn A');
    expect(res.body.data.status).toBe('active');
  });

  it('Tạo khoản đi vay (borrow) thành công → 201', async () => {
    const res = await createDebt({ type: 'borrow', personName: 'Trần Thị B', amount: 200000 });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('borrow');
    expect(res.body.data.amount).toBe(200000);
  });

  it('Không có token → 401', async () => {
    const res = await request(app).post('/api/debts').send({
      type: 'lend',
      personName: 'A',
      amount: 100000,
    });
    expect(res.status).toBe(401);
  });
});

// ─── Lấy danh sách khoản nợ ───────────────────────────────────────────────────

describe('GET /api/debts', () => {
  it('Lấy danh sách thành công → 200 + array + stats', async () => {
    await createDebt();
    await createDebt({ type: 'borrow', personName: 'B', amount: 300000 });

    const res = await request(app)
      .get('/api/debts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.stats).toBeDefined();
    expect(res.body.stats.totalLend).toBe(500000);
    expect(res.body.stats.totalBorrow).toBe(300000);
  });

  it('Lọc theo type=lend → chỉ trả về khoản cho vay', async () => {
    await createDebt({ type: 'lend' });
    await createDebt({ type: 'borrow', personName: 'B' });

    const res = await request(app)
      .get('/api/debts?type=lend')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(d => d.type === 'lend')).toBe(true);
  });

  it('Chỉ trả về khoản nợ của user hiện tại', async () => {
    await createDebt();
    await request(app)
      .post('/api/debts')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ type: 'lend', personName: 'X', amount: 999999 });

    const res = await request(app)
      .get('/api/debts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].personName).toBe('Nguyễn Văn A');
  });

  it('Không có token → 401', async () => {
    const res = await request(app).get('/api/debts');
    expect(res.status).toBe(401);
  });
});

// ─── Cập nhật khoản nợ ────────────────────────────────────────────────────────

describe('PUT /api/debts/:id', () => {
  it('Cập nhật personName thành công → 200', async () => {
    const created = await createDebt();
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/debts/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ personName: 'Nguyễn Văn B' });

    expect(res.status).toBe(200);
    expect(res.body.data.personName).toBe('Nguyễn Văn B');
  });

  it('Cập nhật amount → tính lại remainingAmount', async () => {
    const created = await createDebt();
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/debts/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 1000000 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(1000000);
    expect(res.body.data.remainingAmount).toBe(1000000);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .put('/api/debts/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ personName: 'X' });

    expect(res.status).toBe(404);
  });
});

// ─── Ghi nhận thanh toán ──────────────────────────────────────────────────────

describe('POST /api/debts/:id/pay', () => {
  it('Thanh toán một phần → giảm remainingAmount', async () => {
    const created = await createDebt({ amount: 500000 });
    const id = created.body.data._id;

    const res = await request(app)
      .post(`/api/debts/${id}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 200000, note: 'Trả lần 1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remainingAmount).toBe(300000);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.paymentHistory).toHaveLength(1);
  });

  it('Thanh toán đủ → status chuyển thành settled', async () => {
    const created = await createDebt({ amount: 500000 });
    const id = created.body.data._id;

    const res = await request(app)
      .post(`/api/debts/${id}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 500000 });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('settled');
    expect(res.body.data.remainingAmount).toBe(0);
  });

  it('Số tiền = 0 → lỗi 400', async () => {
    const created = await createDebt();
    const id = created.body.data._id;

    const res = await request(app)
      .post(`/api/debts/${id}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('Khoản đã settled → không thanh toán thêm được', async () => {
    const created = await createDebt({ amount: 100000 });
    const id = created.body.data._id;

    // Settle toàn bộ
    await request(app)
      .post(`/api/debts/${id}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 100000 });

    // Thử thanh toán thêm
    const res = await request(app)
      .post(`/api/debts/${id}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 50000 });

    expect(res.status).toBe(400);
  });
});

// ─── Tất toán thủ công ────────────────────────────────────────────────────────

describe('PATCH /api/debts/:id/settle', () => {
  it('Đánh dấu settled thủ công → 200', async () => {
    const created = await createDebt({ amount: 500000 });
    const id = created.body.data._id;

    const res = await request(app)
      .patch(`/api/debts/${id}/settle`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('settled');
    expect(res.body.data.remainingAmount).toBe(0);
  });
});

// ─── Xóa khoản nợ ────────────────────────────────────────────────────────────

describe('DELETE /api/debts/:id', () => {
  it('Xóa thành công → 200', async () => {
    const created = await createDebt();
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/debts/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Sau khi xóa → danh sách rỗng', async () => {
    const created = await createDebt();
    const id = created.body.data._id;

    await request(app).delete(`/api/debts/${id}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/debts').set('Authorization', `Bearer ${token}`);
    expect(res.body.data).toHaveLength(0);
  });

  it('Không xóa được của người khác → 404', async () => {
    const created = await createDebt();
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/debts/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
