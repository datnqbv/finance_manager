/**
 * tests/wallet.test.js
 * Kiểm thử API Quản lý ví, chuyển tiền và đồng bộ số dư
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Wallet User', email: 'wallet@example.com', password: 'password123' };
let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  // Registering will automatically create default "Ví chính"
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

describe('Wallet API Endpoints', () => {
  
  // ─── GET /api/wallets ──────────────────────────────────────────────────────
  it('GET /api/wallets -> Trả về danh sách ví kèm ví mặc định "Ví chính"', async () => {
    const res = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Ví chính');
    expect(res.body.data[0].isDefault).toBe(true);
    expect(Number(res.body.data[0].balance)).toBe(0);
  });

  // ─── POST /api/wallets ─────────────────────────────────────────────────────
  it('POST /api/wallets -> Tạo ví mới thành công', async () => {
    const newWallet = {
      name: 'Ví Momo',
      initialBalance: 50000,
      icon: '📱',
      color: '#E01B84',
      isDefault: false
    };

    const res = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send(newWallet);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Ví Momo');
    expect(Number(res.body.data.balance)).toBe(50000);
    expect(res.body.data.isDefault).toBe(false);
  });

  it('POST /api/wallets -> Không cho tạo ví trùng tên rỗng', async () => {
    const res = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ─── PUT /api/wallets/:id ──────────────────────────────────────────────────
  it('PUT /api/wallets/:id -> Cập nhật thông tin ví thành công', async () => {
    // Lấy ví chính trước
    const getRes = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);
    const walletId = getRes.body.data[0].id;

    const res = await request(app)
      .put(`/api/wallets/${walletId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ví tiền mặt',
        initialBalance: 100000,
        icon: '💵'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Ví tiền mặt');
    expect(Number(res.body.data.balance)).toBe(100000); // balance increases by diff of initialBalance
    expect(res.body.data.icon).toBe('💵');
  });

  // ─── POST /api/wallets/transfer ────────────────────────────────────────────
  it('POST /api/wallets/transfer -> Chuyển khoản thành công giữa 2 ví', async () => {
    // 1. Lấy ví chính (Ví A) và cập nhật số dư ban đầu lên 100k
    const getRes = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);
    const walletAId = getRes.body.data[0].id;

    await request(app)
      .put(`/api/wallets/${walletAId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ initialBalance: 100000 });

    // 2. Tạo ví phụ (Ví B) với số dư 0k
    const createBRes = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ví ATM', initialBalance: 0 });
    const walletBId = createBRes.body.data.id;

    // 3. Thực hiện chuyển 40k từ A sang B
    const transferRes = await request(app)
      .post('/api/wallets/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fromWalletId: walletAId,
        toWalletId: walletBId,
        amount: 40000,
        note: 'Chuyển quỹ'
      });

    expect(transferRes.status).toBe(201);
    expect(transferRes.body.success).toBe(true);

    // 4. Kiểm tra số dư ví A (còn 60k) và ví B (được 40k)
    const checkRes = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);

    const wallets = checkRes.body.data;
    const walletA = wallets.find(w => w.id === walletAId);
    const walletB = wallets.find(w => w.id === walletBId);

    expect(Number(walletA.balance)).toBe(60000);
    expect(Number(walletB.balance)).toBe(40000);
  });

  // ─── DELETE /api/wallets/:id ───────────────────────────────────────────────
  it('DELETE /api/wallets/:id -> Xóa ví thành công và chuyển giao dịch sang ví còn lại', async () => {
    // 1. Lấy ví chính (Ví A)
    const getRes = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);
    const walletAId = getRes.body.data[0].id;

    // 2. Tạo ví phụ (Ví B)
    const createBRes = await request(app)
      .post('/api/wallets')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ví B', initialBalance: 10000 });
    const walletBId = createBRes.body.data.id;

    // 3. Tạo một giao dịch thu nhập 50k liên kết với Ví B
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        category: 'Ăn uống',
        amount: 50000,
        walletId: walletBId
      });

    // 4. Xóa Ví B
    const deleteRes = await request(app)
      .delete(`/api/wallets/${walletBId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    // 5. Kiểm tra Ví B đã biến mất và giao dịch được chuyển sang Ví A
    const listRes = await request(app)
      .get('/api/wallets')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.body.data).toHaveLength(1);
    expect(listRes.body.data[0].id).toBe(walletAId);
    // Ví A có số dư = 0 (ban đầu) + 50k (giao dịch chuyển từ B sang) = 50k
    expect(Number(listRes.body.data[0].balance)).toBe(50000);
  });
});
