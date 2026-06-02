import jwt from 'jsonwebtoken';
import { User } from '../models/sequelize/index.js';

export const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query.token) {
    // Fallback: token trong query string (dùng cho SSE vì EventSource không support custom header)
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập. Vui lòng đăng nhập'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token (exclude password)
    req.user = await User.findByPk(decoded.id, { attributes: { exclude: ['password'] } });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại'
      });
    }

    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.'
      });
    }

    next();
  } catch (error) {
    if (error.name !== 'TokenExpiredError' && error.name !== 'JsonWebTokenError') {
      console.error('Auth middleware error:', error.message);
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này'
      });
    }

    next();
  };
};
