import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: 'Đăng ký thành công',
    data
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    data
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user.id);
  res.json({
    success: true,
    data
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const data = await authService.updateProfile(req.user.id, req.body);
  res.json({
    success: true,
    message: 'Cập nhật thành công',
    data
  });
});

// @desc    Change password (authenticated user)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ success: true, message: 'Đổi mật khẩu thành công' });
});

// @desc    Request password reset (generate token)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword(req.body);
  
  if (data.emailResult.mode === 'demo') {
    return res.json({
      success: true,
      message: 'Mã xác thực đã được tạo (Demo mode - Email chưa cấu hình)',
      data: {
        email: data.user.email,
        resetToken: data.resetToken,
        demo: true
      }
    });
  }

  res.json({
    success: true,
    message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
    data: {
      email: data.user.email
    }
  });
});

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  res.json({
    success: true,
    message: 'Đặt lại mật khẩu thành công',
    data
  });
});

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshTokenHandler = asyncHandler(async (req, res) => {
  const data = await authService.refreshTokenHandler(req.body);
  res.json({ success: true, data });
});

// @desc    Logout - invalidate refresh token
// @route   POST /api/auth/logout
// @access  Public
export const logoutHandler = asyncHandler(async (req, res) => {
  await authService.logoutHandler(req.body);
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = asyncHandler(async (req, res) => {
  const data = await authService.googleLogin(req.body);
  res.status(200).json({
    success: true,
    message: 'Đăng nhập bằng Google thành công',
    data
  });
});
