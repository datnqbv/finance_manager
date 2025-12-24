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

// @desc    Compare statistics between periods (months or years)
// @route   GET /api/stats/compare
// @access  Private
export const compareStats = async (req, res) => {
  try {
    const { type = 'month', periods = 6 } = req.query;
    const now = new Date();
    const results = [];

    for (let i = parseInt(periods) - 1; i >= 0; i--) {
      let startDate, endDate, label;

      if (type === 'year') {
        const year = now.getFullYear() - i;
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
        label = `${year}`;
      } else {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);
        label = `${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`;
      }

      const transactions = await Transaction.find({
        userId: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      });

      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      results.push({
        period: label,
        startDate,
        endDate,
        income,
        expense,
        balance: income - expense,
        transactionCount: transactions.length
      });
    }

    // Calculate growth rates
    const withGrowth = results.map((item, index) => {
      if (index === 0) return { ...item, incomeGrowth: 0, expenseGrowth: 0 };
      
      const prev = results[index - 1];
      const incomeGrowth = prev.income > 0 ? ((item.income - prev.income) / prev.income * 100).toFixed(2) : 0;
      const expenseGrowth = prev.expense > 0 ? ((item.expense - prev.expense) / prev.expense * 100).toFixed(2) : 0;

      return { ...item, incomeGrowth: parseFloat(incomeGrowth), expenseGrowth: parseFloat(expenseGrowth) };
    });

    res.json({
      success: true,
      data: {
        type,
        periods: withGrowth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Forecast next month spending based on historical data
// @route   GET /api/stats/forecast
// @access  Private
export const forecastSpending = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const historicalData = [];

    // Get historical data
    for (let i = parseInt(months); i >= 1; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

      const transactions = await Transaction.find({
        userId: req.user.id,
        type: 'expense',
        date: { $gte: startDate, $lte: endDate }
      });

      const totalExpense = transactions.reduce((sum, t) => sum + t.amount, 0);
      historicalData.push(totalExpense);
    }

    // Simple average-based forecast
    const averageExpense = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    
    // Calculate trend (linear regression slope)
    const n = historicalData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    historicalData.forEach((value, index) => {
      sumX += index;
      sumY += value;
      sumXY += index * value;
      sumXX += index * index;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Forecast for next month
    const forecastValue = slope * n + intercept;
    const trend = slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable';

    // Forecast by category
    const categoryForecasts = {};
    const categories = await Transaction.distinct('category', { userId: req.user.id, type: 'expense' });

    for (const category of categories) {
      const categoryData = [];
      
      for (let i = parseInt(months); i >= 1; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

        const transactions = await Transaction.find({
          userId: req.user.id,
          type: 'expense',
          category,
          date: { $gte: startDate, $lte: endDate }
        });

        categoryData.push(transactions.reduce((sum, t) => sum + t.amount, 0));
      }

      const categoryAverage = categoryData.reduce((a, b) => a + b, 0) / categoryData.length;
      categoryForecasts[category] = Math.round(categoryAverage);
    }

    res.json({
      success: true,
      data: {
        historicalData,
        forecast: {
          nextMonth: Math.round(forecastValue > 0 ? forecastValue : averageExpense),
          average: Math.round(averageExpense),
          trend,
          confidence: slope !== 0 ? 'medium' : 'low'
        },
        byCategory: categoryForecasts,
        basedOnMonths: parseInt(months)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Analyze spending trends
// @route   GET /api/stats/trends
// @access  Private
export const analyzeTrends = async (req, res) => {
  try {
    const { period = 12 } = req.query;
    const now = new Date();
    const trends = [];

    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

      const transactions = await Transaction.find({
        userId: req.user.id,
        date: { $gte: startDate, $lte: endDate }
      });

      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      trends.push({
        month: `${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`,
        income,
        expense,
        savings: income - expense,
        savingsRate: income > 0 ? ((income - expense) / income * 100).toFixed(2) : 0
      });
    }

    // Calculate overall trends
    const avgIncome = trends.reduce((sum, t) => sum + t.income, 0) / trends.length;
    const avgExpense = trends.reduce((sum, t) => sum + t.expense, 0) / trends.length;
    const avgSavings = trends.reduce((sum, t) => sum + t.savings, 0) / trends.length;

    // Recent vs Historical comparison
    const recentMonths = trends.slice(-3);
    const historicalMonths = trends.slice(0, -3);
    
    const recentAvgExpense = recentMonths.reduce((sum, t) => sum + t.expense, 0) / recentMonths.length;
    const historicalAvgExpense = historicalMonths.length > 0 
      ? historicalMonths.reduce((sum, t) => sum + t.expense, 0) / historicalMonths.length 
      : recentAvgExpense;

    const expenseChange = historicalAvgExpense > 0 
      ? ((recentAvgExpense - historicalAvgExpense) / historicalAvgExpense * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        trends,
        analysis: {
          averageIncome: Math.round(avgIncome),
          averageExpense: Math.round(avgExpense),
          averageSavings: Math.round(avgSavings),
          recentExpenseChange: parseFloat(expenseChange),
          spendingTrend: parseFloat(expenseChange) > 5 ? 'increasing' : parseFloat(expenseChange) < -5 ? 'decreasing' : 'stable'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get top spending categories
// @route   GET /api/stats/top-categories
// @access  Private
export const getTopCategories = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate, type = 'expense' } = req.query;

    const query = { 
      userId: req.user.id,
      type
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const result = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const totalAmount = result.reduce((sum, item) => sum + item.total, 0);

    const formatted = result.map(item => ({
      category: item._id,
      total: item.total,
      count: item.count,
      average: Math.round(item.avgAmount),
      percentage: totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(2) : 0
    }));

    res.json({
      success: true,
      data: {
        categories: formatted,
        totalAmount,
        type
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get daily statistics
// @route   GET /api/stats/daily
// @access  Private
export const getDailyStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    // Group by day
    const dailyData = {};
    
    transactions.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { date: dateKey, income: 0, expense: 0, transactions: 0 };
      }
      
      dailyData[dateKey][t.type] += t.amount;
      dailyData[dateKey].transactions++;
    });

    const result = Object.values(dailyData).map(day => ({
      ...day,
      balance: day.income - day.expense
    }));

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

// @desc    Get weekly statistics
// @route   GET /api/stats/weekly
// @access  Private
export const getWeeklyStats = async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const now = new Date();
    const results = [];

    for (let i = parseInt(weeks) - 1; i >= 0; i--) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() - (i * 7));
      
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setHours(23, 59, 59, 999);

      const transactions = await Transaction.find({
        userId: req.user.id,
        date: { $gte: startOfWeek, $lte: endOfWeek }
      });

      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

      results.push({
        week: `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1} - ${endOfWeek.getDate()}/${endOfWeek.getMonth() + 1}`,
        startDate: startOfWeek,
        endDate: endOfWeek,
        income,
        expense,
        balance: income - expense,
        transactionCount: transactions.length
      });
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
