import Budget from '../models/Budget.model.js';
import Goal from '../models/Goal.model.js';
import RecurringTransaction from '../models/RecurringTransaction.model.js';
import Transaction from '../models/Transaction.model.js';

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
    const notifications = [];
    const now = new Date();

    // 1. Check budgets that are over 80% spent
    const budgets = await Budget.find({ userId: req.user.id });
    
    for (const budget of budgets) {
      const dateRange = getDateRange(budget.period);
      const currentSpending = await calculateBudgetSpending(
        req.user.id,
        budget.category,
        dateRange
      );

      const percentage = (currentSpending / budget.amount) * 100;

      if (percentage >= 80) {
        notifications.push({
          id: `budget-${budget._id}`,
          type: percentage >= 100 ? 'error' : 'warning',
          title: percentage >= 100 ? 'Vượt ngân sách' : 'Cảnh báo ngân sách',
          message: `${budget.category || 'Tổng'}: ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`,
          time: getTimeAgo(budget.updatedAt),
          read: false,
          createdAt: budget.updatedAt
        });
      }
    }

    
    // kiểm tra các mục tiêu đã hoàn thành hoặc gần hoàn thành
    const goals = await Goal.find({ userId: req.user.id });

    for (const goal of goals) {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;

      if (percentage >= 100 && goal.status !== 'completed') {
        notifications.push({
          id: `goal-${goal._id}`,
          type: 'success',
          title: 'Hoàn thành mục tiêu',
          message: `Chúc mừng! Bạn đã đạt được mục tiêu "${goal.name}"`,
          time: getTimeAgo(goal.updatedAt),
          read: false,
          createdAt: goal.updatedAt
        });
      } else if (percentage >= 80 && percentage < 100) {
        notifications.push({
          id: `goal-progress-${goal._id}`,
          type: 'info',
          title: 'Gần đạt mục tiêu',
          message: `Mục tiêu "${goal.name}": ${percentage.toFixed(0)}% (${goal.currentAmount.toLocaleString('vi-VN')}/${goal.targetAmount.toLocaleString('vi-VN')} ₫)`,
          time: getTimeAgo(goal.updatedAt),
          read: false,
          createdAt: goal.updatedAt
        });
      }
    }

    // kiếm tra các giao dịch định kỳ đến hạn hôm nay hoặc quá hạn
    const recurringTransactions = await RecurringTransaction.find({
      userId: req.user.id,
      isActive: true
    });

    for (const recurring of recurringTransactions) {
      const nextDate = new Date(recurring.nextDate);
      const daysUntilDue = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 0) {
        notifications.push({
          id: `recurring-overdue-${recurring._id}`,
          type: 'warning',
          title: 'Giao dịch định kỳ quá hạn',
          message: `"${recurring.description}" đã quá hạn ${Math.abs(daysUntilDue)} ngày`,
          time: getTimeAgo(recurring.nextDate),
          read: false,
          createdAt: recurring.nextDate
        });
      } else if (daysUntilDue <= 3) {
        notifications.push({
          id: `recurring-${recurring._id}`,
          type: 'info',
          title: 'Giao dịch định kỳ sắp đến',
          message: `"${recurring.description}" sẽ được thực hiện trong ${daysUntilDue} ngày nữa`,
          time: getTimeAgo(recurring.updatedAt),
          read: false,
          createdAt: recurring.updatedAt
        });
      }
    }

     // sắp xếp theo ngày tạo (mới nhất trước)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Giới hạn chỉ lấy 10 thông báo gần nhất
    const limitedNotifications = notifications.slice(0, 10).map(n => {
      const { createdAt, ...rest } = n;
      return rest;
    });

    res.json({
      success: true,
      data: {
        notifications: limitedNotifications,
        unreadCount: limitedNotifications.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
