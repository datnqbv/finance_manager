/**
 * tests/import.test.js
 * Kiểm thử import giao dịch từ CSV/Excel và tải template
 */
import request from 'supertest';
import app from '../src/app.js';
import * as db from './helpers/db.js';

process.env.JWT_SECRET = 'test_jwt_secret_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_at_least_32_chars';
process.env.NODE_ENV = 'test';

const testUser = { name: 'Import User', email: 'import@example.com', password: 'password123' };

let token;

beforeAll(async () => { await db.connect(); });
afterAll(async () => { await db.close(); });

beforeEach(async () => {
  await db.clear();
  const res = await request(app).post('/api/auth/register').send(testUser);
  token = res.body.data.token;
});

// ─── Helpers: tạo buffer CSV ──────────────────────────────────────────────────

const makeCsvBuffer = (content) => Buffer.from(content, 'utf-8');

const validCsv = makeCsvBuffer(
  'date,type,amount,category,note\n' +
  '2025-01-15,chi,150000,Ăn uống,Ăn trưa\n' +
  '2025-01-16,thu,5000000,Lương,Lương tháng 1\n' +
  '2025-01-17,chi,50000,Di chuyển,Grab\n'
);

const partiallyInvalidCsv = makeCsvBuffer(
  'date,type,amount,category,note\n' +
  '2025-01-15,chi,150000,Ăn uống,Hợp lệ\n' +       // hợp lệ
  'invalid-date,chi,150000,Ăn uống,Ngày sai\n' +    // ngày sai
  '2025-01-17,unknown,50000,Di chuyển,Loại sai\n' + // type sai
  '2025-01-18,chi,-100,Ăn uống,Số âm\n'             // amount âm
);

const invalidAllCsv = makeCsvBuffer(
  'date,type,amount,category,note\n' +
  'bad-date,loaikhonghople,-999,SomeCategory,bad row\n'
);

// ─── Auth guard ───────────────────────────────────────────────────────────────

describe('Import endpoints — auth guard', () => {
  it('POST /api/import/transactions không có token → 401', async () => {
    const res = await request(app)
      .post('/api/import/transactions')
      .attach('file', validCsv, { filename: 'test.csv', contentType: 'text/csv' });

    expect(res.status).toBe(401);
  });

  it('GET /api/import/template không có token → 401', async () => {
    const res = await request(app).get('/api/import/template');
    expect(res.status).toBe(401);
  });
});

// ─── POST /api/import/transactions ───────────────────────────────────────────

describe('POST /api/import/transactions', () => {
  it('Import CSV hợp lệ → 200 + imported=3', async () => {
    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', validCsv, { filename: 'test.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.imported).toBe(3);
    expect(res.body.data.skipped).toBe(0);
  });

  it('Sau khi import → giao dịch thực sự được lưu vào DB', async () => {
    await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', validCsv, { filename: 'test.csv', contentType: 'text/csv' });

    const txRes = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(txRes.body.data.length).toBe(3);
  });

  it('CSV có một số dòng lỗi → import hợp lệ + skip lỗi', async () => {
    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', partiallyInvalidCsv, { filename: 'partial.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(1);
    expect(res.body.data.skipped).toBe(3);
    expect(Array.isArray(res.body.data.skippedDetails)).toBe(true);
  });

  it('CSV hỗ trợ header tiếng Việt (ngày, loại, số tiền, danh mục)', async () => {
    const vnCsv = makeCsvBuffer(
      'ngày,loại,số tiền,danh mục,ghi chú\n' +
      '2025-02-01,chi,200000,Ăn uống,Bún bò\n'
    );

    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', vnCsv, { filename: 'vn.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(1);
  });

  it('CSV hỗ trợ loại "thu" và "income" → đều nhận', async () => {
    const csv = makeCsvBuffer(
      'date,type,amount,category,note\n' +
      '2025-01-01,thu,1000000,Lương,Test thu\n' +
      '2025-01-02,income,2000000,Lương,Test income\n'
    );

    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csv, { filename: 'types.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(2);
  });

  it('CSV với ngày DD/MM/YYYY → parse đúng', async () => {
    const csv = makeCsvBuffer(
      'date,type,amount,category,note\n' +
      '15/01/2025,chi,100000,Ăn uống,Test ngày VN\n'
    );

    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csv, { filename: 'date_vn.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(1);
  });

  it('Không gửi file → lỗi 400', async () => {
    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('File CSV rỗng (chỉ có header) → lỗi 400', async () => {
    const emptyCsv = makeCsvBuffer('date,type,amount,category,note\n');

    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', emptyCsv, { filename: 'empty.csv', contentType: 'text/csv' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Tất cả dòng đều lỗi → imported=0, skipped>0', async () => {
    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', invalidAllCsv, { filename: 'bad.csv', contentType: 'text/csv' });

    expect(res.status).toBe(200);
    expect(res.body.data.imported).toBe(0);
    expect(res.body.data.skipped).toBeGreaterThan(0);
  });

  it('File không hỗ trợ (PDF) → lỗi', async () => {
    const res = await request(app)
      .post('/api/import/transactions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-fake'), { filename: 'test.pdf', contentType: 'application/pdf' });

    expect([400, 500]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/import/template ─────────────────────────────────────────────────

describe('GET /api/import/template', () => {
  it('Tải template CSV → 200 + Content-Type text/csv', async () => {
    const res = await request(app)
      .get('/api/import/template')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/filename/);
  });

  it('Template chứa header đúng định dạng', async () => {
    const res = await request(app)
      .get('/api/import/template')
      .set('Authorization', `Bearer ${token}`);

    const text = res.text;
    expect(text).toMatch(/date/);
    expect(text).toMatch(/type/);
    expect(text).toMatch(/amount/);
    expect(text).toMatch(/category/);
  });
});
