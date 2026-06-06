import { Transaction, Goal, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import * as ss from 'simple-statistics';
import { forecastNextMonth, forecastCategoryExpense } from '../services/xgboost.forecast.service.js';



// @desc    Get monthly statistics
// @route   GET /api/stats/monthly
// @access  Private
// dùng cho dashboard "Thống kê tháng", giúp người dùng có cái nhìn chi tiết về thu/chi trong tháng hiện tại hoặc tháng bất kỳ, từ đó dễ dàng theo dõi và điều chỉnh kế hoạch tài chính hàng tháng.
export const getMonthlyStats = async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const transactions = await Transaction.findAll({ where: { userId: req.user.id, date: { [Op.between]: [startDate, endDate] } }, raw: true });

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    const byCategory = transactions.reduce((acc, t) => {
      const cat = t.category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = { income: 0, expense: 0 };
      acc[cat][t.type] += Number(t.amount);
      return acc;
    }, {});

    res.json({ success: true, data: { period: { year: targetYear, month: targetMonth, startDate, endDate }, summary: { income, expense, balance: income - expense }, byCategory, transactions: transactions.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get summary statistics
// @route   GET /api/stats/summary
// @access  Private
// dùng cho dashboard tổng quan, giúp người dùng có cái nhìn nhanh về tình hình tài chính hiện tại và xu hướng gần đây.
export const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const overallRows = await Transaction.findAll({ where: { userId: req.user.id }, attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['type'], raw: true });
    const overallMap = {}; overallRows.forEach(r => overallMap[r.type] = r);
    const totalIncome = parseFloat(overallMap.income?.total || 0);
    const totalExpense = parseFloat(overallMap.expense?.total || 0);
    const totalCount = parseInt(overallMap.income?.count || 0) + parseInt(overallMap.expense?.count || 0);

    const monthlyRows = await Transaction.findAll({ where: { userId: req.user.id, date: { [Op.gte]: startOfMonth } }, attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: ['type'], raw: true });
    const monthlyMap = {}; monthlyRows.forEach(r => monthlyMap[r.type] = r);
    const monthlyIncome = parseFloat(monthlyMap.income?.total || 0);
    const monthlyExpense = parseFloat(monthlyMap.expense?.total || 0);

    const recent = await Transaction.findAll({ where: { userId: req.user.id }, order: [['date','DESC']], limit: 5, raw: true });

    res.json({ success: true, data: { overall: { totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: totalCount }, thisMonth: { income: monthlyIncome, expense: monthlyExpense, balance: monthlyIncome - monthlyExpense }, recentTransactions: recent } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category statistics
// @route   GET /api/stats/categories
// @access  Private
// dùng cho dashboard "Phân tích theo danh mục", 
// giúp người dùng thấy rõ chi tiêu theo từng loại, từ đó có thể điều chỉnh thói quen chi tiêu.   
export const getCategoryStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: req.user.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date[Op.gte] = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date[Op.lte] = end;
      }
    }

    const rows = await Transaction.findAll({ where, attributes: ['category', 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['category','type'], raw: true });
    const categoryStats = {};
    rows.forEach(r => {
      const cat = r.category || 'Uncategorized';
      categoryStats[cat] ??= { category: cat, income: 0, expense: 0, count: 0 };
      categoryStats[cat][r.type] = parseFloat(r.total) || 0;
      categoryStats[cat].count += parseInt(r.count || 0);
    });
    const result = Object.values(categoryStats).sort((a,b) => b.expense - a.expense);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compare statistics between periods
// @route   GET /api/stats/compare
// @access  Private
// dùng cho dashboard "So sánh" giữa các tháng/năm, giúp người dùng thấy rõ xu hướng thay đổi thu/chi theo thời gian.
export const compareStats = async (req, res) => {
  try {
    const { type = 'month', periods = 6, refYear, refMonth } = req.query;
    const userId = req.user.id;
    const n = parseInt(periods);
    const now = (refYear && refMonth) ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1) : new Date();

    let startDate, endDate;
    const results = [];

    if (type === 'year') {
      const startYear = now.getFullYear() - n + 1;
      startDate = new Date(startYear, 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
      const rows = await Transaction.findAll({ where: { userId, date: { [Op.between]: [startDate, endDate] } }, attributes: [[yearFn, 'year'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: [yearFn, 'type'], raw: true });
      const map = {};
      rows.forEach(r => {
        r.year = parseInt(r.year);
        const y = r.year;
        map[y] ??= { income: 0, expense: 0, count: 0 };
        map[y][r.type] += parseFloat(r.total || 0);
        map[y].count += parseInt(r.count || 0);
      });
      for (let y = startYear; y <= now.getFullYear(); y++) {
        const e = map[y] || { income: 0, expense: 0, count: 0 };
        results.push({ label: `${y}`, income: e.income, expense: e.expense, balance: e.income - e.expense, txCount: e.count });
      }
    } else {
      const rangeStart = new Date(now.getFullYear(), now.getMonth() - n + 1, 1);
      const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
      const monthFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%m', sequelize.col('date')) : sequelize.fn('MONTH', sequelize.col('date'));
      const rows = await Transaction.findAll({
        where: { userId, date: { [Op.between]: [rangeStart, rangeEnd] } },
        attributes: [[yearFn, 'year'], [monthFn, 'month'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
        group: [yearFn, monthFn, 'type'],
        raw: true 
      });

      const map = {};
      rows.forEach(r => {
        const year = parseInt(r.year, 10);
        const month = parseInt(r.month, 10);
        const key = `${year}-${month}`;
        if (!map[key]) map[key] = { income: 0, expense: 0 };
        map[key][r.type] += parseFloat(r.total || 0);
      });

      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const e = map[key] || { income: 0, expense: 0 };
        results.push({ label: `${d.getMonth() + 1}/${d.getFullYear()}`, income: e.income, expense: e.expense, balance: e.income - e.expense, txCount: 0 });
      }
    }

    // compute simple growth between last two periods
    let growth = { income: 0, expense: 0 };
    if (results.length >= 2) {
      const last = results[results.length - 1];
      const prev = results[results.length - 2];
      growth.income = prev.income > 0 ? +(((last.income - prev.income) / prev.income) * 100).toFixed(2) : 0;
      growth.expense = prev.expense > 0 ? +(((last.expense - prev.expense) / prev.expense) * 100).toFixed(2) : 0;
    }

    res.json({ success: true, data: { type, periods: results, growth } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forecast next month using XGBoost Machine Learning Model
// @route   GET /api/stats/forecast
// @access  Private
// Dự báo chi tiêu sử dụng XGBoost-style Gradient Boosting
export const forecastSpending = async (req, res) => {
  try {
    const { months = 6, refYear, refMonth } = req.query;
    const n = Math.max(1, parseInt(months, 10) || 6);
    const userId = req.user.id;
    const now = (refYear && refMonth)
      ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1)
      : new Date();

    // Lấy dữ liệu giao dịch trong n tháng trước
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - n, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
    const monthFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%m', sequelize.col('date')) : sequelize.fn('MONTH', sequelize.col('date'));
    const [monthlyAgg, catMonthlyAgg] = await Promise.all([
      Transaction.findAll({ where: { userId, date: { [Op.between]: [rangeStart, rangeEnd] } }, attributes: [[yearFn, 'year'], [monthFn, 'month'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: [yearFn, monthFn, 'type'], raw: true }),
      Transaction.findAll({ where: { userId, type: 'expense', date: { [Op.between]: [rangeStart, rangeEnd] } }, attributes: [[yearFn, 'year'], [monthFn, 'month'], 'category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: [yearFn, monthFn, 'category'], raw: true })
    ]);

    // Normalize aggregation results (year/month may be strings in SQLite)
    monthlyAgg.forEach(r => { r.year = parseInt(r.year); r.month = parseInt(r.month); });
    catMonthlyAgg.forEach(r => { r.year = parseInt(r.year); r.month = parseInt(r.month); });

    // Xây dựng dữ liệu lịch sử theo tháng
    const monthMap = {};
    monthlyAgg.forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      monthMap[key][r.type] += parseFloat(r.total || 0);
    });

    const catMap = {};
    catMonthlyAgg.forEach(r => {
      const cat = r.category;
      const key = `${r.year}-${r.month}`;
      if (!catMap[cat]) catMap[cat] = {};
      catMap[cat][key] = parseFloat(r.total || 0);
    });

    // Xây dựng các chuỗi thời gian
    const expenseHistory = [];
    const incomeHistory = [];
    const labels = [];
    const categoryHistories = {};

    for (let i = n; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      expenseHistory.push(monthMap[key]?.expense ?? 0);
      incomeHistory.push(monthMap[key]?.income ?? 0);
      labels.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
    }

    // Xây dựng lịch sử theo category
    for (const [category, monthData] of Object.entries(catMap)) {
      const catHistory = [];
      for (let i = n; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        catHistory.push(monthData[key] ?? 0);
      }
      categoryHistories[category] = catHistory;
    }

    // ========== PHẦN DÙNG XGBOOST ==========
    // Dự báo chi tiêu tổng thể sử dụng XGBoost
    const expenseForecast = forecastNextMonth(expenseHistory, categoryHistories);
    const incomeForecast = forecastNextMonth(incomeHistory, {});
    
    // Dự báo theo từng category sử dụng XGBoost
    const categoryForecasts = {};
    for (const [category, catHistory] of Object.entries(categoryHistories)) {
      const catForecast = forecastCategoryExpense(catHistory);
      categoryForecasts[category] = {
        forecast: catForecast.forecast,
        average: Math.round(ss.mean(catHistory)),
        trend: catForecast.trend,
        confidence: catForecast.confidence,
        r2: catForecast.r2Score
      };
    }

    // Tính toán các giá trị hỗ trợ
    const avgExpense = Math.round(ss.mean(expenseHistory));
    const avgIncome = Math.round(ss.mean(incomeHistory));
    const marginLow = Math.round(Math.max(0, expenseForecast.forecast * 0.9));
    const marginHigh = Math.round(expenseForecast.forecast * 1.1);

    // Trả về kết quả dự báo
    res.json({
      success: true,
      data: {
        historicalData: expenseHistory,
        incomeHistory,
        labels,
        forecast: {
          nextMonthExpense: expenseForecast.forecast,
          nextMonthIncome: incomeForecast.forecast,
          nextMonthSavings: incomeForecast.forecast - expenseForecast.forecast,
          avgExpense,
          avgIncome,
          expenseTrend: expenseForecast.trend,
          incomeTrend: incomeForecast.trend,
          confidence: expenseForecast.confidence,
          confidencePercent: expenseForecast.confidencePercent,
          r2Expense: expenseForecast.r2Score,
          r2Income: incomeForecast.r2Score,
          marginLow,
          marginHigh,
          modelType: 'XGBoost Gradient Boosting' // Chỉ ra mô hình được sử dụng
        },
        byCategory: categoryForecasts,
        basedOnMonths: n
      }
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Analyze spending trends
// @route   GET /api/stats/trends
// @access  Private
// dùng cho dashboard "Xu hướng chi tiêu", giúp người dùng nhận diện được các xu hướng tăng/giảm trong chi tiêu của mình, từ đó có thể điều chỉnh kế hoạch tài chính phù hợp.
export const analyzeTrends = async (req, res) => {
  try {
    // Lấy từ query string: số tháng muốn phân tích (mặc định 12), và tháng/năm tham chiếu (tuỳ chọn — dùng để test với dữ liệu quá khứ).
    const { period = 12, refYear, refMonth } = req.query;
    const userId = req.user.id;
    const n = parseInt(period);
    const now = (refYear && refMonth)
      ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1)
      : new Date();
    // Định nghĩa khoảng thời gian cần phân tích: từ n tháng trước đến cuối tháng hiện tại (hoặc tháng tham chiếu). 
    // Việc đặt endDate là ngày cuối cùng của tháng hiện tại giúp đảm bảo rằng chúng ta đang phân tích dữ liệu đầy đủ của các tháng đã qua, thay vì chỉ đến ngày hiện tại.
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - n + 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    // Use dialect-aware YEAR/MONTH extraction (SQLite uses strftime)
    const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
    const monthFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%m', sequelize.col('date')) : sequelize.fn('MONTH', sequelize.col('date'));
    const rows = await Transaction.findAll({ where: { userId, date: { [Op.between]: [rangeStart, rangeEnd] } }, attributes: [[yearFn, 'year'], [monthFn, 'month'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: [yearFn, monthFn, 'type'], raw: true });
    const map = {};
    // Normalize year/month that may be strings on SQLite
    rows.forEach(r => { r.year = parseInt(r.year); r.month = parseInt(r.month); const key = `${r.year}-${r.month}`; if (!map[key]) map[key] = { income: 0, expense: 0 }; map[key][r.type] = parseFloat(r.total || 0); });
    // Duyệt qua n tháng gần nhất để xây dựng chuỗi dữ liệu thu/chi theo tháng, cùng với label dạng "MM/YYYY" cho mỗi tháng, giúp phần phân tích xu hướng có dữ liệu đầy đủ và chính xác.
    const trends = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const entry = map[key] || { income: 0, expense: 0 };
      const income = entry.income;
      const expense = entry.expense;
      trends.push({
        month: `${d.getMonth() + 1}/${d.getFullYear()}`,
        income,
        expense,
        savings: income - expense,
        savingsRate: income > 0 ? +((income - expense) / income * 100).toFixed(2) : 0
      });
    }
   // Tính toán các chỉ số phân tích xu hướng: trung bình thu/chi/savings, sự thay đổi chi tiêu gần đây so với quá khứ, và đánh giá xu hướng tăng/giảm/ổn định dựa trên sự thay đổi này.
    const avgIncome = ss.mean(trends.map(t => t.income));
    const avgExpense = ss.mean(trends.map(t => t.expense));
    const avgSavings = ss.mean(trends.map(t => t.savings));
   // Để đánh giá xu hướng chi tiêu, chúng ta sẽ so sánh trung bình chi tiêu của 3 tháng gần nhất với trung bình chi tiêu của phần còn lại của chuỗi.   
    const recentMonths = trends.slice(-3);
    const historicalMonths = trends.slice(0, -3);
    const recentAvg = ss.mean(recentMonths.map(t => t.expense));
    const historicalAvg = historicalMonths.length > 0
      ? ss.mean(historicalMonths.map(t => t.expense))
      : recentAvg;
    // Tính phần trăm thay đổi giữa recent average và historical average để đánh giá xu hướng. Nếu historicalAvg là 0 (do dữ liệu quá mượt hoặc thiếu biến động), sẽ đặt expenseChange là 0 để tránh chia cho 0.      
    const expenseChange = historicalAvg > 0
      ? +((recentAvg - historicalAvg) / historicalAvg * 100).toFixed(2)
      : 0;
    // Đánh giá xu hướng chi tiêu dựa trên sự thay đổi giữa recent average và historical average, với ngưỡng 5% để xác định tăng/giảm/ổn định. Ngưỡng 5% giúp tránh việc đánh giá sai xu hướng chỉ vì những thay đổi nhỏ trong chi tiêu, phù hợp với thực tế thường có nhiều biến động nhỏ trong dữ liệu tài chính cá nhân. 
    res.json({
      success: true,
      data: {
        trends,
        analysis: {
          averageIncome: Math.round(avgIncome),
          averageExpense: Math.round(avgExpense),
          averageSavings: Math.round(avgSavings),
          recentExpenseChange: expenseChange,
          spendingTrend: expenseChange > 5 ? 'increasing' : expenseChange < -5 ? 'decreasing' : 'stable'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get top spending categories
// @route   GET /api/stats/top-categories
// @access  Private
// lấy chi tiết các category chi tiêu hàng đầu trong khoảng thời gian nhất định, giúp người dùng nhận diện được những lĩnh vực chi tiêu lớn nhất của mình, từ đó có thể điều chỉnh kế hoạch tài chính phù hợp.
export const getTopCategories = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate, type = 'expense' } = req.query;
    const where = { userId: req.user.id, type };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date[Op.gte] = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date[Op.lte] = end;
      }
    }
    const rows = await Transaction.findAll({ where, attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('AVG', sequelize.col('amount')), 'avgAmount']], group: ['category'], order: [[sequelize.literal('total'), 'DESC']], limit: parseInt(limit), raw: true });
    const totalAmount = rows.reduce((s,i) => s + parseFloat(i.total || 0), 0);
    const formatted = rows.map(item => ({ category: item.category, total: parseFloat(item.total || 0), count: parseInt(item.count || 0), average: Math.round(parseFloat(item.avgAmount || 0)), percentage: totalAmount > 0 ? +((parseFloat(item.total || 0) / totalAmount) * 100).toFixed(2) : 0 }));
    res.json({ success: true, data: { categories: formatted, totalAmount, type } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get daily statistics
// @route   GET /api/stats/daily
// @access  Private
// lấy chi tiết thu/chi theo ngày trong khoảng thời gian nhất định, giúp người dùng có cái nhìn chi tiết về thu/chi trong tháng hiện tại hoặc tháng bất kỳ, 
// từ đó dễ dàng theo dõi và điều chỉnh kế hoạch tài chính hàng ngày.  
export const getDailyStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const transactions = await Transaction.findAll({ where: { userId: req.user.id, date: { [Op.between]: [start, end] } }, order: [['date','ASC']], raw: true });
    const dailyData = {};
    transactions.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (!dailyData[key]) dailyData[key] = { date: key, income: 0, expense: 0, transactions: 0 };
      dailyData[key][t.type] += Number(t.amount);
      dailyData[key].transactions++;
    });
    const result = Object.values(dailyData).map(day => ({ ...day, balance: day.income - day.expense }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get weekly statistics
// @route   GET /api/stats/weekly
// @access  Private
// lấy chi tiết thu/chi theo tuần trong khoảng thời gian nhất định, giúp người dùng có cái nhìn tổng quan về thu/chi theo tuần, 
// từ đó dễ dàng theo dõi và điều chỉnh kế hoạch tài chính hàng tuần.    
export const getWeeklyStats = async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const userId = req.user.id;
    const n = parseInt(weeks);
    const now = new Date();

    // Xây dựng các slot tuần dựa trên n tuần gần nhất, với mỗi slot có start và end date.  
    const weekSlots = [];
    for (let i = n - 1; i >= 0; i--) {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(endOfWeek.getDate() - i * 7);
      const startOfWeek = new Date(endOfWeek);
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      startOfWeek.setHours(0, 0, 0, 0);
      endOfWeek.setHours(23, 59, 59, 999);
      weekSlots.push({ start: startOfWeek, end: endOfWeek });
    }

    const rangeStart = weekSlots[0].start;
    const rangeEnd = weekSlots[weekSlots.length - 1].end;

    // Fetch transactions in range and group into week slots
    const txs = await Transaction.findAll({ where: { userId, date: { [Op.between]: [rangeStart, rangeEnd] } }, raw: true });
    const weekMap = {};
    txs.forEach(t => {
      const d = new Date(t.date);
      const key = (() => {
        const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
        const year = tmp.getUTCFullYear();
        const week = Math.ceil((((tmp - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
        return `${year}-${week}`;
      })();
      if (!weekMap[key]) weekMap[key] = { income: 0, expense: 0, count: 0 };
      weekMap[key][t.type] += Number(t.amount);
      weekMap[key].count += 1;
    });
    // lấy kết quả từ aggregation và map vào các slot tuần đã xây dựng, đảm bảo rằng mỗi slot tuần đều có dữ liệu thu/chi, ngay cả khi không có giao dịch nào trong tuần đó (sẽ hiển thị 0).  
    const getISOWeekKey = (d) => {
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
      const year = tmp.getUTCFullYear();
      const week = Math.ceil((((tmp - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
      return `${year}-${week}`;
    };

    const results = weekSlots.map(({ start, end }) => {
      const key = getISOWeekKey(start);
      const entry = weekMap[key] || { income: 0, expense: 0, count: 0 };
      return {
        week: `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`,
        startDate: start,
        endDate: end,
        income: entry.income,
        expense: entry.expense,
        balance: entry.income - entry.expense,
        transactionCount: entry.count
      };
    });

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    AI-powered financial insights: anomaly detection, health score, recommendations
// @route   GET /api/stats/ai-insights
// @access  Private
// DISABLED - Not used by client yet
/*
export const getAIInsights = async (req, res) => {
  try {
    const userId = req.user.id; // user identifier for DB queries
    const now = new Date();
    const months = 12;

    // 12 months range
    const rangeStart12 = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const rangeEnd12 = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    // 6 months range for category trends
    const rangeStart6 = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Two aggregations replace all serial loops
    const [monthlyAgg, catMonthlyAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, date: { $gte: rangeStart12, $lte: rangeEnd12 } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }, count: { $sum: 1 }
          }
        }
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: rangeStart6, $lte: rangeEnd12 } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, category: '$category' },
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const monthMap = {};
    monthlyAgg.forEach(r => {
      const key = `${r._id.year}-${r._id.month}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0, count: 0 };
      monthMap[key][r._id.type] += r.total;
      monthMap[key].count += r.count;
    });

    const catMap = {};
    catMonthlyAgg.forEach(r => {
      const cat = r._id.category;
      const key = `${r._id.year}-${r._id.month}`;
      if (!catMap[cat]) catMap[cat] = {};
      catMap[cat][key] = r.total;
    });

    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const e = monthMap[key] || { income: 0, expense: 0, count: 0 };
      monthlyData.push({ label: `${d.getMonth() + 1}/${d.getFullYear()}`, income: e.income, expense: e.expense, savings: e.income - e.expense, txCount: e.count });
    }

    const expenses = monthlyData.map(m => m.expense);
    const incomes = monthlyData.map(m => m.income);
    const avgExpense = ss.mean(expenses);
    const avgIncome = ss.mean(incomes);
    const stdExpense = ss.standardDeviation(expenses);

    // Anomaly detection (expense > avg + 1.5σ)
    const anomalies = monthlyData
      .filter(m => m.expense > avgExpense + 1.5 * stdExpense && m.expense > 0)
      .map(m => ({
        month: m.label,
        expense: m.expense,
        deviation: +(((m.expense - avgExpense) / avgExpense) * 100).toFixed(1)
      }));

    // Best/worst month by savings
    const nonZero = monthlyData.filter(m => m.income > 0);
    const bestMonth = nonZero.reduce((best, m) => m.savings > (best?.savings ?? -Infinity) ? m : best, null);
    const worstMonth = nonZero.reduce((worst, m) => m.savings < (worst?.savings ?? Infinity) ? m : worst, null);

    // Savings health score (0–100)
    const validMonths = monthlyData.filter(m => m.income > 0);
    const avgSavingsRate = validMonths.length > 0
      ? ss.mean(validMonths.map(m => (m.savings / m.income) * 100))
      : 0;

    const savingsRateScore = Math.min(40, Math.max(0, avgSavingsRate / 0.5));
    const consistencyScore = Math.max(0, 30 - (stdExpense / (avgExpense || 1)) * 30);
    const expReg = ss.linearRegression(expenses.map((v, i) => [i, v]));
    const trendScore = expReg.m <= 0 ? 30 : Math.max(0, 30 - (expReg.m / (avgExpense || 1)) * 300);
    const healthScore = Math.round(Math.min(100, savingsRateScore + consistencyScore + trendScore));

    const healthLabel = healthScore >= 75 ? 'Tốt'
      : healthScore >= 50 ? 'Trung bình'
        : healthScore >= 25 ? 'Cần cải thiện'
          : 'Cần chú ý';
    const healthColor = healthScore >= 75 ? 'emerald'
      : healthScore >= 50 ? 'amber'
        : healthScore >= 25 ? 'orange'
          : 'red';

    // Category trend (last 3 months vs prior 3 months) — data already in catMap from aggregation
    const categoryTrends = [];
    for (const [cat, monthData] of Object.entries(catMap)) {
      const recent3 = [], prior3 = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const total = monthData[key] ?? 0;
        if (i < 3) recent3.push(total); else prior3.push(total);
      }
      const recentAvg = ss.mean(recent3);
      const priorAvg = ss.mean(prior3);
      const change = priorAvg > 0 ? +((recentAvg - priorAvg) / priorAvg * 100).toFixed(1) : 0;
      if (Math.abs(change) >= 10 && recentAvg > 0) {
        categoryTrends.push({ category: cat, recentAvg: Math.round(recentAvg), priorAvg: Math.round(priorAvg), changePercent: change });
      }
    }
    categoryTrends.sort((a, b) => b.changePercent - a.changePercent);

    // Recommendations
    const recommendations = [];
    if (avgSavingsRate < 10) {
      recommendations.push({ type: 'warning', message: 'Tỷ lệ tiết kiệm dưới 10%. Hãy thử giảm chi tiêu không thiết yếu.' });
    } else if (avgSavingsRate >= 20) {
      recommendations.push({ type: 'success', message: `Bạn đang tiết kiệm ${avgSavingsRate.toFixed(1)}% thu nhập. Tiếp tục phát huy!` });
    }
    if (anomalies.length > 0) {
      recommendations.push({ type: 'warning', message: `Phát hiện ${anomalies.length} tháng có chi tiêu bất thường vượt mức trung bình.` });
    }
    const growingCats = categoryTrends.filter(c => c.changePercent > 20);
    if (growingCats.length > 0) {
      recommendations.push({ type: 'info', message: `Danh mục "${growingCats[0].category}" tăng ${growingCats[0].changePercent}% gần đây. Hãy kiểm tra lại.` });
    }
    if (expReg.m > avgExpense * 0.05) {
      recommendations.push({ type: 'warning', message: 'Chi tiêu có xu hướng tăng đều. Cân nhắc đặt ngân sách giới hạn.' });
    }
    const currentMonth = monthlyData[monthlyData.length - 1];
    if (currentMonth.savings < 0) {
      recommendations.push({ type: 'error', message: 'Tháng hiện tại chi tiêu vượt thu nhập. Cần điều chỉnh ngay.' });
    }
    if (recommendations.length === 0) {
      recommendations.push({ type: 'success', message: 'Tình hình tài chính ổn định. Hãy tiếp tục duy trì thói quen tốt.' });
    }

    res.json({
      success: true,
      data: {
        healthScore,
        healthLabel,
        healthColor,
        avgSavingsRate: +avgSavingsRate.toFixed(1),
        avgExpense: Math.round(avgExpense),
        avgIncome: Math.round(avgIncome),
        anomalies,
        bestMonth,
        worstMonth,
        categoryTrends: categoryTrends.slice(0, 5),
        recommendations,
        monthlyData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
*/

// @desc    Combined dashboard data — replaces 9+ individual calls with 1
// @route   GET /api/stats/dashboard
// @access  Private
export const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Period range from query (or default to current month)
    const periodStart = startDate ? new Date(startDate) : startOfMonth;
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    periodEnd.setHours(23, 59, 59, 999);

    // 6-month range for monthly chart
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Last month for category comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 7-day range for daily fluctuation
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Run all aggregations + queries in parallel using Sequelize
    const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
    const monthFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%m', sequelize.col('date')) : sequelize.fn('MONTH', sequelize.col('date'));

    const [overallRows, monthSummaryRows, sixMonthRows, periodRows, lastMonthCatRows, recentRows, goalsRows] = await Promise.all([
      Transaction.findAll({ where: { userId }, attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['type'], raw: true }),
      Transaction.findAll({ where: { userId, date: { [Op.gte]: startOfMonth } }, attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: ['type'], raw: true }),
      Transaction.findAll({ where: { userId, date: { [Op.gte]: sixMonthStart } }, attributes: [[yearFn, 'year'], [monthFn, 'month'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: [yearFn, monthFn, 'type'], raw: true }),
      Transaction.findAll({ where: { userId, date: { [Op.between]: [periodStart, periodEnd] } }, order: [['date','DESC']], raw: true }),
      Transaction.findAll({ where: { userId, date: { [Op.between]: [lastMonthStart, lastMonthEnd] } }, attributes: ['category', 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['category','type'], raw: true }),
      Transaction.findAll({ where: { userId }, order: [['date','DESC']], limit: 5, raw: true }),
      Goal.findAll({ where: { userId }, raw: true })
    ]);

    // ── Overall summary ──
    const overall = {}; overallRows.forEach(r => overall[r.type] = r);
    const monthly = {}; monthSummaryRows.forEach(r => monthly[r.type] = r);
    const summary = {
      overall: {
        totalIncome: parseFloat(overall.income?.total || 0),
        totalExpense: parseFloat(overall.expense?.total || 0),
        balance: (parseFloat(overall.income?.total || 0)) - (parseFloat(overall.expense?.total || 0)),
        transactionCount: parseInt(overall.income?.count || 0) + parseInt(overall.expense?.count || 0)
      },
      thisMonth: {
        income: parseFloat(monthly.income?.total || 0),
        expense: parseFloat(monthly.expense?.total || 0),
        balance: (parseFloat(monthly.income?.total || 0)) - (parseFloat(monthly.expense?.total || 0))
      },
      recentTransactions: recentRows
    };

    // ── 6-month chart ──
    const sixMonthMap = {};
    sixMonthRows.forEach(r => {
      const key = `${r.year}-${r.month}`;
      if (!sixMonthMap[key]) sixMonthMap[key] = { income: 0, expense: 0 };
      sixMonthMap[key][r.type] = parseFloat(r.total || 0);
    });
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const e = sixMonthMap[key] || { income: 0, expense: 0 };
      monthlyStats.push({ year: d.getFullYear(), month: d.getMonth() + 1, totalIncome: e.income, totalExpense: e.expense });
    }

    // ── Period category stats ──
    const catMap = {};
    periodRows.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { category: t.category, income: 0, expense: 0, count: 0 };
      catMap[t.category][t.type] += Number(t.amount);
      catMap[t.category].count++;
    });
    const categoryStats = Object.values(catMap).sort((a, b) => b.expense - a.expense);

    // ── Last month category stats ──
    const lastMonthCatMap = {};
    lastMonthCatRows.forEach(r => {
      const cat = r.category;
      if (!lastMonthCatMap[cat]) lastMonthCatMap[cat] = { category: cat, income: 0, expense: 0, count: 0 };
      lastMonthCatMap[cat][r.type] += parseFloat(r.total || 0);
      lastMonthCatMap[cat].count += parseInt(r.count || 0);
    });
    const lastMonthCategoryStats = Object.values(lastMonthCatMap).sort((a, b) => b.expense - a.expense);

    // ── Period summary (filtered) ──
    const periodIncome = periodRows.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const periodExpense = periodRows.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const filteredSummary = {
      income: periodIncome,
      expense: periodExpense,
      balance: periodIncome - periodExpense,
      transactionCount: periodRows.length,
      recentTransactions: periodRows.slice(0, 5)
    };

    // ── Daily fluctuation (last 7 days from period transactions) ──
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { date: key, dateLabel: `${d.getDate()}/${d.getMonth() + 1}`, income: 0, expense: 0, balance: 0, count: 0 };
    }
    periodRows.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (dailyData[key]) {
        if (t.type === 'income') dailyData[key].income += Number(t.amount);
        else dailyData[key].expense += Number(t.amount);
        dailyData[key].count++;
      }
    });
    const dailyArr = Object.values(dailyData);
    const avgIncome7 = dailyArr.reduce((s, d) => s + d.income, 0) / dailyArr.length;
    const avgExpense7 = dailyArr.reduce((s, d) => s + d.expense, 0) / dailyArr.length;
    dailyArr.forEach(d => { d.balance = d.income - d.expense; d.avgIncome = avgIncome7; d.avgExpense = avgExpense7; });

    res.json({
      success: true,
      data: {
        summary,
        filteredSummary,
        monthlyStats,
        categoryStats,
        lastMonthCategoryStats,
        dailyFluctuation: dailyArr,
        goals: goalsRows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
