/**
 * tests/recurring.test.js
 * Kiểm thử CRUD giao dịch định kỳ + thực hiện thủ công
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser  = { name: 'Recurring User',  email: 'recurring@example.com',       password: 'password123' };
const otherUser = { name: 'Other User',       email: 'other_recurring@example.com', password: 'password123' };

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

// Helper: tạo 1 giao dịch định kỳ nhanh
const createRecurring = (overrides = {}) =>
  request(app)
    .post('/api/recurring')
    .set('Authorization', `Bearer ${token}`)
    .send({
      templateName: 'Tiền thuê nhà',
      type: 'expense',
      category: 'Nhà ở',
      amount: 3000000,
      frequency: 'monthly',
      startDate: new Date().toISOString(),
      note: 'Trả hàng tháng',
      ...overrides,
    });

// ─── Tạo giao dịch định kỳ ───────────────────────────────────────────────────

describe('POST /api/recurring', () => {
  it('Tạo giao dịch chi tiêu định kỳ thành công → 201', async () => {
    const res = await createRecurring();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.templateName).toBe('Tiền thuê nhà');
    expect(res.body.data.amount).toBe(3000000);
    expect(res.body.data.frequency).toBe('monthly');
    expect(res.body.data.isActive).toBe(true);
  });

  it('Tạo giao dịch thu nhập định kỳ (weekly) thành công → 201', async () => {
    const res = await createRecurring({
      templateName: 'Lương tuần',
      type: 'income',
      category: 'Lương',
      amount: 1500000,
      frequency: 'weekly',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('income');
    expect(res.body.data.frequency).toBe('weekly');
  });

  it('Không có token → 401', async () => {
    const res = await request(app).post('/api/recurring').send({
      templateName: 'X',
      type: 'expense',
      amount: 100000,
      frequency: 'monthly',
    });
    expect(res.status).toBe(401);
  });
});

// ─── Lấy danh sách giao dịch định kỳ ─────────────────────────────────────────

describe('GET /api/recurring', () => {
  it('Lấy danh sách thành công → 200 + array', async () => {
    await createRecurring();
    await createRecurring({ templateName: 'Điện nước', amount: 500000 });

    const res = await request(app)
      .get('/api/recurring')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.count).toBe(2);
  });

  it('Lọc isActive=true → chỉ trả về giao dịch đang hoạt động', async () => {
    await createRecurring();

    const res = await request(app)
      .get('/api/recurring?isActive=true')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.every(r => r.isActive === true)).toBe(true);
  });

  it('Chỉ trả về của user hiện tại', async () => {
    await createRecurring();
    await request(app)
      .post('/api/recurring')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ templateName: 'Other', type: 'expense', amount: 100, frequency: 'daily' });

    const res = await request(app)
      .get('/api/recurring')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.count).toBe(1);
    expect(res.body.data[0].templateName).toBe('Tiền thuê nhà');
  });

  it('Không có token → 401', async () => {
    const res = await request(app).get('/api/recurring');
    expect(res.status).toBe(401);
  });
});

// ─── Lấy chi tiết 1 giao dịch định kỳ ───────────────────────────────────────

describe('GET /api/recurring/:id', () => {
  it('Lấy thành công → 200', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    const res = await request(app)
      .get(`/api/recurring/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(id);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .get('/api/recurring/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── Cập nhật giao dịch định kỳ ──────────────────────────────────────────────

describe('PUT /api/recurring/:id', () => {
  it('Cập nhật amount thành công → 200', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/recurring/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 3500000 });

    expect(res.status).toBe(200);
    expect(res.body.data.amount).toBe(3500000);
  });

  it('Tắt giao dịch (isActive=false) → 200', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/recurring/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .put('/api/recurring/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 999 });

    expect(res.status).toBe(404);
  });
});

// ─── Thực hiện thủ công ───────────────────────────────────────────────────────

describe('POST /api/recurring/:id/execute', () => {
  it('Thực hiện tạo giao dịch thành công → 200 + transaction mới', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    const res = await request(app)
      .post(`/api/recurring/${id}/execute`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction).toBeDefined();
    expect(res.body.data.transaction.amount).toBe(3000000);
    expect(res.body.data.recurring.executedCount).toBe(1);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .post('/api/recurring/000000000000000000000001/execute')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ─── Xóa giao dịch định kỳ ───────────────────────────────────────────────────

describe('DELETE /api/recurring/:id', () => {
  it('Xóa thành công → 200', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/recurring/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Sau khi xóa → danh sách rỗng', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    await request(app).delete(`/api/recurring/${id}`).set('Authorization', `Bearer ${token}`);

    const res = await request(app).get('/api/recurring').set('Authorization', `Bearer ${token}`);
    expect(res.body.count).toBe(0);
  });

  it('Không xóa được của người khác → 404', async () => {
    const created = await createRecurring();
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/recurring/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});
