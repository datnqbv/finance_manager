import multer from 'multer';
import { processImportFileService, generateImportTemplateService } from '../services/import.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

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

// @desc    Import transactions from CSV/Excel
// @route   POST /api/import/transactions
// @access  Private
export const importTransactions = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ErrorResponse('Vui lòng chọn file để import', 400);
  }

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  
  const data = await processImportFileService(req.user.id, req.file.buffer, ext);

  res.json({
    success: true,
    message: `Import hoàn tất: ${data.insertedCount} giao dịch thành công, ${data.skippedCount} dòng bỏ qua`,
    data: {
      imported: data.insertedCount,
      skipped: data.skippedCount,
      skippedDetails: data.skippedDetails,
    },
  });
});

// @desc    Download CSV import template
// @route   GET /api/import/template
// @access  Private
export const getTemplate = asyncHandler(async (req, res) => {
  const csv = generateImportTemplateService();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="import_template.csv"');
  res.send('\uFEFF' + csv); // BOM for Excel compatibility
});
