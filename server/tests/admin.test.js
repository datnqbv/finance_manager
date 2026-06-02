import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';
import { User, VipOrder } from '../src/models/sequelize/index.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });
afterEach(async () => { await db.clear(); });

describe('Admin APIs', () => {
  let adminToken, userToken, testUserId;

  beforeEach(async () => {
    // 1. Create an admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin User', email: 'admin@example.com', password: 'password123' });
    
    // update admin role directly in db
    const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    adminUser.role = 'admin';
    await adminUser.save();
    
    adminToken = adminRes.body.data.token;

    // 2. Create a standard user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Normal User', email: 'user@example.com', password: 'password123' });
    
    userToken = userRes.body.data.token;
    testUserId = userRes.body.data.user.id;
  });

  it('Admin can view dashboard overview including VIP revenue metrics', async () => {
    // Create a mock completed VIP order
    await VipOrder.create({
      userId: testUserId,
      amount: 180000,
      durationMonths: 12,
      status: 'completed',
      paymentCode: 'VIP123'
    });

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counts.vipRevenue).toBe(180000);
    expect(res.body.data.past6Months).toBeInstanceOf(Array);
  });

  it('Admin can manually override VIP status & Expiry date', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${testUserId}/vip`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isVip: true, vipExpire: '2026-12-31' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isVip).toBe(true);

    // Verify database was updated
    const updatedUser = await User.findByPk(testUserId);
    expect(updatedUser.isVip).toBe(true);
    expect(new Date(updatedUser.vipExpire).getFullYear()).toBe(2026);
  });

  it('Admin can ban a user and banned user cannot call protect APIs or login', async () => {
    // 1. Ban user
    const banRes = await request(app)
      .patch(`/api/admin/users/${testUserId}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBanned: true });

    expect(banRes.status).toBe(200);
    expect(banRes.body.success).toBe(true);
    expect(banRes.body.data.isBanned).toBe(true);

    // 2. Try calling API with user token -> expect 403
    const apiRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(apiRes.status).toBe(403);
    expect(apiRes.body.success).toBe(false);

    // 3. Try logging in again -> expect 403
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.success).toBe(false);
  });

  it('Admin can reset a user password', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${testUserId}/password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'newSecurePassword123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Try logging in with new password -> expect 200 success
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'newSecurePassword123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
  });
});
