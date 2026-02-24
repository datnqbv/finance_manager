import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword, refreshTokenHandler, logoutHandler } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiter: max 10 failed login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // chỉ đếm request thất bại
});

// Rate limiter: max 5 register attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 1 giờ.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshTokenHandler);
router.post('/logout', logoutHandler);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
