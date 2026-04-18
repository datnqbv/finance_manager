import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../utils/sendEmail.js';

// Generate short-lived access token (15 minutes)
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

// Generate long-lived refresh token (30 days)
const generateRefreshToken = (id) => {
  const secret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh_v1');
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

// Keep backward compat alias used by resetPassword
const generateToken = generateAccessToken;

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Create default categories for the new user
    try {
      await Category.createDefaultCategories(user._id);
    } catch (err) {
      console.error('Failed to create default categories:', err);
      // Don't fail registration if category creation fails
    }

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Gửi email chào mừng (không chờ, chạy background)
    sendWelcomeEmail(user.email, user.name).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          budget: user.budget,
          currency: user.currency,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Check for user (include password field)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          budget: user.budget,
          currency: user.currency,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          budget: user.budget,
          currency: user.currency,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, budget, currency, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    user.name = name || user.name;
    user.budget = budget !== undefined ? budget : user.budget;
    user.currency = currency || user.currency;
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          budget: user.budget,
          currency: user.currency,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Change password (authenticated user)
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request password reset (generate token)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }

    // Tạo reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Gửi email với mã reset
    const emailResult = await sendResetPasswordEmail(user.email, resetToken, user.name);

    if (!emailResult.success) {
      // Nếu gửi email thất bại, xóa token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng thử lại sau.'
      });
    }

    // Nếu ở chế độ demo (email chưa cấu hình), trả về mã
    if (emailResult.mode === 'demo') {
      return res.json({
        success: true,
        message: 'Mã xác thực đã được tạo (Demo mode - Email chưa cấu hình)',
        data: {
          email: user.email,
          resetToken, // Trả về mã khi demo
          demo: true
        }
      });
    }

    // Nếu gửi email thành công
    res.json({
      success: true,
      message: 'Mã xác thực đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      data: {
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
    }

    // Tìm user và lấy resetPasswordToken
    const user = await User.findOne({ 
      email,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn'
      });
    }

    // Verify token
    const isValid = await bcrypt.compare(resetToken, user.resetPasswordToken);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực không đúng'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          budget: user.budget,
          currency: user.currency,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Không có refresh token' });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh_v1');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Refresh token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ' });
    }

    const newAccessToken = generateAccessToken(user._id);
    res.json({ success: true, data: { token: newAccessToken } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout - invalidate refresh token
// @route   POST /api/auth/logout
// @access  Public
export const logoutHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $set: { refreshToken: null } }
      );
    }
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({
        success: false,
        message: 'Google token không được cung cấp'
      });
    }

    // Verify google token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    let googleData;

    try {
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      googleData = ticket.getPayload();
    } catch (error) {
      console.error('Google token verification failed:', error);
      return res.status(401).json({
        success: false,
        message: 'Google token không hợp lệ'
      });
    }

    const { sub: googleId, email, name, picture } = googleData;

    // Check if user exists by googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists by email (to link accounts)
      user = await User.findOne({ email });

      if (!user) {
        // Create new user
        user = await User.create({
          name,
          email,
          googleId,
          avatar: picture || null,
          password: null // No password for Google SSO
        });

        // Create default categories for the new user
        try {
          await Category.createDefaultCategories(user._id);
        } catch (err) {
          console.error('Failed to create default categories:', err);
        }

        // Send welcome email
        sendWelcomeEmail(user.email, user.name).catch(err => 
          console.error('Failed to send welcome email:', err)
        );
      } else {
        // Link existing account with Google
        user.googleId = googleId;
        await user.save();
      }
    }

    // Generate tokens
    const token = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Google thành công',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          budget: user.budget,
          currency: user.currency,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi đăng nhập với Google'
    });
  }
};
