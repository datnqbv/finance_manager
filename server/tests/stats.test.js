/**
 * tests/stats.test.js
 * Kiểm thử các endpoint thống kê (summary, monthly, categories, compare, trends)
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Stats User', email: 'stats@example.com', password: 'password123' };

let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

// Helper: seed giao dịch nhanh
const seedTransactions = async () => {
  const now = new Date();
  const txs = [
    { type: 'income',  category: 'Lương',   amount: 15000000, date: now.toISOString(), note: 'Lương tháng' },
    { type: 'expense', category: 'Ăn uống', amount:  2000000, date: now.toISOString(), note: 'Ăn tháng này' },
    { type: 'expense', category: 'Nhà ở',   amount:  3000000, date: now.toISOString(), note: 'Thuê nhà' },
  ];
  for (const tx of txs) {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(tx);
  }
};

// ─── Authentication guard ─────────────────────────────────────────────────────

describe('Stats endpoints — auth guard', () => {
  it.each([
    ['GET /api/stats/summary',    'get',  '/api/stats/summary'],
    ['GET /api/stats/monthly',    'get',  '/api/stats/monthly'],
    ['GET /api/stats/categories', 'get',  '/api/stats/categories'],
    ['GET /api/stats/compare',    'get',  '/api/stats/compare'],
    ['GET /api/stats/trends',     'get',  '/api/stats/trends'],
  ])('%s không có token → 401', async (_, method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/stats/summary ───────────────────────────────────────────────────

describe('GET /api/stats/summary', () => {
  it('Trả về 200 + cấu trúc overall & thisMonth khi không có giao dịch', async () => {
    const res = await request(app)
      .get('/api/stats/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overall).toBeDefined();
    expect(res.body.data.thisMonth).toBeDefined();
    expect(res.body.data.overall.totalIncome).toBe(0);
    expect(res.body.data.overall.totalExpense).toBe(0);
    expect(res.body.data.overall.balance).toBe(0);
  });

  it('Sau khi có giao dịch → tổng hợp đúng', async () => {
    await seedTransactions();

    const res = await request(app)
      .get('/api/stats/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.overall.totalIncome).toBe(15000000);
    expect(res.body.data.overall.totalExpense).toBe(5000000);
    expect(res.body.data.overall.balance).toBe(10000000);
    expect(res.body.data.overall.transactionCount).toBe(3);
  });

  it('Chỉ thống kê của user hiện tại', async () => {
    // Tạo user khác có giao dịch
    const other = await request(app).post('/api/auth/register').send({
      name: 'Other', email: 'other_stats@example.com', password: 'password123',
    });
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${other.body.data.token}`)
      .send({ type: 'income', category: 'Lương', amount: 99999999, date: new Date().toISOString() });

    const res = await request(app)
      .get('/api/stats/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.overall.totalIncome).toBe(0);
  });
});

// ─── GET /api/stats/monthly ───────────────────────────────────────────────────

describe('GET /api/stats/monthly', () => {
  it('Trả về 200 + period + summary', async () => {
    await seedTransactions();
    const now = new Date();

    const res = await request(app)
      .get(`/api/stats/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.period).toBeDefined();
    expect(res.body.data.summary.income).toBe(15000000);
    expect(res.body.data.summary.expense).toBe(5000000);
    expect(res.body.data.summary.balance).toBe(10000000);
  });

  it('Tháng không có giao dịch → income=0, expense=0', async () => {
    const res = await request(app)
      .get('/api/stats/monthly?year=2020&month=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.income).toBe(0);
    expect(res.body.data.summary.expense).toBe(0);
    expect(res.body.data.transactions).toBe(0);
  });

  it('Có thống kê byCategory', async () => {
    await seedTransactions();
    const now = new Date();

    const res = await request(app)
      .get(`/api/stats/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.byCategory).toBeDefined();
    expect(res.body.data.byCategory['Ăn uống']).toBeDefined();
    expect(res.body.data.byCategory['Ăn uống'].expense).toBe(2000000);
  });
});

// ─── GET /api/stats/categories ───────────────────────────────────────────────

describe('GET /api/stats/categories', () => {
  it('Trả về 200 + array thống kê theo category', async () => {
    await seedTransactions();

    const res = await request(app)
      .get('/api/stats/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    // Tìm category "Ăn uống"
    const anuong = res.body.data.find(c => c.category === 'Ăn uống');
    expect(anuong).toBeDefined();
    expect(anuong.expense).toBe(2000000);
  });

  it('Không có giao dịch → mảng rỗng', async () => {
    const res = await request(app)
      .get('/api/stats/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ─── GET /api/stats/compare ───────────────────────────────────────────────────

describe('GET /api/stats/compare', () => {
  it('Trả về 200 + kết quả so sánh các tháng', async () => {
    await seedTransactions();

    const res = await request(app)
      .get('/api/stats/compare?type=month&periods=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('So sánh theo năm → 200', async () => {
    const res = await request(app)
      .get('/api/stats/compare?type=year&periods=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// (Đã xoá bộ test cho /api/stats/forecast — tính năng dự báo AI đã được loại bỏ,
// thay bằng /api/advisor, xem server/tests/advisor.test.js)

// ─── GET /api/stats/trends ────────────────────────────────────────────────────

describe('GET /api/stats/trends', () => {
  it('Không có dữ liệu → vẫn trả về 200', async () => {
    const res = await request(app)
      .get('/api/stats/trends')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Có dữ liệu → trả về phân tích xu hướng', async () => {
    await seedTransactions();

    const res = await request(app)
      .get('/api/stats/trends')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});

// ─── GET /api/stats/dashboard ────────────────────────────────────────────────

describe('GET /api/stats/dashboard', () => {
  it('Trả về 200 + dữ liệu tổng hợp', async () => {
    await seedTransactions();

    const res = await request(app)
      .get('/api/stats/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });
});
