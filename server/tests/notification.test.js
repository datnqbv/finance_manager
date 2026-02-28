/**
 * tests/notification.test.js
 * Kiểm thử GET notification, mark as read, mark all as read, delete
 */
import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Notif User', email: 'notif@example.com', password: 'password123' };

let token;
let userId;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token  = res.body.data.token;
  userId = new mongoose.Types.ObjectId(res.body.data.user.id);
});

// Helper: seed notification trực tiếp vào DB
const seedNotification = async (overrides = {}) => {
  const Notification = (await import('../src/models/Notification.model.js')).default;
  return Notification.create({
    userId,
    type: 'info',
    title: 'Test Notification',
    message: 'Đây là thông báo test',
    read: false,
    ...overrides,
  });
};

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('Notification endpoints — auth guard', () => {
  it('GET /api/notifications không có token → 401', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

// ─── GET /api/notifications ───────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('Không có thông báo → trả về 200 + mảng rỗng', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.unreadCount).toBe(0);
  });

  it('Có thông báo → trả về đúng + unreadCount', async () => {
    await seedNotification();
    await seedNotification({ title: 'Thông báo 2', read: true });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.unreadCount).toBe(1);
  });

  it('Lọc read=false → chỉ trả về chưa đọc', async () => {
    await seedNotification({ read: false });
    await seedNotification({ title: 'Đã đọc', read: true });

    const res = await request(app)
      .get('/api/notifications?read=false')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // DB notifications chưa đọc phải thoả mãn
    const dbNotifs = res.body.data.notifications.filter(n => n.id && !n.id.startsWith('goal-') && !n.id.startsWith('recurring-'));
    expect(dbNotifs.every(n => n.read === false)).toBe(true);
  });

  it('Chỉ trả về thông báo của user hiện tại', async () => {
    const Notification = (await import('../src/models/Notification.model.js')).default;

    // Thông báo của user khác (tạo trực tiếp)
    const otherId = new mongoose.Types.ObjectId();
    await Notification.create({
      userId: otherId,
      type: 'warning',
      title: 'Của người khác',
      message: 'Không được thấy',
      read: false,
    });

    await seedNotification({ title: 'Của tôi' });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const mine = res.body.data.notifications.filter(n => n.title === 'Của tôi');
    const other = res.body.data.notifications.filter(n => n.title === 'Của người khác');
    expect(mine.length).toBe(1);
    expect(other.length).toBe(0);
  });
});

// ─── PUT /api/notifications/:id/read ─────────────────────────────────────────

describe('PUT /api/notifications/:id/read', () => {
  it('Đánh dấu đã đọc thành công → 200 + read=true', async () => {
    const notif = await seedNotification();

    const res = await request(app)
      .put(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .put('/api/notifications/000000000000000000000001/read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('Thông báo của người khác → 403', async () => {
    const Notification = (await import('../src/models/Notification.model.js')).default;
    const otherId = new mongoose.Types.ObjectId();
    const notif = await Notification.create({
      userId: otherId, type: 'info', title: 'X', message: 'X', read: false,
    });

    const res = await request(app)
      .put(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/notifications/read-all ─────────────────────────────────────────

describe('PUT /api/notifications/read-all', () => {
  it('Đánh dấu tất cả đã đọc → 200 + unreadCount = 0', async () => {
    await seedNotification();
    await seedNotification({ title: 'Thứ 2' });

    await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.unreadCount).toBe(0);
  });
});

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────

describe('DELETE /api/notifications/:id', () => {
  it('Xóa thành công → 200', async () => {
    const notif = await seedNotification();

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('ID không tồn tại → 404', async () => {
    const res = await request(app)
      .delete('/api/notifications/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('Thông báo của người khác → 403', async () => {
    const Notification = (await import('../src/models/Notification.model.js')).default;
    const otherId = new mongoose.Types.ObjectId();
    const notif = await Notification.create({
      userId: otherId, type: 'info', title: 'X', message: 'X', read: false,
    });

    const res = await request(app)
      .delete(`/api/notifications/${notif._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/notifications/all ───────────────────────────────────────────

describe('DELETE /api/notifications/all', () => {
  it('Xóa tất cả thành công → 200 + danh sách rỗng', async () => {
    await seedNotification();
    await seedNotification({ title: 'Thứ 2' });

    const delRes = await request(app)
      .delete('/api/notifications/all')
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);

    const getRes = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.body.data.unreadCount).toBe(0);
    // DB notifications phải rỗng
    const dbNotifs = getRes.body.data.notifications.filter(
      n => !String(n.id).startsWith('goal-') && !String(n.id).startsWith('recurring-')
    );
    expect(dbNotifs).toHaveLength(0);
  });
});
