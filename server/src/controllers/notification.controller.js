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
    const notificationIds = new Set(); // Tránh trùng lặp

    // 1. Check budgets that are over 80% spent
    const budgets = await Budget.find({ userId: req.user.id, isActive: true });
    
    for (const budget of budgets) {
      const dateRange = getDateRange(budget.period);
      const currentSpending = await calculateBudgetSpending(
        req.user.id,
        budget.category,
        dateRange
      );

      const percentage = (currentSpending / budget.amount) * 100;

      // Lấy giao dịch gần nhất để có thời điểm chính xác
      const latestTransaction = await Transaction.findOne({
        userId: req.user.id,
        type: 'expense',
        category: budget.category || { $exists: true },
        date: { $gte: dateRange.start, $lte: dateRange.end }
      }).sort({ date: -1 });

      const notificationTime = latestTransaction ? latestTransaction.date : budget.updatedAt;

      if (percentage >= 80) {
        const notifId = `budget-${budget._id}`;
        if (!notificationIds.has(notifId)) {
          notificationIds.add(notifId);
          notifications.push({
            id: notifId,
            type: percentage >= 100 ? 'error' : 'warning',
            title: percentage >= 100 ? 'Vượt ngân sách' : 'Cảnh báo ngân sách',
            message: `${budget.category || 'Tổng ngân sách'}: ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`,
            time: getTimeAgo(notificationTime),
            read: false,
            createdAt: notificationTime
          });
        }
      }
    }

    
    // 2. Kiểm tra các mục tiêu đã hoàn thành hoặc gần hoàn thành
    const goals = await Goal.find({ userId: req.user.id });

    for (const goal of goals) {
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;

      if (percentage >= 100 && goal.status !== 'completed') {
        const notifId = `goal-completed-${goal._id}`;
        if (!notificationIds.has(notifId)) {
          notificationIds.add(notifId);
          notifications.push({
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
          notifications.push({
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

    // 3. Kiểm tra các giao dịch định kỳ đến hạn hôm nay hoặc quá hạn
    const recurringTransactions = await RecurringTransaction.find({
      userId: req.user.id,
      isActive: true
    });

    for (const recurring of recurringTransactions) {
      const nextDate = new Date(recurring.nextDate);
      const daysUntilDue = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));

      if (daysUntilDue <= 0) {
        const notifId = `recurring-overdue-${recurring._id}`;
        if (!notificationIds.has(notifId)) {
          notificationIds.add(notifId);
          notifications.push({
            id: notifId,
            type: 'warning',
            title: 'Giao dịch định kỳ quá hạn',
            message: `"${recurring.templateName || recurring.description}" đã quá hạn ${Math.abs(daysUntilDue)} ngày`,
            time: getTimeAgo(recurring.nextDate),
            read: false,
            createdAt: recurring.nextDate
          });
        }
      } else if (daysUntilDue <= 3) {
        const notifId = `recurring-upcoming-${recurring._id}`;
        if (!notificationIds.has(notifId)) {
          notificationIds.add(notifId);
          notifications.push({
            id: notifId,
            type: 'info',
            title: 'Giao dịch định kỳ sắp đến',
            message: `"${recurring.templateName || recurring.description}" sẽ được thực hiện trong ${daysUntilDue} ngày nữa`,
            time: getTimeAgo(recurring.updatedAt),
            read: false,
            createdAt: recurring.updatedAt
          });
        }
      }
    }

    // 4. Kiểm tra các giao dịch chi tiêu lớn (>= 1 triệu trong 7 ngày gần đây)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const largeTransactions = await Transaction.find({
      userId: req.user.id,
      type: 'expense',
      amount: { $gte: 1000000 },
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 }).limit(3);

    for (const transaction of largeTransactions) {
      const notifId = `large-expense-${transaction._id}`;
      if (!notificationIds.has(notifId)) {
        notificationIds.add(notifId);
        notifications.push({
          id: notifId,
          type: 'info',
          title: 'Chi tiêu lớn',
          message: `Bạn đã chi ${transaction.amount.toLocaleString('vi-VN')} ₫ cho "${transaction.category}" - ${transaction.note || 'Không có ghi chú'}`,
          time: getTimeAgo(transaction.date),
          read: false,
          createdAt: transaction.date
        });
      }
    }

    // 5. Kiểm tra các giao dịch thu nhập lớn (>= 1 triệu trong 7 ngày gần đây)
    const largeIncomes = await Transaction.find({
      userId: req.user.id,
      type: 'income',
      amount: { $gte: 1000000 },
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 }).limit(3);

    for (const transaction of largeIncomes) {
      const notifId = `large-income-${transaction._id}`;
      if (!notificationIds.has(notifId)) {
        notificationIds.add(notifId);
        notifications.push({
          id: notifId,
          type: 'success',
          title: 'Thu nhập lớn',
          message: `Bạn đã thu ${transaction.amount.toLocaleString('vi-VN')} ₫ từ "${transaction.category}" - ${transaction.note || 'Không có ghi chú'}`,
          time: getTimeAgo(transaction.date),
          read: false,
          createdAt: transaction.date
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
