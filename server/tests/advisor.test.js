/**
 * tests/advisor.test.js
 * Kiểm thử cố vấn tài chính thông minh (rule-based): 50/30/20, phát hiện bất thường,
 * cảnh báo tiến độ ngân sách, cảnh báo tiến độ mục tiêu.
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';
import { Goal } from '../src/models/sequelize/index.js';
import { getElapsedTimePct } from '../src/services/advisor.service.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Advisor User', email: 'advisor@example.com', password: 'password123' };

let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

const createTransaction = (overrides = {}) =>
  request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ type: 'expense', category: 'Ăn uống', amount: 100000, date: new Date().toISOString(), ...overrides });

const createCategory = (overrides = {}) =>
  request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ăn uống', type: 'expense', group: 'need', ...overrides });

// ─── Auth guard ────────────────────────────────────────────────────────────

describe('GET /api/advisor', () => {
  it('Không có token → 401', async () => {
    const res = await request(app).get('/api/advisor');
    expect(res.status).toBe(401);
  });

  it('Không có dữ liệu → vẫn trả về 200 với cấu trúc mặc định', async () => {
    const res = await request(app).get('/api/advisor').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rule502030).toBeDefined();
    expect(res.body.data.sixJars).toBeDefined();
    expect(Array.isArray(res.body.data.anomalies)).toBe(true);
    expect(Array.isArray(res.body.data.tips)).toBe(true);
  });
});

// ─── Quy tắc 50/30/20 ──────────────────────────────────────────────────────

describe('Quy tắc 50/30/20', () => {
  it('Tính đúng % thiết yếu/không thiết yếu/tiết kiệm theo group của category', async () => {
    await createCategory({ name: 'Ăn uống', group: 'need' });
    await createCategory({ name: 'Giải trí', group: 'want' });

    const now = new Date();
    await createTransaction({ type: 'income', category: 'Lương', amount: 10000000, date: now.toISOString() });
    await createTransaction({ type: 'expense', category: 'Ăn uống', amount: 5000000, date: now.toISOString() }); // 50%
    await createTransaction({ type: 'expense', category: 'Giải trí', amount: 2000000, date: now.toISOString() }); // 20%

    const res = await request(app).get('/api/advisor').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { needs, wants, savings } = res.body.data.rule502030;
    expect(needs.percentage).toBeCloseTo(50, 0);
    expect(wants.percentage).toBeCloseTo(20, 0);
    expect(savings.percentage).toBeCloseTo(30, 0);
    expect(needs.verdict).toBe('on_track');
    expect(savings.verdict).toBe('on_track');
  });
});

// ─── Phát hiện bất thường ──────────────────────────────────────────────────

describe('Phát hiện bất thường chi tiêu', () => {
  it('Chi tiêu tăng vọt so với trung bình 3 tháng trước → phát hiện anomaly', async () => {
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      await createTransaction({ category: 'Ăn uống', amount: 1000000, date: d.toISOString() });
    }
    // Tháng hiện tại tăng vọt lên gấp 3 lần trung bình (1,000,000 → 3,000,000)
    await createTransaction({ category: 'Ăn uống', amount: 3000000, date: now.toISOString() });

    const res = await request(app).get('/api/advisor').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const anomaly = res.body.data.anomalies.find(a => a.category === 'Ăn uống');
    expect(anomaly).toBeDefined();
    expect(anomaly.changePct).toBeGreaterThanOrEqual(50);
    expect(anomaly.severity).toBe('danger');
  });

  it('Chi tiêu tăng nhẹ (< 50%) → không phát hiện anomaly', async () => {
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
      await createTransaction({ category: 'Ăn uống', amount: 1000000, date: d.toISOString() });
    }
    await createTransaction({ category: 'Ăn uống', amount: 1100000, date: now.toISOString() });

    const res = await request(app).get('/api/advisor').set('Authorization', `Bearer ${token}`);
    const anomaly = res.body.data.anomalies.find(a => a.category === 'Ăn uống');
    expect(anomaly).toBeUndefined();
  });
});

// ─── Cảnh báo tiến độ ngân sách ────────────────────────────────────────────

describe('Cảnh báo tiến độ ngân sách', () => {
  it('Vượt ngân sách → luôn cảnh báo mức danger bất kể thời điểm trong kỳ', async () => {
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ categoryName: 'Ăn uống', amount: 1000000, period: 'monthly' });

    await createTransaction({ category: 'Ăn uống', amount: 1500000 });

    const res = await request(app).get('/api/advisor').set('Authorization', `Bearer ${token}`);
    const warning = res.body.data.budgetPaceWarnings.find(w => w.categoryName === 'Ăn uống');
    expect(warning).toBeDefined();
    expect(warning.severity).toBe('danger');
  });

  it('getElapsedTimePct: giữa tháng 30 ngày → khoảng 50%', () => {
    const pct = getElapsedTimePct('monthly', new Date(2024, 3, 15)); // April có 30 ngày, ngày 15
    expect(pct).toBeCloseTo(50, 0);
  });
});

// ─── Cảnh báo tiến độ mục tiêu ─────────────────────────────────────────────

describe('Cảnh báo tiến độ mục tiêu tiết kiệm', () => {
  it('Tiết kiệm chậm hơn kế hoạch → tính đúng số tháng chậm', async () => {
    const createRes = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Mua xe',
        targetAmount: 120000000,
        currentAmount: 10000000,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString(),
      });
    const goalId = createRes.body.data.id;

    // Giả lập mục tiêu đã được tạo từ 6 tháng trước, để tốc độ tiết kiệm thực tế
    // (10tr / 6 tháng ≈ 1.67tr/tháng) chậm hơn nhiều so với kế hoạch ban đầu.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    await Goal.update({ createdAt: sixMonthsAgo }, { where: { id: goalId } });

    const res = await request(app).get('/api/advisor').set('Authorization', `Bearer ${token}`);
    const warning = res.body.data.goalPaceWarnings.find(w => w.goalId === goalId);
    expect(warning).toBeDefined();
    expect(warning.delayMonths).toBeGreaterThanOrEqual(1);
  });
});
