/**
 * tests/splitTransaction.test.js
 * Kiểm thử tính năng Tách giao dịch (Split Transaction)
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';
import { Transaction } from '../src/models/sequelize/index.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Test User', email: 'split_test@example.com', password: 'password123' };

let token;
let defaultWalletId;

beforeAll(async () => { 
  await db.connect(); 
});

afterAll(async () => { 
  await db.close(); 
});

beforeEach(async () => {
  await db.clear();
  // Đăng ký user
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;

  // Lấy ví mặc định được tạo tự động khi đăng ký
  const walletRes = await request(app)
    .get('/api/wallets')
    .set('Authorization', `Bearer ${token}`);
  
  if (walletRes.body.data && walletRes.body.data.length > 0) {
    defaultWalletId = walletRes.body.data[0].id;
  }
});

// Helper tạo giao dịch gốc
const createBaseTx = (amount = 500000, type = 'expense', category = 'Ăn uống') => {
  return request(app)
    .post('/api/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({
      type,
      category,
      amount,
      walletId: defaultWalletId,
      date: new Date().toISOString(),
      note: 'Hóa đơn đi siêu thị'
    });
};

describe('Tách giao dịch (Split Transaction) APIs', () => {

  describe('POST /api/transactions/:id/split', () => {
    it('Tách giao dịch hợp lệ thành công -> 200 và tạo các giao dịch con', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      const splitPayload = {
        splits: [
          { category: 'Thực phẩm', amount: 200000, note: 'Mua thịt rau' },
          { category: 'Đồ gia dụng', amount: 300000, note: 'Mua nước lau sàn' }
        ]
      };

      const res = await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send(splitPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.parent.id).toBe(parentId);
      expect(res.body.data.children).toHaveLength(2);
      expect(Number(res.body.data.children[0].amount)).toBe(200000);
      expect(res.body.data.children[0].parentId).toBe(parentId);
      expect(Number(res.body.data.children[1].amount)).toBe(300000);
      expect(res.body.data.children[1].parentId).toBe(parentId);

      // Kiểm tra DB thực tế có 3 giao dịch (1 gốc, 2 con)
      const count = await Transaction.count({ where: { userId: txRes.body.data.userId } });
      expect(count).toBe(3);
    });

    it('Tách giao dịch thất bại nếu tổng số tiền các phần không bằng tiền gốc -> 400', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      const splitPayload = {
        splits: [
          { category: 'Thực phẩm', amount: 200000 },
          { category: 'Đồ gia dụng', amount: 250000 } // tổng = 450k != 500k
        ]
      };

      const res = await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send(splitPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Tổng các phần tách');
    });

    it('Tách giao dịch chuyển khoản -> 400', async () => {
      // Tạo một ví phụ để chuyển khoản
      const wallet2Res = await request(app)
        .post('/api/wallets')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ví tiết kiệm', balance: 1000000 });
      const wallet2Id = wallet2Res.body.data.id;

      // Tạo giao dịch chuyển khoản
      const transferRes = await request(app)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          type: 'transfer',
          amount: 100000,
          walletId: defaultWalletId,
          toWalletId: wallet2Id,
          date: new Date().toISOString()
        });
      const transferId = transferRes.body.data.id;

      const splitPayload = {
        splits: [
          { category: 'A', amount: 50000 },
          { category: 'B', amount: 50000 }
        ]
      };

      const res = await request(app)
        .post(`/api/transactions/${transferId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send(splitPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Không thể tách giao dịch chuyển khoản');
    });

    it('Không thể tách giao dịch khi ít hơn 2 phần -> 400', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      const splitPayload = {
        splits: [
          { category: 'Thực phẩm', amount: 500000 }
        ]
      };

      const res = await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send(splitPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Không thể tách giao dịch con (đã có parentId) -> 400', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      const splitPayload = {
        splits: [
          { category: 'Thực phẩm', amount: 200000 },
          { category: 'Đồ gia dụng', amount: 300000 }
        ]
      };

      const splitRes = await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send(splitPayload);

      const childId = splitRes.body.data.children[0].id;

      // Thử tách tiếp trên giao dịch con
      const childSplitPayload = {
        splits: [
          { category: 'A', amount: 100000 },
          { category: 'B', amount: 100000 }
        ]
      };

      const res = await request(app)
        .post(`/api/transactions/${childId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send(childSplitPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Không thể tách giao dịch con');
    });
  });

  describe('DELETE /api/transactions/:id/split', () => {
    it('Hủy tách giao dịch (unsplit) thành công -> xóa các giao dịch con trong DB', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      // Thực hiện tách trước
      await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { category: 'Thực phẩm', amount: 200000 },
            { category: 'Đồ gia dụng', amount: 300000 }
          ]
        });

      // Kiểm tra DB có 3 items
      expect(await Transaction.count({ where: { userId: txRes.body.data.userId } })).toBe(3);

      // Gọi API gỡ tách
      const res = await request(app)
        .delete(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Sau khi hủy tách, DB chỉ còn giao dịch gốc
      expect(await Transaction.count({ where: { userId: txRes.body.data.userId } })).toBe(1);
    });

    it('Gỡ tách giao dịch chưa từng được tách -> 400', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      const res = await request(app)
        .delete(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('chưa được tách');
    });
  });

  describe('Tích hợp hiển thị và xóa giao dịch', () => {
    it('GET /api/transactions chỉ trả về giao dịch gốc và kèm theo mảng splitChildren lồng bên trong', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      // Thực hiện tách
      await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { category: 'Thực phẩm', amount: 200000 },
            { category: 'Đồ gia dụng', amount: 300000 }
          ]
        });

      // Lấy danh sách giao dịch
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      // Chỉ trả về 1 dòng giao dịch gốc ở danh sách chính
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(parentId);
      
      // Có trường splitChildren lồng bên trong chứa 2 giao dịch con
      expect(res.body.data[0].splitChildren).toBeDefined();
      expect(res.body.data[0].splitChildren).toHaveLength(2);
      expect(Number(res.body.data[0].splitChildren[0].amount)).toBe(200000);
    });

    it('Khi xóa giao dịch gốc (DELETE /api/transactions/:id), các giao dịch con tự động bị xóa theo', async () => {
      const txRes = await createBaseTx(500000);
      const parentId = txRes.body.data.id;

      // Thực hiện tách
      await request(app)
        .post(`/api/transactions/${parentId}/split`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          splits: [
            { category: 'Thực phẩm', amount: 200000 },
            { category: 'Đồ gia dụng', amount: 300000 }
          ]
        });

      expect(await Transaction.count({ where: { userId: txRes.body.data.userId } })).toBe(3);

      // Xóa giao dịch gốc
      const deleteRes = await request(app)
        .delete(`/api/transactions/${parentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Tất cả giao dịch cha và con đều bị xóa sạch khỏi database
      expect(await Transaction.count({ where: { userId: txRes.body.data.userId } })).toBe(0);
    });
  });
});
