/**
 * tests/vip.test.js
 * Kiểm thử giới hạn tài khoản thường và quy trình kích hoạt VIP
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';
import { User } from '../src/models/sequelize/index.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Standard User', email: 'standard@example.com', password: 'password123' };
const adminUser = { name: 'Admin User', email: 'admin@example.com', password: 'password123' };

let userToken;
let adminToken;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();

  // Đăng ký người dùng thường
  const userRes = await request(app).post('/api/auth/register').send(testUser);
  userToken = userRes.body.data.token;

  // Đăng ký người dùng admin và nâng cấp quyền trong DB
  const adminRes = await request(app).post('/api/auth/register').send(adminUser);
  adminToken = adminRes.body.data.token;

  const adminInDb = await User.findOne({ where: { email: adminUser.email } });
  adminInDb.role = 'admin';
  await adminInDb.save();
});

describe('VIP limits & Payments flow', () => {

  // ─── THỬ NGHIỆM GIỚI HẠN TÀI KHOẢN THƯỜNG ─────────────────────────────────────
  
  it('Không cho phép tạo quá 3 ví đối với tài khoản thường', async () => {
    // Tài khoản thường đăng ký xong có sẵn 1 Ví chính
    // Tạo ví thứ 2
    const res2 = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ví 2', initialBalance: 10000 });
    expect(res2.status).toBe(201);

    // Tạo ví thứ 3
    const res3 = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ví 3', initialBalance: 20000 });
    expect(res3.status).toBe(201);

    // Tạo ví thứ 4 -> Bị chặn
    const res4 = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ví 4', initialBalance: 30000 });
    
    expect(res4.status).toBe(403);
    expect(res4.body.success).toBe(false);
    expect(res4.body.message).toContain('giới hạn tối đa 3 ví');
  });

  it('Không cho phép tạo quá 5 ngân sách đối với tài khoản thường', async () => {
    // Tạo 5 ngân sách
    for (let i = 1; i <= 5; i++) {
      const res = await request(app)
        .post('/api/budgets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ categoryName: `Danh muc ${i}`, amount: 100000, period: 'monthly' });
      expect(res.status).toBe(201);
    }

    // Tạo ngân sách thứ 6 -> Bị chặn
    const res6 = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ categoryName: 'Danh muc 6', amount: 100000, period: 'monthly' });

    expect(res6.status).toBe(403);
    expect(res6.body.success).toBe(false);
    expect(res6.body.message).toContain('giới hạn tối đa 5 ngân sách');
  });

  it('Không cho phép tạo quá 30 giao dịch trong tháng đối với tài khoản thường', async () => {
    // Tạo 30 giao dịch
    for (let i = 1; i <= 30; i++) {
      const res = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'expense',
          category: 'Ăn uống',
          amount: 1000,
          date: new Date().toISOString()
        });
      expect(res.status).toBe(201);
    }

    // Tạo giao dịch thứ 31 -> Bị chặn
    const res31 = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        type: 'expense',
        category: 'Ăn uống',
        amount: 1000,
        date: new Date().toISOString()
      });

    expect(res31.status).toBe(403);
    expect(res31.body.success).toBe(false);
    expect(res31.body.message).toContain('tối đa 30 giao dịch mỗi tháng');
  });

  // ─── LUỒNG THANH TOÁN MOCK & SANDBOX ──────────────────────────────────────────

  it('Tạo đơn VIP mới và kích hoạt qua Sandbox', async () => {
    // 1. Tạo order đăng ký VIP 1 tháng
    const orderRes = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 1, amount: 20000 });

    expect(orderRes.status).toBe(201);
    expect(orderRes.body.success).toBe(true);
    const orderId = orderRes.body.data.id;

    // 2. Kích hoạt qua PayOS Webhook (giả lập thanh toán)
    const webhookRes = await request(app)
      .post('/api/vip/payos-webhook')
      .send({ orderCode: orderRes.body.data.paymentCode });
    
    expect(webhookRes.status).toBe(200);

    // 3. Admin duyệt đơn hàng để kích hoạt VIP
    const confirmRes = await request(app)
      .put(`/api/vip/order/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);

    // 4. Xác nhận tài khoản được nâng cấp và bypass giới hạn ví (Tạo ví thứ 4 thành công)
    // Ví 2
    await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ví 2', initialBalance: 10000 });
    // Ví 3
    await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ví 3', initialBalance: 10000 });
    
    // Ví 4 (Nên thành công nhờ VIP)
    const wallet4Res = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Ví 4', initialBalance: 10000 });

    expect(wallet4Res.status).toBe(201);
    expect(wallet4Res.body.success).toBe(true);
  });

  // ─── ADMIN KIỂM DUYỆT ─────────────────────────────────────────────────────────

  it('Admin duyệt giao dịch VIP thủ công', async () => {
    // 1. User tạo đơn hàng đăng ký VIP
    const orderRes = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 12, amount: 180000 });
    const orderId = orderRes.body.data.id;

    // 2. Admin lấy danh sách đơn hàng để kiểm tra
    const listRes = await request(app)
      .get('/api/vip/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.data[0].id).toBe(orderId);
    expect(listRes.body.data[0].status).toBe('pending');

    // 3. Admin phê duyệt giao dịch VIP
    const confirmRes = await request(app)
      .put(`/api/vip/order/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);

    // 4. Kiểm tra User đã là VIP
    const userInDb = await User.findOne({ where: { email: testUser.email } });
    expect(userInDb.isVip).toBe(true);
    expect(new Date(userInDb.vipExpire) > new Date()).toBe(true);
  });

  it('Không cho phép mua gói thấp hơn hoặc bằng thời hạn gói VIP hiện tại', async () => {
    // 1. Tạo và kích hoạt gói 6 tháng
    const order1Res = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 6, amount: 100000 });
    const order1Id = order1Res.body.data.id;

    // Admin duyệt để kích hoạt gói VIP
    await request(app)
      .put(`/api/vip/order/${order1Id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    // 2. Thử tạo tiếp gói 1 tháng -> Bị chặn (hạ cấp)
    const order2Res = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 1, amount: 20000 });
    expect(order2Res.status).toBe(403);
    expect(order2Res.body.success).toBe(false);
    expect(order2Res.body.message).toContain('Bạn đang sử dụng gói VIP');

    // 3. Thử tạo tiếp gói 6 tháng -> Bị chặn (bằng thời hạn hiện tại)
    const order3Res = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 6, amount: 100000 });
    expect(order3Res.status).toBe(403);

    // 4. Thử tạo tiếp gói 12 tháng -> Thành công (nâng cấp thời hạn lớn hơn)
    const order4Res = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 12, amount: 180000 });
    expect(order4Res.status).toBe(201);
  });

  it('Truy vấn lịch sử đơn hàng của bản thân và trạng thái đơn hàng chi tiết', async () => {
    // 1. Tạo đơn hàng
    const orderRes = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 1, amount: 20000 });
    const orderId = orderRes.body.data.id;

    // 2. Query lịch sử đơn hàng
    const historyRes = await request(app)
      .get('/api/vip/my-orders')
      .set('Authorization', `Bearer ${userToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.success).toBe(true);
    expect(historyRes.body.data.length).toBe(1);
    expect(historyRes.body.data[0].id).toBe(orderId);

    // 3. Query trạng thái đơn hàng chi tiết
    const statusRes = await request(app)
      .get(`/api/vip/order/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data.id).toBe(orderId);
    expect(statusRes.body.data.status).toBe('pending');
  });

  it('Hủy tư cách thành viên VIP thành công', async () => {
    // 1. Đăng ký và nâng cấp lên VIP
    const orderRes = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 1, amount: 20000 });
    const orderId = orderRes.body.data.id;

    // Admin duyệt để kích hoạt gói VIP
    await request(app)
      .put(`/api/vip/order/${orderId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    // 2. Hủy VIP
    const cancelRes = await request(app)
      .post('/api/vip/cancel')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.isVip).toBe(false);
    expect(cancelRes.body.data.vipExpire).toBeNull();
  });

  it('Không cho phép tạo đơn hàng VIP mới khi đang có đơn hàng pending khác', async () => {
    // 1. Tạo đơn hàng 1 (ở trạng thái pending)
    const order1 = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 1, amount: 20000 });
    expect(order1.status).toBe(201);

    // 2. Cố tạo đơn hàng 2 (trong khi đơn hàng 1 vẫn đang pending) -> Bị chặn (400)
    const order2 = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 6, amount: 100000 });
    expect(order2.status).toBe(400);
    expect(order2.body.success).toBe(false);
    expect(order2.body.message).toContain('đang có một yêu cầu đăng ký VIP');
  });

  it('Hủy/Xóa đơn hàng VIP đối với User (chỉ đơn hàng pending) và Admin (mọi đơn)', async () => {
    // 1. Tạo đơn hàng 1 (để thử xóa bởi user khi pending)
    const order1Res = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 1, amount: 20000 });
    const order1Id = order1Res.body.data.id;

    // 2. User xóa đơn hàng 1 (đang pending) -> Thành công
    const userDelPending = await request(app)
      .delete(`/api/vip/order/${order1Id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(userDelPending.status).toBe(200);
    expect(userDelPending.body.success).toBe(true);

    // 3. Tạo đơn hàng 2 (để duyệt rồi thử xóa bởi user -> should fail)
    const order2Res = await request(app)
      .post('/api/vip/order')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ durationMonths: 6, amount: 100000 });
    const order2Id = order2Res.body.data.id;

    // Duyệt đơn hàng 2 thành completed
    await request(app)
      .put(`/api/vip/order/${order2Id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    // 4. User xóa đơn hàng 2 (đã completed) -> Thất bại
    const userDelCompleted = await request(app)
      .delete(`/api/vip/order/${order2Id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(userDelCompleted.status).toBe(400);

    // 5. Admin xóa đơn hàng 2 (đã completed) -> Thành công (Admin có quyền xóa/từ chối mọi log)
    const adminDelCompleted = await request(app)
      .delete(`/api/vip/order/${order2Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDelCompleted.status).toBe(200);
    expect(adminDelCompleted.body.success).toBe(true);
  });
});
