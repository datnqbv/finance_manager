import { parse as csvParse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import multer from 'multer';
import Transaction from '../models/Transaction.model.js';
import Category from '../models/Category.model.js';

// Multer: lưu file trong memory
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.match(/\.(csv|xls|xlsx)$/i)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file CSV hoặc Excel (.csv, .xls, .xlsx)'));
    }
  },
});

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

/**
 * Parse rows from CSV buffer
 */
const parseCsv = (buffer) => {
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, ''); // strip BOM
  const records = csvParse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
};

/**
 * Parse rows from Excel buffer
 */
const parseExcel = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
};

// @desc    Import transactions from CSV/Excel
// @route   POST /api/import/transactions
// @access  Private
export const importTransactions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file để import' });
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let rawRows;
    try {
      rawRows = ext === 'csv' ? parseCsv(req.file.buffer) : parseExcel(req.file.buffer);
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Không thể đọc file: ' + e.message });
    }

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ success: false, message: 'File không có dữ liệu' });
    }

    // Fetch user's categories for matching
    const userCategories = await Category.find({ userId: req.user.id }).lean();
    const categoryMap = {};
    userCategories.forEach(c => { categoryMap[c.name.toLowerCase()] = c.name; });

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
        userId: req.user.id,
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
      const result = await Transaction.insertMany(imported, { ordered: false });
      insertedCount = result.length;
    }

    res.json({
      success: true,
      message: `Import hoàn tất: ${insertedCount} giao dịch thành công, ${skipped.length} dòng bỏ qua`,
      data: {
        imported: insertedCount,
        skipped: skipped.length,
        skippedDetails: skipped,
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download CSV import template
// @route   GET /api/import/template
// @access  Private
export const getTemplate = async (req, res) => {
  const headers = 'date,type,amount,category,note';
  const sample = [
    '2025-01-15,chi,150000,Ăn uống,Ăn trưa',
    '2025-01-15,thu,5000000,Lương,Lương tháng 1',
    '2025-01-16,chi,50000,Di chuyển,Grab xe máy',
  ].join('\n');

  const csv = headers + '\n' + sample;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="import_template.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel compatibility
};
