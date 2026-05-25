import { Transaction, Notification, Budget, sequelize } from '../models/sequelize/index.js';
import { searchDocuments } from '../services/meilisearch.service.js';
import { Op } from 'sequelize';

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
    // Tìm các budget liên quan (Budget stores `categoryName`)
    const budgets = await Budget.findAll({ where: { userId, isActive: true, [Op.or]: [{ categoryName: category }, { categoryName: null }] }, raw: true });

    for (const budget of budgets) {
      const dateRange = getDateRange(budget.period);
      
      // Tính tổng chi tiêu
      const where = { userId, type: 'expense', date: { [Op.between]: [dateRange.start, dateRange.end] } };
      if (budget.categoryName) where.category = budget.categoryName;
      const rows = await Transaction.findAll({ where, attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']], raw: true });
      const currentSpending = rows && rows.length > 0 ? parseFloat(rows[0].total) || 0 : 0;
      const percentage = (currentSpending / budget.amount) * 100;

      // Tạo thông báo nếu vượt ngưỡng 80% hoặc 100%
      if (percentage >= 100) {
        // Kiểm tra xem đã có thông báo vượt ngân sách trong 24h chưa
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentNotif = await Notification.findOne({ where: { userId, type: 'error', relatedModel: 'Budget', createdAt: { [Op.gte]: cutoff } }, order: [['createdAt','DESC']] });
        let existsForBudget = false;
        if (recentNotif) {
          try { const meta = recentNotif.metadata || (recentNotif.get && recentNotif.get('metadata')); const bId = meta && meta.budgetId; if (bId && (bId === (budget.id || budget._id).toString())) existsForBudget = true; } catch(e){}
        }
        if (!existsForBudget) {
          await Notification.create({ userId, type: 'error', title: '🚨 Vượt ngân sách!', message: `${budget.categoryName || 'Tổng ngân sách'}: Đã vượt ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`, relatedId: budget.id || budget._id, relatedModel: 'Budget', read: false, metadata: { budgetId: (budget.id || budget._id).toString(), category: budget.categoryName, percentage: percentage.toFixed(0), currentSpending, budgetAmount: budget.amount } });
        }
      } else if (percentage >= 80) {
        // Kiểm tra xem đã có thông báo cảnh báo trong 24h chưa
        const cutoffW = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentWarn = await Notification.findOne({ where: { userId, type: 'warning', relatedModel: 'Budget', createdAt: { [Op.gte]: cutoffW } }, order: [['createdAt','DESC']] });
        let existsWarn = false;
        if (recentWarn) { try { const meta = recentWarn.metadata || (recentWarn.get && recentWarn.get('metadata')); const bId = meta && meta.budgetId; if (bId && (bId === (budget.id || budget._id).toString())) existsWarn = true; } catch(e){} }
        if (!existsWarn) {
          await Notification.create({ userId, type: 'warning', title: '⚠️ Cảnh báo ngân sách', message: `${budget.categoryName || 'Tổng ngân sách'}: Đã sử dụng ${percentage.toFixed(0)}% (${currentSpending.toLocaleString('vi-VN')}/${budget.amount.toLocaleString('vi-VN')} ₫)`, relatedId: budget.id || budget._id, relatedModel: 'Budget', read: false, metadata: { budgetId: (budget.id || budget._id).toString(), category: budget.categoryName, percentage: percentage.toFixed(0), currentSpending, budgetAmount: budget.amount } });
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
    const {
      type, category, startDate, endDate,
      search, amountMin, amountMax,
      page = 1, limit = 10,
      sortBy = 'date', sortOrder = 'desc'
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = parseInt(limit) === -1 ? 0 : Math.min(parseInt(limit) || 10, 500);
    const skip     = (pageNum - 1) * limitNum;

    if (search) {
      // Use MeiliSearch for text search
      const filtersArray = [`userId = ${req.user.id}`];
      if (type) filtersArray.push(`type = "${type}"`);
      if (category) filtersArray.push(`category = "${category}"`);
      if (amountMin) filtersArray.push(`amount >= ${parseFloat(amountMin)}`);
      if (amountMax) filtersArray.push(`amount <= ${parseFloat(amountMax)}`);

      const msRes = await searchDocuments('transactions', search, {
        filter: filtersArray,
        offset: skip,
        limit: limitNum || 500,
        sort: [`${sortBy}:${sortOrder}`]
      });

      return res.json({
        success: true,
        count: msRes.hits.length,
        total: msRes.estimatedTotalHits || msRes.totalHits || msRes.hits.length,
        page: pageNum,
        totalPages: limitNum > 0 ? Math.ceil((msRes.estimatedTotalHits || msRes.totalHits || msRes.hits.length) / limitNum) : 1,
        data: msRes.hits
      });
    }

    // Tiêu chuẩn không search text
    // Build Sequelize where
    const where = { userId: req.user.id };
    if (type) where.type = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    if (amountMin || amountMax) {
      where.amount = {};
      if (amountMin) where.amount[Op.gte] = parseFloat(amountMin);
      if (amountMax) where.amount[Op.lte] = parseFloat(amountMax);
    }

    const order    = [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']];

    const [transactions, total] = await Promise.all([
      Transaction.findAll({ where, order, offset: limitNum > 0 ? skip : undefined, limit: limitNum || undefined }),
      Transaction.count({ where }),
    ]);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      totalPages: limitNum > 0 ? Math.ceil(total / limitNum) : 1,
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
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    // Check ownership
    if (transaction.userId !== req.user.id) {
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
    // Validate amount
    const numAmount = Number(amount);
    if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Số tiền không hợp lệ' });
    }

    const transaction = await Transaction.create({ userId: req.user.id, type, category, amount: numAmount, note, date: date || Date.now() });

    // Tạo thông báo chi tiết cho giao dịch mới
    const transactionDate = new Date();
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

    await Notification.create({ userId: req.user.id, type: notificationType, title: notificationTitle, message: notificationMessage, relatedId: transaction.id || transaction._id, relatedModel: 'Transaction', read: false, metadata: { transactionType: type, category, amount, date: transaction.date, isLargeTransaction } });

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
    let transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }

    // Check ownership
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }
    await Transaction.update(req.body, { where: { id: req.params.id } });
    transaction = await Transaction.findByPk(req.params.id);

    // Tạo thông báo cho việc cập nhật giao dịch
    const transactionDate = new Date();
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

    await Notification.create({ userId: req.user.id, type: 'transaction', title: '✏️ Cập nhật giao dịch', message: notificationMessage, relatedId: transaction.id || transaction._id, relatedModel: 'Transaction', read: false, metadata: { transactionType: transaction.type, category: transaction.category, amount: transaction.amount, date: transaction.date } });

    // Nếu là giao dịch chi tiêu và có thay đổi số tiền/danh mục, kiểm tra ngân sách
    if (transaction.type === 'expense') await checkBudgetAndNotify(req.user.id, transaction.category, transaction.date);

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
    const transaction = await Transaction.findByPk(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      });
    }
    // Check ownership
    if (transaction.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    // Tạo thông báo trước khi xóa
    const transactionDate = new Date();
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

    await Notification.create({ userId: req.user.id, type: 'transaction', title: '🗑️ Xóa giao dịch', message: notificationMessage, relatedId: null, relatedModel: null, read: false, metadata: { transactionType: transaction.type, category: transaction.category, amount: transaction.amount, date: transaction.date, deleted: true } });
    await Transaction.destroy({ where: { id: req.params.id } });

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
