import Transaction from '../models/Transaction.model.js';
import Goal from '../models/Goal.model.js';
import mongoose from 'mongoose';
import * as ss from 'simple-statistics';

/** Chuẩn hoá mảng: thay null/undefined bằng 0 */
const sanitize = (data) => (Array.isArray(data) && data.length > 0)
  ? data.map(v => v ?? 0)
  : [];

/**
 * Single Exponential Smoothing (SES) — one-step-ahead forecast.
 * SES phản ứng nhanh hơn với biến động tổng thể so với SMA,
 * giúp dự báo tổng chi tiêu/thu nhập tháng tiếp theo sát hơn.
 */
function singleExponentialSmoothing(data, alpha = 0.4) {
  const clean = sanitize(data);
  if (clean.length === 0) return 0;
  let level = clean[0];
  for (let i = 1; i < clean.length; i++) {
    level = alpha * clean[i] + (1 - alpha) * level;
  }
  return Math.max(0, level);
}

/**
 * Simple Moving Average (SMA) — trung bình trượt trên `windowSize` điểm cuối.
 * SMA giúp làm mượt hơn ở cấp category (ít dữ liệu) so với SES.
 */
function simpleMovingAverage(data, windowSize = 3) {
  const clean = sanitize(data);
  if (clean.length === 0) return 0;
  const size = Math.min(windowSize, clean.length);
  return ss.mean(clean.slice(-size));
}

/**
 * Consistency score [0, 1] dựa trên MAE của one-step SES errors.
 * hàm đánh giá mức độ "mượt" của chuỗi dữ liệu so với mô hình SES, giúp xác định độ tin cậy của dự báo.
 */
