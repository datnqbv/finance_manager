import { Op } from 'sequelize';
import { Wallet, Budget, Transaction } from '../models/sequelize/index.js';

// Helper to determine if a user has active VIP status
export const isUserVip = (user) => {
  if (!user.isVip) return false;
  if (user.vipExpire && new Date(user.vipExpire) < new Date()) {
    return false;
  }
  return true;
};

export const checkWalletLimit = async (req, res, next) => {
  try {
    if (isUserVip(req.user)) {
      return next();
    }

    const count = await Wallet.count({ where: { userId: req.user.id } });
    if (count >= 3) {
      return res.status(403).json({
        success: false,
        message: 'Bạn đã đạt giới hạn tối đa 3 ví cho tài khoản thường. Vui lòng nâng cấp lên VIP để thêm ví không giới hạn!'
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkWalletLimit middleware:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra giới hạn ví' });
  }
};

export const checkBudgetLimit = async (req, res, next) => {
  try {
    if (isUserVip(req.user)) {
      return next();
    }

    const count = await Budget.count({ where: { userId: req.user.id } });
    if (count >= 5) {
      return res.status(403).json({
        success: false,
        message: 'Bạn đã đạt giới hạn tối đa 5 ngân sách cho tài khoản thường. Vui lòng nâng cấp lên VIP để quản lý nhiều ngân sách hơn!'
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkBudgetLimit middleware:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra giới hạn ngân sách' });
  }
};

export const checkTransactionLimit = async (req, res, next) => {
  try {
    if (isUserVip(req.user)) {
      return next();
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const count = await Transaction.count({
      where: {
        userId: req.user.id,
        date: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });

    if (count >= 30) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản thường chỉ được tạo tối đa 30 giao dịch mỗi tháng. Vui lòng nâng cấp lên VIP để ghi chép giao dịch không giới hạn!'
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkTransactionLimit middleware:', error);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi kiểm tra giới hạn giao dịch' });
  }
};
