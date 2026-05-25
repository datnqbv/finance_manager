/**
 * tests/goal.test.js
 * Kiểm thử CRUD mục tiêu tiết kiệm + nạp tiền + thống kê
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser  = { name: 'Goal User',  email: 'goal@example.com',       password: 'password123' };
const otherUser = { name: 'Other User', email: 'other_goal@example.com',  password: 'password123' };

let token;
let otherToken;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res  = await request(app).post('/api/auth/register').send(testUser);
  token      = res.body.data.token;
  const res2 = await request(app).post('/api/auth/register').send(otherUser);
  otherToken = res2.body.data.token;
});

// Helper: tạo 1 mục tiêu nhanh
const createGoal = (overrides = {}) =>
  request(app)
    .post('/api/goals')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Mua xe máy',
      targetAmount: 30000000,
      currentAmount: 0,
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'high',
      ...overrides,
    });

// ─── Tạo mục tiêu ─────────────────────────────────────────────────────────────

describe('POST /api/goals', () => {
  it('Tạo mục tiêu thành công → 201', async () => {
    const res = await createGoal();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Mua xe máy');
    expect(res.body.data.targetAmount).toBe(30000000);
    expect(res.body.data.currentAmount).toBe(0);
    expect(res.body.data.isAchieved).toBe(false);
  });

  it('Tạo với currentAmount có sẵn → lưu đúng', async () => {
    const res = await createGoal({ name: 'Du lịch', targetAmount: 10000000, currentAmount: 2000000 });

    expect(res.status).toBe(201);
    expect(res.body.data.currentAmount).toBe(2000000);
  });

  it('Không có token → 401', async () => {
    const res = await request(app).post('/api/goals').send({
      name: 'Test',
      targetAmount: 1000000,
      deadline: new Date().toISOString(),
    });
    expect(res.status).toBe(401);
  });
});

// ─── Lấy danh sách mục tiêu ───────────────────────────────────────────────────

describe('GET /api/goals', () => {
  it('Lấy danh sách thành công → 200 + array', async () => {
    await createGoal();
    await createGoal({ name: 'Mua nhà', targetAmount: 500000000 });

    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(2);
  });

  it('Lọc isAchieved=false → chỉ trả về mục tiêu chưa đạt', async () => {
    await createGoal({ name: 'Chưa đạt' });

    const res = await request(app)
      .get('/api/goals?isAchieved=false')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(g => g.isAchieved === false)).toBe(true);
  });

  it('Chỉ trả về mục tiêu của user hiện tại', async () => {
    await createGoal();
    await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Goal khác', targetAmount: 1000000, deadline: new Date().toISOString() });

    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.count).toBe(1);
  });

  it('Không có token → 401', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });
});

// ─── Lấy chi tiết 1 mục tiêu ─────────────────────────────────────────────────

describe('GET /api/goals/:id', () => {
  it('Lấy thành công → 200 + có monthlySaving', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    const res = await request(app)
      .get(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.monthlySaving).toBeDefined();
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .get('/api/goals/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── Cập nhật mục tiêu ────────────────────────────────────────────────────────

describe('PUT /api/goals/:id', () => {
  it('Cập nhật tên thành công → 200', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mua ô tô' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Mua ô tô');
  });

  it('Cập nhật targetAmount → phản ánh đúng', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    const res = await request(app)
      .put(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ targetAmount: 50000000 });

    expect(res.status).toBe(200);
    expect(res.body.data.targetAmount).toBe(50000000);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .put('/api/goals/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

// ─── Nạp tiền vào mục tiêu ───────────────────────────────────────────────────

describe('POST /api/goals/:id/add-amount', () => {
  it('Nạp tiền thành công → currentAmount tăng', async () => {
    const created = await createGoal({ targetAmount: 10000000, currentAmount: 0 });
    const id = created.body.data.id;

    const res = await request(app)
      .post(`/api/goals/${id}/add-amount`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 2000000, note: 'Tiết kiệm tháng 1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentAmount).toBe(2000000);
  });

  it('Nạp đủ targetAmount → isAchieved = true', async () => {
    const created = await createGoal({ targetAmount: 5000000, currentAmount: 0 });
    const id = created.body.data.id;

    const res = await request(app)
      .post(`/api/goals/${id}/add-amount`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000000 });

    expect(res.status).toBe(200);
    expect(res.body.data.isAchieved).toBe(true);
  });

  it('Số tiền = 0 → lỗi 400', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    const res = await request(app)
      .post(`/api/goals/${id}/add-amount`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });
});

// ─── Thống kê mục tiêu ────────────────────────────────────────────────────────

describe('GET /api/goals/stats', () => {
  it('Trả về thống kê đúng → 200', async () => {
    await createGoal({ targetAmount: 10000000 });
    await createGoal({ name: 'Goal 2', targetAmount: 5000000 });

    const res = await request(app)
      .get('/api/goals/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalGoals).toBe(2);
    expect(res.body.data.activeGoals).toBe(2);
    expect(res.body.data.achievedGoals).toBe(0);
    expect(res.body.data.totalTargetAmount).toBe(15000000);
    expect(res.body.data.overallProgress).toBe(0);
  });
});

// ─── Xóa mục tiêu ────────────────────────────────────────────────────────────

describe('DELETE /api/goals/:id', () => {
  it('Xóa thành công → 200', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    const res = await request(app)
      .delete(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Sau khi xóa → danh sách rỗng', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    await request(app).delete(`/api/goals/${id}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/goals').set('Authorization', `Bearer ${token}`);
    expect(res.body.count).toBe(0);
  });

  it('Không xóa được của người khác → 404', async () => {
    const created = await createGoal();
    const id = created.body.data.id;

    const res = await request(app)
      .delete(`/api/goals/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
