import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import Category from '../models/Category.model.js';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../utils/sendEmail.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

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

    // Generate token
    const token = generateToken(user._id);

    // Gửi email chào mừng (không chờ, chạy background)
    sendWelcomeEmail(user.email, user.name).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        token,
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

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
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

    // Generate new JWT token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      data: {
        token,
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
