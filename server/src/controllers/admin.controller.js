import { User, Transaction, ContactMessage } from '../models/sequelize/index.js';
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

    return res.json({
      success: true,
      data: {
        counts: {
          users: userCount,
          transactions: transactionCount,
          contacts: contactCount,
          admins: adminCount,
        },
        contactSummary,
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