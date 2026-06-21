import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, Category, Wallet } from '../models/sequelize/index.js';
import { sendResetPasswordEmail, sendWelcomeEmail } from '../utils/sendEmail.js';
import { Op } from 'sequelize';
import ErrorResponse from '../utils/errorResponse.js';

// Generate short-lived access token (15 minutes)
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

// Generate long-lived refresh token (30 days)
export const generateRefreshToken = (id) => {
  const secret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh_v1');
  return jwt.sign({ id }, secret, {
    expiresIn: '30d'
  });
};

const formatUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  budget: user.budget,
  currency: user.currency,
  avatar: user.avatar,
  isVip: user.isVip,
  vipExpire: user.vipExpire
});

export const register = async (data) => {
  const { name, email, password } = data;

  const userExists = await User.findOne({ where: { email } });
  if (userExists) {
    throw new ErrorResponse('Email đã được sử dụng', 400);
  }

  if (!password || password.length < 6) {
    throw new ErrorResponse('Mật khẩu phải có ít nhất 6 ký tự', 400);
  }

  const user = await User.create({ name, email, password });

  try {
    await Promise.all([
      Category.createDefaultCategories(user.id),
      Wallet.create({
        userId: user.id,
        name: 'Ví chính',
        isDefault: true,
        icon: '💼',
        color: '#3B82F6',
        balance: 0,
        initialBalance: 0
      })
    ]);
  } catch (err) {
    console.error('Failed to create default categories or wallet:', err);
  }

  const token = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendWelcomeEmail(user.email, user.name).catch(err => 
    console.error('Failed to send welcome email:', err)
  );

  return {
    token,
    refreshToken,
    user: formatUserResponse(user)
  };
};

export const login = async (data) => {
  const { email, password } = data;

  if (!email || !password) {
    throw new ErrorResponse('Vui lòng nhập email và mật khẩu', 400);
  }

  const user = await User.findOne({ where: { email }, attributes: { include: ['password'] } });
  
  if (!user) {
    throw new ErrorResponse('Email hoặc mật khẩu không đúng', 401);
  }

  if (user.isBanned) {
    throw new ErrorResponse('Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.', 403);
  }

  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    throw new ErrorResponse('Email hoặc mật khẩu không đúng', 401);
  }

  const token = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshToken = refreshToken;

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
  if (user.lastLoginDate !== today) {
    user.lastLoginDate = today;
  }
  await user.save({ validateBeforeSave: false });

  return {
    token,
    refreshToken,
    user: formatUserResponse(user)
  };
};

export const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ErrorResponse('Người dùng không tồn tại', 404);
  }

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
  if (user.lastLoginDate !== today) {
    user.lastLoginDate = today;
    await user.save({ validateBeforeSave: false });
  }

  return {
    user: formatUserResponse(user)
  };
};

export const updateProfile = async (userId, data) => {
  const { name, budget, currency, avatar } = data;

  const user = await User.findByPk(userId);

  if (!user) {
    throw new ErrorResponse('Người dùng không tồn tại', 404);
  }

  user.name = name || user.name;
  user.budget = budget !== undefined ? budget : user.budget;
  user.currency = currency || user.currency;
  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  await user.save();

  return {
    user: formatUserResponse(user)
  };
};

export const changePassword = async (userId, data) => {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    throw new ErrorResponse('Vui lòng nhập đầy đủ thông tin', 400);
  }
  if (newPassword.length < 6) {
    throw new ErrorResponse('Mật khẩu mới phải có ít nhất 6 ký tự', 400);
  }

  const user = await User.findByPk(userId, { attributes: { include: ['password'] } });
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ErrorResponse('Mật khẩu hiện tại không đúng', 401);
  }

  user.password = newPassword;
  await user.save();

  return true;
};

export const forgotPassword = async (data) => {
  const { email } = data;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new ErrorResponse('Không tìm thấy tài khoản với email này', 404);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const emailResult = await sendResetPasswordEmail(user.email, resetToken, user.name);

  if (!emailResult.success) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse('Không thể gửi email. Vui lòng thử lại sau.', 500);
  }

  return { emailResult, user, resetToken };
};

export const resetPassword = async (data) => {
  const { email, resetToken, newPassword } = data;

  if (!email || !resetToken || !newPassword) {
    throw new ErrorResponse('Vui lòng cung cấp đầy đủ thông tin', 400);
  }

  const user = await User.findOne({
    where: { email, resetPasswordExpire: { [Op.gt]: new Date() } },
    attributes: { include: ['resetPasswordToken','resetPasswordExpire'] }
  });

  if (!user) {
    throw new ErrorResponse('Mã xác thực không hợp lệ hoặc đã hết hạn', 400);
  }

  const isValid = await bcrypt.compare(resetToken, user.resetPasswordToken);

  if (!isValid) {
    throw new ErrorResponse('Mã xác thực không đúng', 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    token,
    refreshToken,
    user: formatUserResponse(user)
  };
};

export const refreshTokenHandler = async (data) => {
  const { refreshToken } = data;

  if (!refreshToken) {
    throw new ErrorResponse('Không có refresh token', 401);
  }

  const refreshSecret = process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh_v1');
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, refreshSecret);
  } catch (err) {
    throw new ErrorResponse('Refresh token hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại', 401);
  }

  const user = await User.findByPk(decoded.id, { attributes: { include: ['refreshToken'] } });
  if (!user || user.refreshToken !== refreshToken) {
    throw new ErrorResponse('Refresh token không hợp lệ', 401);
  }

  const newAccessToken = generateAccessToken(user.id);
  return { token: newAccessToken };
};

export const logoutHandler = async (data) => {
  const { refreshToken } = data;
  if (refreshToken) {
    await User.update({ refreshToken: null }, { where: { refreshToken } });
  }
  return true;
};

export const googleLogin = async (data) => {
  const { googleToken } = data;

  if (!googleToken) {
    throw new ErrorResponse('Google token không được cung cấp', 400);
  }

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
    throw new ErrorResponse('Google token không hợp lệ', 401);
  }
  
  const { sub: googleId, email, name, picture } = googleData;

  let user = await User.findOne({ where: { googleId } });

  if (!user) {
    user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture || null,
        password: null
      });

      try {
        await Promise.all([
          Category.createDefaultCategories(user.id),
          Wallet.create({
            userId: user.id,
            name: 'Ví chính',
            isDefault: true,
            icon: '💼',
            color: '#3B82F6',
            balance: 0,
            initialBalance: 0
          })
        ]);
      } catch (err) {
        console.error('Failed to create default categories or wallet:', err);
      }

      sendWelcomeEmail(user.email, user.name).catch(err => 
        console.error('Failed to send welcome email:', err)
      );
    } else {
      user.googleId = googleId;
      await user.save();
    }
  }

  if (user.isBanned) {
    throw new ErrorResponse('Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.', 403);
  }

  const token = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  user.refreshToken = refreshToken;

  const tzOffset = new Date().getTimezoneOffset() * 60000;
  const today = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
  if (user.lastLoginDate !== today) {
    user.lastLoginDate = today;
  }
  await user.save({ validateBeforeSave: false });

  return {
    token,
    refreshToken,
    user: formatUserResponse(user)
  };
};