function smoothingConsistencyScore(data, alpha = 0.4) {
  const clean = sanitize(data);
  if (clean.length < 2) return 1;

  let level = clean[0];
  let absErrSum = 0;
  for (let i = 1; i < clean.length; i++) {
    absErrSum += Math.abs(clean[i] - level);
    level = alpha * clean[i] + (1 - alpha) * level;
  }

  const avg = ss.mean(clean);
  if (avg <= 0) return 0;

  const normalizedError = (absErrSum / (clean.length - 1)) / avg;
  return Math.max(0, Math.min(1, 1 - normalizedError));
}

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

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });

    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const byCategory = transactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = { income: 0, expense: 0 };
      acc[t.category][t.type] += t.amount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period: { year: targetYear, month: targetMonth, startDate, endDate },
        summary: { income, expense, balance: income - expense },
        byCategory,
        transactions: transactions.length
      }
    });
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
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [overallAgg, monthlyAgg, recent] = await Promise.all([
      // Total income/expense all-time — single aggregation, no document fetch
      Transaction.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // This-month income/expense
      Transaction.aggregate([
        { $match: { userId, date: { $gte: startOfMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]),
      // Recent 5 transactions
      Transaction.find({ userId: req.user.id }).sort({ date: -1 }).limit(5).lean()
    ]);

    const toMap = (agg) => agg.reduce((m, r) => { m[r._id] = r; return m; }, {});
    const overall = toMap(overallAgg);
    const monthly = toMap(monthlyAgg);

    const totalIncome = overall.income?.total ?? 0;
    const totalExpense = overall.expense?.total ?? 0;
    const totalCount = (overall.income?.count ?? 0) + (overall.expense?.count ?? 0);
    const monthlyIncome = monthly.income?.total ?? 0;
    const monthlyExpense = monthly.expense?.total ?? 0;

    res.json({
      success: true,
      data: {
        overall: { totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: totalCount },
        thisMonth: { income: monthlyIncome, expense: monthlyExpense, balance: monthlyIncome - monthlyExpense },
        recentTransactions: recent
      }
    });
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
    const query = { userId: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);

    const categoryStats = transactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = { category: t.category, income: 0, expense: 0, count: 0 };
      acc[t.category][t.type] += t.amount;
      acc[t.category].count++;
      return acc;
    }, {});

    const result = Object.values(categoryStats).sort((a, b) => b.expense - a.expense);
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
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const n = parseInt(periods);
    const now = (refYear && refMonth)
      ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1)
      : new Date();

    let startDate, endDate;
    const results = [];

    if (type === 'year') {
      const startYear = now.getFullYear() - n + 1;
      startDate = new Date(startYear, 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      // Single aggregation grouped by year
      const agg = await Transaction.aggregate([
        { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, type: '$type' },
            total: { $sum: '$amount' }, count: { $sum: 1 }
          }
        }
      ]);
      const map = {};
      agg.forEach(r => {
        const key = r._id.year;
        if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
        map[key][r._id.type] += r.total;
        map[key].count += r.count;
      });
      for (let i = 0; i < n; i++) {
        const year = startYear + i;
        const d = map[year] || { income: 0, expense: 0, count: 0 };
        results.push({ period: `${year}`, startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31, 23, 59, 59), income: d.income, expense: d.expense, balance: d.income - d.expense, transactionCount: d.count });
      }
    } else {
      const baseDate = new Date(now.getFullYear(), now.getMonth() - n + 1, 1);
      startDate = baseDate;
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Single aggregation grouped by year+month
      const agg = await Transaction.aggregate([
        { $match: { userId, date: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }, count: { $sum: 1 }
          }
        }
      ]);
      const map = {};
      agg.forEach(r => {
        const key = `${r._id.year}-${r._id.month}`;
        if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
        map[key][r._id.type] += r.total;
        map[key].count += r.count;
      });
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const entry = map[key] || { income: 0, expense: 0, count: 0 };
        const sDate = new Date(d.getFullYear(), d.getMonth(), 1);
        const eDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        results.push({ period: `${d.getMonth() + 1}/${d.getFullYear()}`, startDate: sDate, endDate: eDate, income: entry.income, expense: entry.expense, balance: entry.income - entry.expense, transactionCount: entry.count });
      }
    }

    const withGrowth = results.map((item, index) => {
      if (index === 0) return { ...item, incomeGrowth: 0, expenseGrowth: 0 };
      const prev = results[index - 1];
      const incomeGrowth = prev.income > 0 ? +((item.income - prev.income) / prev.income * 100).toFixed(2) : 0;
      const expenseGrowth = prev.expense > 0 ? +((item.expense - prev.expense) / prev.expense * 100).toFixed(2) : 0;
      return { ...item, incomeGrowth, expenseGrowth };
    });

    res.json({ success: true, data: { type, periods: withGrowth } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Forecast next month using SES (overall) + SMA (by category)
// @route   GET /api/stats/forecast
// @access  Private
export const forecastSpending = async (req, res) => {
  try {
    // Lấy từ query string: số tháng muốn phân tích (mặc định 6), và tháng/năm tham chiếu (tuỳ chọn — dùng để test với dữ liệu quá khứ).
    const { months = 6, refYear, refMonth } = req.query;
    // Ép kiểu months sang số nguyên, đảm bảo tối thiểu là 1 (không cho phép n = 0 hoặc âm).
    const n = Math.max(1, parseInt(months, 10) || 6);
    const userId = new mongoose.Types.ObjectId(req.user.id);
    // Nếu có truyền refYear và refMonth thì dùng làm "thời điểm hiện tại" giả lập. Nếu không, dùng ngày thực. 
    // Lưu ý month - 1 vì Date tháng bắt đầu từ 0.
    const now = (refYear && refMonth)
      ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1)
      : new Date();

    // Define range: n months back from now
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - n, 1);
    // Ngày 0 của tháng hiện tại = ngày cuối cùng của tháng trước. Đặt 23:59:59 để bao trọn ngày đó.
    const rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Single aggregation for monthly type totals + category totals
    const [monthlyAgg, catMonthlyAgg] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId, date: { $gte: rangeStart, $lte: rangeEnd } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        { $match: { userId, type: 'expense', date: { $gte: rangeStart, $lte: rangeEnd } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, category: '$category' },
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // xây dựng 2 map: monthMap để lưu tổng income/expense theo tháng, catMap để lưu tổng expense theo category+month. 
    // Cả 2 đều dùng kết quả từ 1 lần aggregate duy nhất, tránh vòng lặp nhiều lần trên dữ liệu gốc.
    const monthMap = {};
    monthlyAgg.forEach(r => {
      const key = `${r._id.year}-${r._id.month}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      monthMap[key][r._id.type] = r.total;
    });
    const catMap = {};
    catMonthlyAgg.forEach(r => {
      const cat = r._id.category;
      const key = `${r._id.year}-${r._id.month}`;
      if (!catMap[cat]) catMap[cat] = {};
      catMap[cat][key] = r.total;
    });
    // 3 biến để lưu lịch sử expense/income theo tháng và label tương ứng, dùng cho cả phần forecast tổng thể và category-level.
    const expenseHistory = [];
    const incomeHistory = [];
    const labels = [];
    // duyệt qua n tháng gần nhất, xây dựng lịch sử tổng income/expense theo tháng dựa trên monthMap, 
    // và label dạng "MM/YYYY" cho mỗi tháng.
    for (let i = n; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      expenseHistory.push(monthMap[key]?.expense ?? 0);
      incomeHistory.push(monthMap[key]?.income ?? 0);
      labels.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
    }
  // set alpha cho ses - 0.4
    const sesAlpha = 0.4;
    const smaWindow = Math.min(3, n);
    // tính toán trung bình, dự báo bằng SES, và đánh giá xu hướng + độ tin cậy của dự báo.
    const avgExpense = Math.round(ss.mean(expenseHistory));
    const avgIncome = Math.round(ss.mean(incomeHistory));
    // Dự báo tổng chi tiêu/thu nhập tháng tiếp theo bằng SES, đảm bảo không âm. Nếu SES trả về 0 (do dữ liệu quá mượt hoặc thiếu biến động), sẽ dùng trung bình làm dự phòng.    
    const forecastExpense = Math.round(singleExponentialSmoothing(expenseHistory, sesAlpha));
    const forecastIncome = Math.round(singleExponentialSmoothing(incomeHistory, sesAlpha));
     // Giữ nguyên logic đơn giản về margin ±10% quanh forecast SES, nhưng đổi tên thành marginLow/marginHigh để rõ ràng hơn.
    const finalFcstExp = forecastExpense > 0 ? forecastExpense : avgExpense;
    const finalFcstInc = forecastIncome > 0 ? forecastIncome : avgIncome;
    // Đánh giá xu hướng dựa trên sự thay đổi giữa recent average (SMA) và historical average, với ngưỡng 2% để xác định tăng/giảm/ổn định.
    const expenseRecentAvg = simpleMovingAverage(expenseHistory, smaWindow);
    const expensePastAvg = expenseHistory.length > smaWindow
      ? ss.mean(expenseHistory.slice(0, -smaWindow))
      : expenseRecentAvg;
    const incomeRecentAvg = simpleMovingAverage(incomeHistory, smaWindow);
    const incomePastAvg = incomeHistory.length > smaWindow
      ? ss.mean(incomeHistory.slice(0, -smaWindow))
      : incomeRecentAvg;
    // Đổi ngưỡng đánh giá xu hướng từ 3% xuống 2% để nhạy hơn với biến động, phù hợp với dữ liệu thực tế thường có nhiều biến động nhỏ.
    const expenseDelta = expenseRecentAvg - expensePastAvg;
    const incomeDelta = incomeRecentAvg - incomePastAvg;
    const expenseTrend = expenseDelta > avgExpense * 0.02 ? 'increasing'
      : expenseDelta < -avgExpense * 0.02 ? 'decreasing'
        : 'stable';
    const incomeTrend = incomeDelta > avgIncome * 0.02 ? 'increasing'
      : incomeDelta < -avgIncome * 0.02 ? 'decreasing'
        : 'stable';
    // Đánh giá độ tin cậy của dự báo bằng cách tính "smoothing consistency score" cho cả expense và income history, 
    // sau đó lấy trung bình để phân loại confidence level thành high/medium/low.
    const r2ExpenseScore = smoothingConsistencyScore(expenseHistory, sesAlpha);
    const r2IncomeScore = smoothingConsistencyScore(incomeHistory, sesAlpha);
    const r2Avg = (r2ExpenseScore + r2IncomeScore) / 2;
    const confidence = r2Avg > 0.7 ? 'high' : r2Avg > 0.4 ? 'medium' : 'low';

    // Đặt margin dựa trên forecast SES, với ±10% để tạo khoảng tin cậy cho người dùng, 
    // giúp họ hiểu rằng dự báo không phải là con số chính xác tuyệt đối mà có thể dao động trong khoảng này.
    const marginLow = Math.round(Math.max(0, finalFcstExp * 0.9));
    const marginHigh = Math.round(finalFcstExp * 1.1);

    // Dự báo chi tiêu theo category bằng cách sử dụng SMA trên lịch sử chi tiêu của từng category. 
    const categoryForecasts = {};
    for (const [category, monthData] of Object.entries(catMap)) {
      const catHistory = [];
      for (let i = n; i >= 1; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        catHistory.push(monthData[key] ?? 0);
      }
      // Tính trung bình, dự báo bằng SMA, và đánh giá xu hướng + độ tin cậy tương tự như phần tổng thể, nhưng với logic đơn giản hơn do dữ liệu category thường ít biến động hơn.
      const catAvg = ss.mean(catHistory);
      const catFcst = Math.round(simpleMovingAverage(catHistory, smaWindow));
      const catRecentAvg = simpleMovingAverage(catHistory, smaWindow);
      // Đánh giá xu hướng category dựa trên sự thay đổi giữa recent average (SMA) và historical average, với ngưỡng 3% để xác định tăng/giảm/ổn định. Do dữ liệu category thường có nhiều biến động nhỏ, nên ngưỡng 3% giúp tránh việc đánh giá sai xu hướng chỉ vì những thay đổi nhỏ.  
      const catPastAvg = catHistory.length > smaWindow
        ? ss.mean(catHistory.slice(0, -smaWindow))
        : catRecentAvg;
        // Đổi ngưỡng đánh giá xu hướng từ 5% xuống 3% để nhạy hơn với biến động ở cấp category, phù hợp với thực tế thường có nhiều biến động nhỏ trong chi tiêu theo category.  
      const catTrend = (catRecentAvg - catPastAvg) > catAvg * 0.03 ? 'increasing'
        : (catRecentAvg - catPastAvg) < -catAvg * 0.03 ? 'decreasing'
          : 'stable';
      categoryForecasts[category] = {
        forecast: catFcst || Math.round(catAvg),
        average: Math.round(catAvg),
        trend: catTrend,
        r2: +smoothingConsistencyScore(catHistory, sesAlpha).toFixed(2)
      };
    }
    // Trả về kết quả dự báo tổng thể và theo category, cùng với các thông tin phân tích xu hướng và độ tin cậy, giúp người dùng có cái nhìn toàn diện về tình hình tài chính sắp tới và có thể điều chỉnh kế hoạch chi tiêu phù hợp.
    res.json({
      success: true,
      data: {
        historicalData: expenseHistory,
        incomeHistory,
        labels,
        forecast: {
          nextMonthExpense: finalFcstExp,
          nextMonthIncome: finalFcstInc,
          nextMonthSavings: finalFcstInc - finalFcstExp,
          avgExpense,
          avgIncome,
          expenseTrend,
          incomeTrend,
          confidence,
          r2Expense: +r2ExpenseScore.toFixed(2),
          r2Income: +r2IncomeScore.toFixed(2),
          marginLow,
          marginHigh,
        },
        byCategory: categoryForecasts,
        basedOnMonths: n
      }
    });
  } catch (error) {
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
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const n = parseInt(period);
    const now = (refYear && refMonth)
      ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1)
      : new Date();
    // Định nghĩa khoảng thời gian cần phân tích: từ n tháng trước đến cuối tháng hiện tại (hoặc tháng tham chiếu). 
    // Việc đặt endDate là ngày cuối cùng của tháng hiện tại giúp đảm bảo rằng chúng ta đang phân tích dữ liệu đầy đủ của các tháng đã qua, thay vì chỉ đến ngày hiện tại.
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - n + 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    // Single aggregation grouped by year+month+type để lấy tổng thu/chi theo tháng, giúp phân tích xu hướng tổng thể.
    const agg = await Transaction.aggregate([
      { $match: { userId, date: { $gte: rangeStart, $lte: rangeEnd } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' }
        }
      }
    ]);
    // Xây dựng map để dễ dàng truy cập tổng thu/chi theo tháng, giúp việc tạo chuỗi dữ liệu cho phần phân tích xu hướng trở nên đơn giản và hiệu quả.  
    const map = {};
    agg.forEach(r => {
      const key = `${r._id.year}-${r._id.month}`;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      map[key][r._id.type] = r.total;
    });
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
    const query = { userId: req.user.id, type };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const result = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 }, avgAmount: { $avg: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const totalAmount = result.reduce((s, i) => s + i.total, 0);
    const formatted = result.map(item => ({
      category: item._id,
      total: item.total,
      count: item.count,
      average: Math.round(item.avgAmount),
      percentage: totalAmount > 0 ? +((item.total / totalAmount) * 100).toFixed(2) : 0
    }));

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
    const end = endDate ? new Date(endDate) : new Date();

    const transactions = await Transaction.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    const dailyData = {};
    transactions.forEach(t => {
      const key = t.date.toISOString().split('T')[0];
      if (!dailyData[key]) dailyData[key] = { date: key, income: 0, expense: 0, transactions: 0 };
      dailyData[key][t.type] += t.amount;
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
    const userId = new mongoose.Types.ObjectId(req.user.id);
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

    // Single aggregation + ISO-week grouping
    const agg = await Transaction.aggregate([
      { $match: { userId, date: { $gte: rangeStart, $lte: rangeEnd } } },
      {
        $group: {
          _id: {
            isoWeek: { $isoWeek: '$date' },
            isoYear: { $isoWeekYear: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const weekMap = {};
    agg.forEach(r => {
      const key = `${r._id.isoYear}-${r._id.isoWeek}`;
      if (!weekMap[key]) weekMap[key] = { income: 0, expense: 0, count: 0 };
      weekMap[key][r._id.type] += r.total;
      weekMap[key].count += r.count;
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
    const userId = new mongoose.Types.ObjectId(req.user.id);
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
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { startDate, endDate } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Period range from query (or default to current month)
    const periodStart = startDate ? new Date(startDate) : startOfMonth;
    const periodEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 6-month range for monthly chart
    const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Last month for category comparison
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 7-day range for daily fluctuation
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Run all aggregations + queries in parallel
    const [
      overallAgg,
      monthSummaryAgg,
      sixMonthAgg,
      periodAgg,
      lastMonthCatAgg,
      recent,
      goals
    ] = await Promise.all([
      // All-time totals
      Transaction.aggregate([
        { $match: { userId } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Current month summary
      Transaction.aggregate([
        { $match: { userId, date: { $gte: startOfMonth } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]),
      // 6-month monthly breakdown
      Transaction.aggregate([
        { $match: { userId, date: { $gte: sixMonthStart } } },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }
          }
        }
      ]),
      // Period transactions (for category stats + daily fluctuation)
      Transaction.find({
        userId: req.user.id,
        date: { $gte: periodStart, $lte: periodEnd }
      }).sort({ date: -1 }).lean(),
      // Last month category stats
      Transaction.aggregate([
        { $match: { userId, date: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      // Recent 5 transactions
      Transaction.find({ userId: req.user.id }).sort({ date: -1 }).limit(5).lean(),
      // Goals (lightweight)
      Goal.find({ userId: req.user.id }).lean()
    ]);

    // ── Overall summary ──
    const toMap = (agg) => agg.reduce((m, r) => { m[r._id] = r; return m; }, {});
    const overall = toMap(overallAgg);
    const monthly = toMap(monthSummaryAgg);
    const summary = {
      overall: {
        totalIncome: overall.income?.total ?? 0,
        totalExpense: overall.expense?.total ?? 0,
        balance: (overall.income?.total ?? 0) - (overall.expense?.total ?? 0),
        transactionCount: (overall.income?.count ?? 0) + (overall.expense?.count ?? 0)
      },
      thisMonth: {
        income: monthly.income?.total ?? 0,
        expense: monthly.expense?.total ?? 0,
        balance: (monthly.income?.total ?? 0) - (monthly.expense?.total ?? 0)
      },
      recentTransactions: recent
    };

    // ── 6-month chart ──
    const sixMonthMap = {};
    sixMonthAgg.forEach(r => {
      const key = `${r._id.year}-${r._id.month}`;
      if (!sixMonthMap[key]) sixMonthMap[key] = { income: 0, expense: 0 };
      sixMonthMap[key][r._id.type] = r.total;
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
    periodAgg.forEach(t => {
      if (!catMap[t.category]) catMap[t.category] = { category: t.category, income: 0, expense: 0, count: 0 };
      catMap[t.category][t.type] += t.amount;
      catMap[t.category].count++;
    });
    const categoryStats = Object.values(catMap).sort((a, b) => b.expense - a.expense);

    // ── Last month category stats ──
    const lastMonthCatMap = {};
    lastMonthCatAgg.forEach(r => {
      const cat = r._id.category;
      if (!lastMonthCatMap[cat]) lastMonthCatMap[cat] = { category: cat, income: 0, expense: 0, count: 0 };
      lastMonthCatMap[cat][r._id.type] += r.total;
      lastMonthCatMap[cat].count += r.count;
    });
    const lastMonthCategoryStats = Object.values(lastMonthCatMap).sort((a, b) => b.expense - a.expense);

    // ── Period summary (filtered) ──
    const periodIncome = periodAgg.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const periodExpense = periodAgg.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const filteredSummary = {
      income: periodIncome,
      expense: periodExpense,
      balance: periodIncome - periodExpense,
      transactionCount: periodAgg.length,
      recentTransactions: periodAgg.slice(0, 5)
    };

    // ── Daily fluctuation (last 7 days from period transactions) ──
    const dailyData = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { date: key, dateLabel: `${d.getDate()}/${d.getMonth() + 1}`, income: 0, expense: 0, balance: 0, count: 0 };
    }
    periodAgg.forEach(t => {
      const key = new Date(t.date).toISOString().split('T')[0];
      if (dailyData[key]) {
        if (t.type === 'income') dailyData[key].income += t.amount;
        else dailyData[key].expense += t.amount;
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
        goals
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
