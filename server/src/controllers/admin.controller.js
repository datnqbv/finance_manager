import { User, Transaction, ContactMessage, VipOrder, UserVisit } from '../models/sequelize/index.js';
import { Op } from 'sequelize';

const sanitizeUser = (user) => ({
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

export const getAdminDashboard = async (_req, res) => {
  try {
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

    return res.json({
      success: true,
      data: {
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
      }
    });
  } catch (error) {
    console.error('❌ getAdminDashboard error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const getAdminUsers = async (req, res) => {
  try {
    const {
      search,
      role,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const where = {};
    if (role && ['user', 'admin'].includes(role)) where.role = role;
    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [ { name: { [Op.like]: term } }, { email: { [Op.like]: term } } ];
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

    return res.json({
      success: true,
      data: {
        items: items.map(sanitizeUser),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(Math.ceil(total / limitNum), 1)
        },
        summary,
      }
    });
  } catch (error) {
    console.error('❌ getAdminUsers error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: 'Cập nhật vai trò thành công',
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ updateUserRole error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    await User.destroy({ where: { id } });

    return res.json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('❌ deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const updateUserVip = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVip, vipExpire } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.isVip = !!isVip;
    user.vipExpire = vipExpire ? new Date(vipExpire) : null;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: 'Cập nhật trạng thái VIP thành công',
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ updateUserVip error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật VIP' });
  }
};

export const toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự khóa tài khoản của mình' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.isBanned = !!isBanned;
    await user.save({ validateBeforeSave: false });

    return res.json({
      success: true,
      message: user.isBanned ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản thành công',
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('❌ toggleUserBan error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi khóa/mở khóa tài khoản' });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    user.password = password;
    await user.save(); // User.beforeSave will hash this automatically

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });
  } catch (error) {
    console.error('❌ resetUserPassword error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đặt lại mật khẩu' });
  }
};

export const recordVisit = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if the user has a visit record in the last 5 minutes to prevent spam
    const lastVisit = await UserVisit.findOne({
      where: { userId },
      order: [['visitedAt', 'DESC']]
    });
    
    if (!lastVisit || (new Date() - new Date(lastVisit.visitedAt)) > 5 * 60 * 1000) {
      await UserVisit.create({
        userId,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    }
    
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ recordVisit error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi ghi nhận lịch sử truy cập' });
  }
};

export const getVisitsList = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * limitNum;
    
    const { count, rows } = await UserVisit.findAndCountAll({
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
    
    return res.json({
      success: true,
      data: {
        items: rows,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(Math.ceil(count / limitNum), 1)
        }
      }
    });
  } catch (error) {
    console.error('❌ getVisitsList error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy lịch sử truy cập' });
  }
};