import Budget from '../models/Budget.model.js';
import Transaction from '../models/Transaction.model.js';
import Category from '../models/Category.model.js';

// Helper function to get date range based on period
const getDateRange = (period, startDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(startDate);

  switch (period) {
    case 'weekly':
      start.setDate(start.getDate() - start.getDay()); // Start of week
      end.setDate(start.getDate() + 6); // End of week
      break;
    case 'monthly':
      start.setDate(1); // Start of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of month
      break;
    case 'yearly':
      start.setMonth(0, 1); // Jan 1
      end.setMonth(11, 31); // Dec 31
      break;
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// Helper function to calculate current spending
const calculateSpending = async (userId, categoryName, dateRange) => {
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

// @desc    Get all budgets for user with current spending
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      userId: req.user._id,
      isActive: true 
    }).sort({ categoryName: 1 });

    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const dateRange = getDateRange(budget.period, budget.startDate);
        const currentSpending = await calculateSpending(
          req.user._id,
          budget.categoryName,
          dateRange
        );

        const budgetObj = budget.toObject();
        const alerts = budget.checkAlerts(currentSpending);

        return {
          ...budgetObj,
          currentSpending,
          ...alerts
        };
      })
    );

    res.status(200).json({
      success: true,
      count: budgetsWithSpending.length,
      data: budgetsWithSpending
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách ngân sách',
      error: error.message
    });
  }
};

// @desc    Get single budget with details
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ngân sách'
      });
    }

    const dateRange = getDateRange(budget.period, budget.startDate);
    const currentSpending = await calculateSpending(
      req.user._id,
      budget.categoryName,
      dateRange
    );

    const budgetObj = budget.toObject();
    const alerts = budget.checkAlerts(currentSpending);

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
      category: budget.categoryName,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    })
      .sort({ date: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        ...budgetObj,
        currentSpending,
        ...alerts,
        dateRange,
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin ngân sách',
      error: error.message
    });
  }
};

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res) => {
  try {
    const { categoryId, categoryName, amount, period, alertThresholds, notificationEnabled } = req.body;

    // Check if budget already exists for this category/period
    const existingBudget = await Budget.findOne({
      userId: req.user._id,
      categoryName: categoryName || null,
      period,
      isActive: true
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `Ngân sách ${period === 'monthly' ? 'tháng' : period === 'weekly' ? 'tuần' : 'năm'} cho ${categoryName || 'tổng'} đã tồn tại`
      });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await Category.findOne({
        _id: categoryId,
        userId: req.user._id
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
    }

    const budget = await Budget.create({
      userId: req.user._id,
      categoryId: categoryId || null,
      categoryName: categoryName || null,
      amount,
      period: period || 'monthly',
      alertThresholds: alertThresholds || [80, 100, 120],
      notificationEnabled: notificationEnabled !== false
    });

    res.status(201).json({
      success: true,
      message: 'Tạo ngân sách thành công',
      data: budget
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi tạo ngân sách',
      error: error.message
    });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  try {
    const { amount, period, alertThresholds, notificationEnabled, isActive } = req.body;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ngân sách'
      });
    }

    // Update fields
    if (amount !== undefined) budget.amount = amount;
    if (period) budget.period = period;
    if (alertThresholds) budget.alertThresholds = alertThresholds;
    if (notificationEnabled !== undefined) budget.notificationEnabled = notificationEnabled;
    if (isActive !== undefined) budget.isActive = isActive;

    await budget.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật ngân sách thành công',
      data: budget
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi cập nhật ngân sách',
      error: error.message
    });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ngân sách'
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa ngân sách thành công'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Lỗi khi xóa ngân sách',
      error: error.message
    });
  }
};

// @desc    Get budget status/overview
// @route   GET /api/budgets/status
// @access  Private
export const getBudgetStatus = async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      userId: req.user._id,
      isActive: true 
    });

    const statusList = await Promise.all(
      budgets.map(async (budget) => {
        const dateRange = getDateRange(budget.period, budget.startDate);
        const currentSpending = await calculateSpending(
          req.user._id,
          budget.categoryName,
          dateRange
        );

        const alerts = budget.checkAlerts(currentSpending);

        return {
          budgetId: budget._id,
          categoryName: budget.categoryName || 'Tổng',
          amount: budget.amount,
          currentSpending,
          remaining: budget.amount - currentSpending,
          ...alerts
        };
      })
    );

    // Overall statistics
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpending = statusList.reduce((sum, s) => sum + s.currentSpending, 0);
    const overBudgetCount = statusList.filter(s => s.isOverBudget).length;

    res.status(200).json({
      success: true,
      data: {
        budgets: statusList,
        summary: {
          totalBudget,
          totalSpending,
          totalRemaining: totalBudget - totalSpending,
          overBudgetCount,
          percentage: Math.round((totalSpending / totalBudget) * 100)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tổng quan ngân sách',
      error: error.message
    });
  }
};

// @desc    Check and get triggered alerts
// @route   GET /api/budgets/alerts
// @access  Private
export const getAlerts = async (req, res) => {
  try {
    const budgets = await Budget.find({ 
      userId: req.user._id,
      isActive: true,
      notificationEnabled: true
    });

    const alerts = [];

    for (const budget of budgets) {
      const dateRange = getDateRange(budget.period, budget.startDate);
      const currentSpending = await calculateSpending(
        req.user._id,
        budget.categoryName,
        dateRange
      );

      const alertInfo = budget.checkAlerts(currentSpending);

      if (alertInfo.triggeredAlerts.length > 0) {
        alerts.push({
          budgetId: budget._id,
          categoryName: budget.categoryName || 'Tổng',
          amount: budget.amount,
          currentSpending,
          percentage: alertInfo.percentage,
          triggeredAlerts: alertInfo.triggeredAlerts,
          isOverBudget: alertInfo.isOverBudget,
          message: alertInfo.isOverBudget
            ? `Vượt ngân sách ${budget.categoryName || 'tổng'} ${alertInfo.percentage - 100}%`
            : `Đạt ${alertInfo.percentage}% ngân sách ${budget.categoryName || 'tổng'}`
        });
      }
    }

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy cảnh báo',
      error: error.message
    });
  }
};
