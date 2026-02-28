/**
 * tests/search.test.js
 * Kiểm thử global search, advanced search và search suggestions
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Search User', email: 'search@example.com', password: 'password123' };

let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

// Helper: seed một số giao dịch
const seedData = async () => {
  const now = new Date().toISOString();
  const txs = [
    { type: 'expense', category: 'Ăn uống',  amount: 150000, date: now, note: 'Ăn trưa bún bò' },
    { type: 'expense', category: 'Di chuyển', amount: 50000,  date: now, note: 'Grab xe máy' },
    { type: 'income',  category: 'Lương',      amount: 15000000, date: now, note: 'Lương tháng 1' },
  ];
  for (const tx of txs) {
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(tx);
  }
};

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('Search endpoints — auth guard', () => {
  it('GET /api/search không có token → 401', async () => {
    const res = await request(app).get('/api/search?q=test');
    expect(res.status).toBe(401);
  });

  it('POST /api/search/advanced không có token → 401', async () => {
    const res = await request(app).post('/api/search/advanced').send({});
    expect(res.status).toBe(401);
  });

  it('GET /api/search/suggestions không có token → 401', async () => {
    const res = await request(app).get('/api/search/suggestions?q=test');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/search ──────────────────────────────────────────────────────────

describe('GET /api/search', () => {
  it('Query rỗng → trả về 200 + tất cả mảng rỗng', async () => {
    const res = await request(app)
      .get('/api/search?q=')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('Tìm kiếm có kết quả → trả về đúng', async () => {
    await seedData();

    const res = await request(app)
      .get('/api/search?q=Ăn uống')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transactions.length).toBeGreaterThan(0);
    expect(res.body.data.transactions[0].category).toBe('Ăn uống');
  });

  it('Tìm kiếm theo note → trả về đúng', async () => {
    await seedData();

    const res = await request(app)
      .get('/api/search?q=bún bò')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions.length).toBeGreaterThan(0);
  });

  it('Tìm kiếm không có kết quả → total = 0', async () => {
    await seedData();

    const res = await request(app)
      .get('/api/search?q=xyzkhongtontai999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(0);
  });

  it('Lọc theo type=transaction → chỉ search transactions', async () => {
    await seedData();

    const res = await request(app)
      .get('/api/search?q=Lương&type=transaction')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toBeDefined();
  });

  it('Chỉ tìm kiếm dữ liệu của user hiện tại', async () => {
    // Tạo user khác có giao dịch
    const other = await request(app).post('/api/auth/register').send({
      name: 'Other', email: 'other_search@example.com', password: 'password123',
    });
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${other.body.data.token}`)
      .send({ type: 'expense', category: 'BÍ MẬT', amount: 100, date: new Date().toISOString() });

    const res = await request(app)
      .get('/api/search?q=BÍ MẬT')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(0);
  });
});

// ─── POST /api/search/advanced ────────────────────────────────────────────────

describe('POST /api/search/advanced', () => {
  it('Tìm kiếm nâng cao transaction → trả về 200', async () => {
    await seedData();

    const res = await request(app)
      .post('/api/search/advanced')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'transaction', query: 'Lương' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Lọc transaction theo type=income → chỉ trả về thu nhập', async () => {
    await seedData();

    const res = await request(app)
      .post('/api/search/advanced')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'transaction', filters: { type: 'income' } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every(t => t.type === 'income')).toBe(true);
  });

  it('Lọc theo khoảng amount → trả về đúng', async () => {
    await seedData();

    const res = await request(app)
      .post('/api/search/advanced')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'transaction', filters: { minAmount: 100000, maxAmount: 200000 } });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('type không hợp lệ → 400', async () => {
    const res = await request(app)
      .post('/api/search/advanced')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/search/suggestions ─────────────────────────────────────────────

describe('GET /api/search/suggestions', () => {
  it('Query ngắn → trả về 200 + suggestions array', async () => {
    await seedData();

    const res = await request(app)
      .get('/api/search/suggestions?q=Ăn')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Query rỗng → trả về 200 (không crash)', async () => {
    const res = await request(app)
      .get('/api/search/suggestions?q=')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
