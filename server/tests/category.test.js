/**
 * tests/category.test.js
 * Kiểm thử CRUD danh mục
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Cat User', email: 'category@example.com', password: 'password123' };

let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

// Helper: tạo 1 danh mục nhanh với tên KHÔNG trùng default categories
const createCategory = (overrides = {}) =>
  request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Danh mục test tùy chỉnh',
      type: 'expense',
      icon: '🍔',
      color: '#FF0000',
      ...overrides,
    });

// ─── Lấy danh sách ───────────────────────────────────────────────────────────

describe('GET /api/categories', () => {
  it('Sau khi đăng ký → đã có danh mục mặc định', async () => {
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Phải có ít nhất 1 danh mục mặc định
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Không có token → 401', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });
});

// ─── Tạo danh mục ────────────────────────────────────────────────────────────

describe('POST /api/categories', () => {
  it('Tạo danh mục chi tiêu thành công → 201', async () => {
    // Dùng tên KHÔNG trùng default categories (unique index userId+name)
    const res = await createCategory({ name: 'Chi tiêu đặc biệt test', type: 'expense' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Chi tiêu đặc biệt test');
    expect(res.body.data.type).toBe('expense');
  });

  it('Tạo danh mục thu nhập thành công → 201', async () => {
    const res = await createCategory({ name: 'Thu nhập phụ test', type: 'income', icon: '💰' });

    expect(res.status).toBe(201);
    expect(res.body.data.type).toBe('income');
  });

  it('Thiếu name → lỗi 400', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', icon: '🍔' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('Không có token → 401', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ name: 'Test', type: 'expense' });

    expect(res.status).toBe(401);
  });
});

// ─── Cập nhật danh mục ───────────────────────────────────────────────────────

describe('PUT /api/categories/:id', () => {
  it('Cập nhật tên thành công → 200', async () => {
    const created = await createCategory({ name: 'Tên cũ test abc' });
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Tên mới test xyz' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Tên mới test xyz');
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .put('/api/categories/64a000000000000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Whatever' });

    expect(res.status).toBe(404);
  });
});

// ─── Xóa danh mục ────────────────────────────────────────────────────────────

describe('DELETE /api/categories/:id', () => {
  it('Xóa danh mục thành công → 200', async () => {
    const created = await createCategory({ name: 'Xóa tôi test 99' });
    const id = created.body.data._id;

    const res = await request(app)
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Sau khi xóa → không còn trong danh sách', async () => {
    const created = await createCategory({ name: 'Tạm thời test 88' });
    const id = created.body.data._id;

    await request(app)
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    const found = res.body.data.find(c => c._id === id);
    expect(found).toBeUndefined();
  });

  it('Không xóa được danh mục của người khác', async () => {
    const created = await createCategory({ name: 'Custom cat user1 unique' });
    const id = created.body.data._id;

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User2', email: 'user2cat@example.com', password: 'password123' });
    const token2 = res2.body.data.token;

    const del = await request(app)
      .delete(`/api/categories/${id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(del.status).toBeGreaterThanOrEqual(400);
  });
});
