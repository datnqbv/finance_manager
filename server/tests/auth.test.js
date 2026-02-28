/**
 * tests/auth.test.js
 * Kiểm thử các API xác thực: đăng ký, đăng nhập, lấy thông tin user
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

// Thiết lập biến môi trường cho test
process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = {
  name: 'Nguyễn Văn Test',
  email: 'test@example.com',
  password: 'password123',
};

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });
afterEach(async () => { await db.clear(); });

// ─── Đăng ký ─────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
  it('Đăng ký thành công → trả về 201 + token', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('Email đã tồn tại → trả về 400', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Thiếu email → trả về lỗi validation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', password: '123456' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });

  it('Mật khẩu quá ngắn (< 6 ký tự) → trả về lỗi', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, password: '123' });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Đăng nhập ───────────────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(testUser);
  });

  it('Đăng nhập thành công → trả về 200 + token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  it('Sai mật khẩu → trả về 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrong_password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Email không tồn tại → trả về 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: testUser.password });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ─── Lấy thông tin user ──────────────────────────────────────────────────────

describe('GET /api/auth/me', () => {
  let token;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.data.token;
  });

  it('Có token hợp lệ → trả về thông tin user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('Không có token → trả về 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Token sai → trả về 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
