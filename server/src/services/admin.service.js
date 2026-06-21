import { User, Transaction, ContactMessage, VipOrder, UserVisit } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import { getSearchCondition } from '../utils/fts.js';
import ErrorResponse from '../utils/errorResponse.js';

export const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  budget: user.budget,
  currency: user.currency,
  avatar: user.avatar,
  googleId: user.googleId,
  isVip: user.isVip,
  vipExpire: user.vipExpire,
  isBanned: user.isBanned,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const getAdminDashboardStats = async () => {
  const [userCount, transactionCount, contactCount, contactByStatus] = await Promise.all([
    User.count(),
    Transaction.count(),
    ContactMessage.count(),
    ContactMessage.findAll({ attributes: ['status', [ContactMessage.sequelize.fn('COUNT', ContactMessage.sequelize.col('status')), 'count']], group: ['status'], raw: true }),
  ]);

  const contactSummary = { new: 0, read: 0, replied: 0 };
  contactByStatus.forEach((item) => {
    if (contactSummary[item.status] !== undefined) {
      contactSummary[item.status] = parseInt(item.count, 10);
    }
  });

  const adminCount = await User.count({ where: { role: 'admin' } });

  // ── ADVANCED ADMIN ANALYTICS ──────────────────────────────────────────────
  // 1. VIP Revenue (completed VipOrders sum)
  const vipRevenue = await VipOrder.sum('amount', { where: { status: 'completed' } }) || 0;

  // 2. Active VIP subscribers count
  const activeVips = await User.count({
    where: {
      isVip: true,
      [Op.or]: [
        { vipExpire: { [Op.gt]: new Date() } },
        { vipExpire: null } // Lifetime VIP
      ]
    }
  });

  // 3. Monthly revenue statistics for Recharts (past 6 months)
  const past6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    past6Months.push({ year, month, label: `${month}/${year}`, amount: 0 });
  }

  const completedOrders = await VipOrder.findAll({
    where: {
      status: 'completed',
      createdAt: {
        [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 5))
      }
    },
    raw: true
  });

  completedOrders.forEach(order => {
    const oDate = new Date(order.createdAt);
    const oYear = oDate.getFullYear();
    const oMonth = oDate.getMonth() + 1;
    const match = past6Months.find(m => m.year === oYear && m.month === oMonth);
    if (match) {
      match.amount += parseFloat(order.amount) || 0;
    }
  });

  // 4. Recent VIP registration logs (last 5)
  const recentVipOrders = await VipOrder.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    include: [{ model: User, as: 'user', attributes: ['name', 'email'] }]
  });

  return {
    counts: {
      users: userCount,
      transactions: transactionCount,
      contacts: contactCount,
      admins: adminCount,
      vipRevenue,
      activeVips,
    },
    contactSummary,
    past6Months,
    recentVipOrders
  };
};

export const getAdminUsersList = async (queryOptions) => {
  const {
    search,
    role,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = queryOptions;

  const where = {};
  if (role && ['user', 'admin'].includes(role)) where.role = role;
  if (search?.trim()) {
    where[Op.and] = [getSearchCondition(['name', 'email'], search.trim(), true)];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNum - 1) * limitNum;
  const orderArr = [[sortBy, order === 'asc' ? 'ASC' : 'DESC']];

  const [result, roleStats] = await Promise.all([
    User.findAndCountAll({ where, attributes: { exclude: ['password','refreshToken','resetPasswordToken','resetPasswordExpire'] }, limit: limitNum, offset, order: orderArr }),
    User.findAll({ attributes: ['role', [User.sequelize.fn('COUNT', User.sequelize.col('role')), 'count']], group: ['role'], raw: true }),
  ]);

  const items = result.rows;
  const total = result.count;

  const summary = { user: 0, admin: 0 };
  roleStats.forEach((item) => { if (summary[item.role] !== undefined) summary[item.role] = parseInt(item.count, 10); });

  return {
    items: items.map(sanitizeUser),
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1)
    },
    summary,
  };
};

export const updateUserRoleService = async (targetUserId, newRole) => {
  if (!['user', 'admin'].includes(newRole)) {
    throw new ErrorResponse('Vai trò không hợp lệ', 400);
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng', 404);
  }

  user.role = newRole;
  await user.save({ validateBeforeSave: false });

  return sanitizeUser(user);
};

export const deleteUserService = async (targetUserId) => {
  const user = await User.findByPk(targetUserId);

  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng', 404);
  }

  await User.destroy({ where: { id: targetUserId } });
  return true;
};

export const updateUserVipService = async (targetUserId, isVip, vipExpire) => {
  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng', 404);
  }

  user.isVip = !!isVip;
  user.vipExpire = vipExpire ? new Date(vipExpire) : null;
  await user.save({ validateBeforeSave: false });

  return sanitizeUser(user);
};

export const toggleUserBanService = async (adminId, targetUserId, isBanned) => {
  if (targetUserId === adminId) {
    throw new ErrorResponse('Bạn không thể tự khóa tài khoản của mình', 400);
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng', 404);
  }

  user.isBanned = !!isBanned;
  await user.save({ validateBeforeSave: false });

  return sanitizeUser(user);
};

export const resetUserPasswordService = async (targetUserId, newPassword) => {
  if (!newPassword || newPassword.trim().length < 6) {
    throw new ErrorResponse('Mật khẩu mới phải từ 6 ký tự trở lên', 400);
  }

  const user = await User.findByPk(targetUserId);
  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng', 404);
  }

  user.password = newPassword;
  await user.save(); // User.beforeSave will hash this automatically

  return true;
};

export const recordUserVisitService = async (userId, ipAddress, userAgent) => {
  // Check if the user has a visit record in the last 5 minutes to prevent spam
  const lastVisit = await UserVisit.findOne({
    where: { userId },
    order: [['visitedAt', 'DESC']]
  });
  
  if (!lastVisit || (new Date() - new Date(lastVisit.visitedAt)) > 5 * 60 * 1000) {
    await UserVisit.create({
      userId,
      ipAddress,
      userAgent
    });
  }
  
  return true;
};

export const getVisitsListService = async (queryOptions) => {
  const { page = 1, limit = 20, search, startDate, endDate } = queryOptions;
  
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNum - 1) * limitNum;
  
  const where = {};
  
  if (startDate || endDate) {
    where.visitedAt = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.visitedAt[Op.gte] = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.visitedAt[Op.lte] = end;
    }
  }
  
  if (search?.trim()) {
    where[Op.and] = [getSearchCondition(['userAgent', '$user.name$', '$user.email$'], search.trim(), true)];
  }
  
  const { count, rows } = await UserVisit.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [['visitedAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }
    ]
  });
  
  return {
    items: rows,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(Math.ceil(count / limitNum), 1)
    }
  };
};
