import Transaction from '../models/Transaction.model.js';

// @desc    Get monthly statistics
// @route   GET /api/stats/monthly
// @access  Private
export const getMonthlyStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Default to current month
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const byCategory = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { income: 0, expense: 0 };
      }
      acc[t.category][t.type] += t.amount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period: {
          year: targetYear,
          month: targetMonth,
          startDate,
          endDate
        },
        summary: {
          income,
          expense,
          balance: income - expense
        },
        byCategory,
        transactions: transactions.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get summary statistics
// @route   GET /api/stats/summary
// @access  Private
export const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id });

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get this month's data
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthTransactions = transactions.filter(
      t => t.date >= startOfMonth
    );

    const monthlyIncome = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        overall: {
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          transactionCount: transactions.length
        },
        thisMonth: {
          income: monthlyIncome,
          expense: monthlyExpense,
          balance: monthlyIncome - monthlyExpense
        },
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/stats/categories
// @access  Private
export const getCategoryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = { userId: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);

    // Group by category and type
    const categoryStats = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = {
          category: t.category,
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (t.type === 'income') {
        acc[t.category].income += t.amount;
      } else {
        acc[t.category].expense += t.amount;
      }
      acc[t.category].count++;
      
      return acc;
    }, {});

    // Convert to array and sort by expense
    const result = Object.values(categoryStats).sort(
      (a, b) => b.expense - a.expense
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
