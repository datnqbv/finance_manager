import Budget from '../models/Budget.model.js';
import Goal from '../models/Goal.model.js';
import Transaction from '../models/Transaction.model.js';
import Notification from '../models/Notification.model.js';

// Helper function to calculate spending for a budget
const calculateBudgetSpending = async (userId, categoryName, dateRange) => {
  const query = {
    userId,
    type: 'expense',
    date: { $gte: dateRange.start, $lte: dateRange.end }
  };

  if (categoryName) {
    query.category = categoryName;
  }

  const result = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Helper function to get date range
const getDateRange = (period, startDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(startDate);

  switch (period) {
    case 'weekly':
      start.setDate(start.getDate() - start.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case 'monthly':
      start.setDate(1);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      break;
    case 'yearly':
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};


// Hàm định dạng thời gian đã trôi qua
const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes} phút trước`;
  } else if (hours < 24) {
    return `${hours} giờ trước`;
  } else {
    return `${days} ngày trước`;
  }
};

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
// Lấy thông báo cho người dùng
export const getNotifications = async (req, res) => {
  try {
    const { limit = 20, skip = 0, read } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Lấy thông báo từ database
    const dbNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Format thông báo
    const formattedNotifications = dbNotifications.map(notif => {
      const timeAgo = getTimeAgo(notif.createdAt);
      return {
        id: notif._id.toString(),
        type: notif.type,
        title: notif.title,
        message: notif.message,
        time: timeAgo,
        read: notif.read,
        createdAt: notif.createdAt,
        relatedId: notif.relatedId,
        relatedModel: notif.relatedModel,
        metadata: notif.metadata
      };
    });

    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });

    // Tạo thêm các thông báo tự động từ goals - không bao gồm budget vì đã tạo trong transaction
    const autoNotifications = [];
    const notificationIds = new Set();

    // 1. Kiểm tra các mục tiêu
    const goals = await Goal.find({ userId: req.user.id });

    for (const goal of goals) {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;

      if (percentage >= 100 && goal.status !== 'completed') {
        const notifId = `goal-completed-${goal._id}`;
        if (!notificationIds.has(notifId)) {
          notificationIds.add(notifId);
          autoNotifications.push({
            id: notifId,
            type: 'success',
            title: 'Hoàn thành mục tiêu',
            message: `Chúc mừng! Bạn đã đạt được mục tiêu "${goal.name}"`,
            time: getTimeAgo(goal.updatedAt),
            read: false,
            createdAt: goal.updatedAt
          });
        }
      } else if (percentage >= 80 && percentage < 100) {
        const notifId = `goal-progress-${goal._id}`;
        if (!notificationIds.has(notifId)) {
          notificationIds.add(notifId);
          autoNotifications.push({
            id: notifId,
            type: 'info',
            title: 'Gần đạt mục tiêu',
            message: `Mục tiêu "${goal.name}": ${percentage.toFixed(0)}% (${goal.currentAmount.toLocaleString('vi-VN')}/${goal.targetAmount.toLocaleString('vi-VN')} ₫)`,
            time: getTimeAgo(goal.updatedAt),
            read: false,
            createdAt: goal.updatedAt
          });
        }
      }
    }

    // Kết hợp notifications từ DB và auto notifications
    const allNotifications = [...formattedNotifications, ...autoNotifications];
    
    // Sắp xếp theo thời gian
    allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: {
        notifications: allNotifications,
        unreadCount: unreadCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    // Check ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    notification.read = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'Đã đánh dấu tất cả đã đọc'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông báo'
      });
    }

    // Check ownership
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    await notification.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa thông báo'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete all notifications
// @route   DELETE /api/notifications/all
// @access  Private
export const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });

    res.json({
      success: true,
      message: 'Đã xóa tất cả thông báo'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
