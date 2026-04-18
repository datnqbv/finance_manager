import User from '../models/User.model.js';
import Transaction from '../models/Transaction.model.js';
import ContactMessage from '../models/ContactMessage.model.js';

const sanitizeUser = (user) => ({
  id: user._id,
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
      User.countDocuments(),
      Transaction.countDocuments(),
      ContactMessage.countDocuments(),
      ContactMessage.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
    ]);

    const contactSummary = { new: 0, read: 0, replied: 0 };
    contactByStatus.forEach((item) => {
      if (contactSummary[item._id] !== undefined) {
        contactSummary[item._id] = item.count;
      }
    });

    const adminCount = await User.countDocuments({ role: 'admin' });

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

    const query = {};
    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    if (search?.trim()) {
      const pattern = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: pattern },
        { email: pattern }
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'role'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [items, total, roleStats] = await Promise.all([
      User.find(query)
        .select('-password -refreshToken -resetPasswordToken -resetPasswordExpire')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    const summary = { user: 0, admin: 0 };
    roleStats.forEach((item) => {
      if (summary[item._id] !== undefined) {
        summary[item._id] = item.count;
      }
    });

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

    const user = await User.findById(id);
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
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    await User.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Xóa người dùng thành công' });
  } catch (error) {
    console.error('❌ deleteUser error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};