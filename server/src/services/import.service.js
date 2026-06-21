import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { Transaction, Category } from '../models/sequelize/index.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Normalize header names to standard keys:
 *   date, type, amount, category, note
 */
const normalizeHeader = (header) => {
  const h = header.trim().toLowerCase();
  if (['date', 'ngày', 'ngay', 'ngày/tháng/năm', 'ngày giao dịch'].includes(h)) return 'date';
  if (['type', 'loại', 'loai', 'loại giao dịch', 'thu/chi'].includes(h)) return 'type';
  if (['amount', 'số tiền', 'so tien', 'sotien', 'tiền', 'tien'].includes(h)) return 'amount';
  if (['category', 'danh mục', 'danh muc', 'danhmuc', 'nhóm'].includes(h)) return 'category';
  if (['note', 'ghi chú', 'ghi chu', 'ghichu', 'mô tả', 'mo ta'].includes(h)) return 'note';
  return h;
};

/**
 * Normalize "type" value: accept income/expense or thu/chi
 */
const normalizeType = (val) => {
  if (!val) return null;
  const v = val.trim().toLowerCase();
  if (['income', 'thu', 'thu nhập', 'thu nhap'].includes(v)) return 'income';
  if (['expense', 'chi', 'chi tiêu', 'chi tieu', 'expense'].includes(v)) return 'expense';
  return null;
};

/**
 * Parse date value: handles JS Date, ISO string, DD/MM/YYYY, DD-MM-YYYY
 */
const parseDate = (val) => {
  if (!val) return null;
  // Already a Date object (from xlsx cellDates:true)
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  // DD/MM/YYYY or DD-MM-YYYY
  const ddmm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmm) return new Date(parseInt(ddmm[3]), parseInt(ddmm[2]) - 1, parseInt(ddmm[1]));
  // ISO YYYY-MM-DD or full ISO string
  const iso = new Date(s);
  return isNaN(iso.getTime()) ? null : iso;
};

const parseCsv = (buffer) => {
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
};

const parseExcel = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};

export const processImportFileService = async (userId, fileBuffer, fileExtension) => {
  let rawRows;
  try {
    rawRows = fileExtension === 'csv' ? parseCsv(fileBuffer) : parseExcel(fileBuffer);
  } catch (e) {
    throw new ErrorResponse('Không thể đọc file: ' + e.message, 400);
  }

  if (!rawRows || rawRows.length === 0) {
    throw new ErrorResponse('File không có dữ liệu', 400);
  }

  // Fetch user's categories for matching
  const userCategories = await Category.findAll({ where: { userId } });
  const categoryMap = {};
  userCategories.forEach(c => { 
    const name = c.name || (c.get ? c.get('name') : undefined); 
    if (name) categoryMap[name.toLowerCase()] = name; 
  });

  const imported = [];
  const skipped = [];

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const rowNum = i + 2; // +2 because row 1 is header

    // Normalize keys
    const row = {};
    for (const [key, val] of Object.entries(rawRow)) {
      row[normalizeHeader(key)] = val;
    }

    // Validate required fields
    const errors = [];

    const date = parseDate(row.date);
    if (!date) errors.push('Ngày không hợp lệ');

    const type = normalizeType(row.type);
    if (!type) errors.push('Loại giao dịch phải là "thu" hoặc "chi"');

    const amount = parseFloat(String(row.amount || '').replace(/[,\s]/g, ''));
    if (isNaN(amount) || amount <= 0) errors.push('Số tiền không hợp lệ');

    const rawCategory = String(row.category || '').trim();
    if (!rawCategory) errors.push('Danh mục không được để trống');

    if (errors.length > 0) {
      skipped.push({ row: rowNum, reason: errors.join('; '), data: rawRow });
      continue;
    }

    // Match category (case-insensitive), fall back to raw value
    const category = categoryMap[rawCategory.toLowerCase()] || rawCategory;

    imported.push({
      userId,
      type,
      amount,
      category,
      date,
      note: String(row.note || '').trim() || undefined,
    });
  }

  // Bulk insert
  let insertedCount = 0;
  if (imported.length > 0) {
    const result = await Transaction.bulkCreate(imported);
    insertedCount = result.length;
  }

  return {
    insertedCount,
    skippedCount: skipped.length,
    skippedDetails: skipped,
  };
};

export const generateImportTemplateService = () => {
  const headers = 'date,type,amount,category,note';
  const sample = [
    '2025-01-15,chi,150000,Ăn uống,Ăn trưa',
    '2025-01-15,thu,5000000,Lương,Lương tháng 1',
    '2025-01-16,chi,50000,Di chuyển,Grab xe máy',
  ].join('\n');

  return headers + '\n' + sample;
};
