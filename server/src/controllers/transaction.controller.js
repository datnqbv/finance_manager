import Transaction from '../models/Transaction.model.js';
import Notification from '../models/Notification.model.js';
import Budget from '../models/Budget.model.js';

// Helper function to get date range based on period
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

// Helper function to check budget and create notification if needed
const checkBudgetAndNotify = async (userId, category, transactionDate) => {
  try {
    // Tìm các budget liên quan
    const budgets = await Budget.find({
      userId,
      isActive: true,
      $or: [
        { category: category },
        { category: null } // Tổng ngân sách
      ]
    });

    for (const budget of budgets) {
      const dateRange = getDateRange(budget.period);
      
      // Tính tổng chi tiêu
      const query = {
        userId,
        type: 'expense',
        date: { $gte: dateRange.start, $lte: dateRange.end }
      };
      
      if (budget.category) {
        query.category = budget.category;
      }

      const result = await Transaction.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const currentSpending = result.length > 0 ? result[0].total : 0;
      const percentage = (currentSpending / budget.amount) * 100;

      // Tạo thông báo nếu vượt ngưỡng 80% hoặc 100%
      if (percentage >= 100) {
        // Kiểm tra xem đã có thông báo vượt ngân sách trong 24h chưa
        const recentNotif = await Notification.findOne({
          userId,
          type: 'error',
          'metadata.budgetId': budget._id.toString(),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!recentNotif) {
          await Notification.create({
            userId,
            type: 'error',
            title: '🚨 Vượt ngân sách!',
            message: `${budget.category || 'Tổng ngân sách'}: Đã vượt ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`,
            relatedId: budget._id,
            relatedModel: 'Budget',
            read: false,
            metadata: {
              budgetId: budget._id.toString(),
              category: budget.category,
              percentage: percentage.toFixed(0),
              currentSpending,
              budgetAmount: budget.amount
            }
          });
        }
      } else if (percentage >= 80) {
        // Kiểm tra xem đã có thông báo cảnh báo trong 24h chưa
        const recentNotif = await Notification.findOne({
          userId,
          type: 'warning',
          'metadata.budgetId': budget._id.toString(),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (!recentNotif) {
          await Notification.create({
            userId,
            type: 'warning',
            title: '⚠️ Cảnh báo ngân sách',
            message: `${budget.category || 'Tổng ngân sách'}: Đã sử dụng ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`,
            relatedId: budget._id,
            relatedModel: 'Budget',
            read: false,
            metadata: {
              budgetId: budget._id.toString(),
              category: budget.category,
              percentage: percentage.toFixed(0),
              currentSpending,
              budgetAmount: budget.amount
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget:', error);
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 50 } = req.query;

    // Build query
    const query = { userId: req.user.id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { type, category, amount, note, date } = req.body;

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      note,
      date: date || Date.now()
    });

    // Tạo thông báo chi tiết cho giao dịch mới
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Kiểm tra xem có phải giao dịch lớn không (>= 1 triệu)
    const isLargeTransaction = amount >= 1000000;
    
    const typeText = type === 'income' ? 'thu nhập' : 'chi tiêu';
    let notificationTitle, notificationType;
    
    if (isLargeTransaction) {
      // Thông báo đặc biệt cho giao dịch lớn
      notificationTitle = type === 'income' ? '💰 Thu nhập lớn!' : '🚨 Chi tiêu lớn!';
      notificationType = type === 'income' ? 'success' : 'warning';
    } else {
      // Thông báo thường
      notificationTitle = type === 'income' ? '💰 Giao dịch thu nhập' : '💸 Giao dịch chi tiêu';
      notificationType = 'transaction';
    }
    
    const notificationMessage = `Vào lúc ${formattedTime} ngày ${formattedDate}, bạn đã ${typeText} ${amount.toLocaleString('vi-VN')} ₫ cho "${category}"${note ? ` - ${note}` : ''}`;

    await Notification.create({
      userId: req.user.id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedId: transaction._id,
      relatedModel: 'Transaction',
      read: false,
      metadata: {
        transactionType: type,
        category,
        amount,
        date: transaction.date,
        isLargeTransaction
      }
    });

    // Nếu là giao dịch chi tiêu, kiểm tra ngân sách
    if (type === 'expense') {
      await checkBudgetAndNotify(req.user.id, category, transaction.date);
    }

    res.status(201).json({
      success: true,
      message: 'Tạo giao dịch thành công',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Tạo thông báo cho việc cập nhật giao dịch
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeText = transaction.type === 'income' ? 'thu nhập' : 'chi tiêu';
    const notificationMessage = `Đã cập nhật giao dịch ${typeText} vào lúc ${formattedTime} ngày ${formattedDate}: ${transaction.amount.toLocaleString('vi-VN')} ₫ cho "${transaction.category}"`;

    await Notification.create({
      userId: req.user.id,
      type: 'transaction',
      title: '✏️ Cập nhật giao dịch',
      message: notificationMessage,
      relatedId: transaction._id,
      relatedModel: 'Transaction',
      read: false,
      metadata: {
        transactionType: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date
      }
    });

    // Nếu là giao dịch chi tiêu và có thay đổi số tiền/danh mục, kiểm tra ngân sách
    if (transaction.type === 'expense') {
      await checkBudgetAndNotify(req.user.id, transaction.category, transaction.date);
    }

    res.json({
      success: true,
      message: 'Cập nhật thành công',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Tạo thông báo trước khi xóa
    const transactionDate = new Date(transaction.date);
    const formattedDate = transactionDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const formattedTime = transactionDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeText = transaction.type === 'income' ? 'thu nhập' : 'chi tiêu';
    const notificationMessage = `Đã xóa giao dịch ${typeText} vào lúc ${formattedTime} ngày ${formattedDate}: ${transaction.amount.toLocaleString('vi-VN')} ₫ cho "${transaction.category}"`;

    await Notification.create({
      userId: req.user.id,
      type: 'transaction',
      title: '🗑️ Xóa giao dịch',
      message: notificationMessage,
      relatedId: null,
      relatedModel: null,
      read: false,
      metadata: {
        transactionType: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date,
        deleted: true
      }
    });

    await transaction.deleteOne();

    res.json({
      success: true,
      message: 'Xóa giao dịch thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
