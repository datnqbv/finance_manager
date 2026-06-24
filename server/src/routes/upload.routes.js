import express from 'express';
import multer from 'multer';
import { PassThrough } from 'stream';
import cloudinary from '../config/cloudinary.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Sử dụng memory storage để upload trực tiếp buffer lên Cloudinary
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Route protected bằng middleware auth
router.post('/receipt', protect, upload.single('receipt'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn file ảnh hóa đơn' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'expense-manager/receipts' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh lên Cloudinary' });
      }
      res.json({ success: true, receiptUrl: result.secure_url });
    }
  );

  const bufferStream = new PassThrough();
  bufferStream.end(req.file.buffer);
  bufferStream.pipe(uploadStream);
});

export default router;
