import Budget from '../models/Budget.model.js';
import Transaction from '../models/Transaction.model.js';
import Category from '../models/Category.model.js';
import mongoose from 'mongoose';

// ── Inline checkAlerts helper (works on .lean() objects) ─────────────────────
const checkAlertsInline = (alertThresholds, notificationEnabled, currentSpending, effectiveAmount) => {
  // lấy phần trăm ngân sách đã đạt được dựa trên số tiền đã chi tiêu và số tiền hiệu quả của ngân sách (bao gồm cả phần rollover nếu có), sau đó so sánh với các ngưỡng cảnh báo đã định nghĩa để xác định những cảnh báo nào đã được kích hoạt, giúp người dùng nhanh chóng nhận biết những ngân sách nào đang có nguy cơ bị vượt hoặc đã vượt mức, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
  const pct = effectiveAmount > 0 ? (currentSpending / effectiveAmount) * 100 : 0;
  // lấy ngưỡng cảnh báo từ ngân sách hoặc sử dụng mặc định nếu không có, sau đó lọc ra những ngưỡng nào đã bị vượt qua dựa trên phần trăm đã đạt được và trạng thái kích hoạt thông báo, giúp người dùng nhanh chóng nhận biết những ngân sách nào đang có nguy cơ bị vượt hoặc đã vượt mức, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
  const thresholds = alertThresholds?.length ? alertThresholds : [80, 100, 120];
  // lấy danh sách các cảnh báo đã được kích hoạt dựa trên phần trăm đã đạt được và trạng thái kích hoạt thông báo, giúp người dùng nhanh chóng nhận biết những ngân sách nào đang có nguy cơ bị vượt hoặc đã vượt mức, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
  const triggered  = thresholds.filter(t => pct >= t && notificationEnabled !== false);
  return { percentage: Math.round(pct), triggeredAlerts: triggered, isOverBudget: pct > 100 };
};

// ── Batch spending lookup: groups budgets by date range, 1 aggregation/group ─
const buildSpendingLookup = async (userId, budgets) => {
  const rangeGroups = {};
  budgets.forEach(b => {
    const { start, end } = getDateRange(b.period, b.startDate);
    const key = `${start.getTime()}-${end.getTime()}`;
    if (!rangeGroups[key]) rangeGroups[key] = { start, end };
  });

  const spendingByKey = {};
  await Promise.all(Object.entries(rangeGroups).map(async ([key, { start, end }]) => {
    const agg = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: start, $lte: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } }
    ]);
    const catSpend = {};
    let totalSpend = 0;
    agg.forEach(r => { catSpend[r._id] = r.total; totalSpend += r.total; });
    spendingByKey[key] = { catSpend, totalSpend };
  }));

  // Returns a function: budget → currentSpending
  return (b) => {
    const { start, end } = getDateRange(b.period, b.startDate);
    const key = `${start.getTime()}-${end.getTime()}`;
    const { catSpend = {}, totalSpend = 0 } = spendingByKey[key] || {};
    return b.categoryName ? (catSpend[b.categoryName] ?? 0) : totalSpend;
  };
};

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

// Helper: get last period's date range
const getLastPeriodRange = (period, now = new Date()) => {
  const start = new Date(now);
  const end   = new Date(now);
  switch (period) {
    case 'monthly':
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0); // last day of previous month
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7 - start.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case 'yearly':
      start.setFullYear(start.getFullYear() - 1, 0, 1);
      end.setFullYear(start.getFullYear(), 11, 31);
      break;
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// Helper: current period key string
const currentPeriodKey = (period, now = new Date()) => {
  switch (period) {
    case 'monthly': return `${now.getFullYear()}-${now.getMonth() + 1}`;
    case 'weekly':  {
      const week = Math.ceil(now.getDate() / 7);
      return `${now.getFullYear()}-${now.getMonth() + 1}-w${week}`;
    }
    case 'yearly':  return `${now.getFullYear()}`;
    default: return `${now.getFullYear()}-${now.getMonth() + 1}`;
  }
};

// @desc    Get all budgets for user with current spending
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();

    const budgets = await Budget.find({ userId, isActive: true }).sort({ categoryName: 1 }).lean();

    // ── Rollover: Cái này là  ─────────────
    const rolloverTargets = budgets.filter(b =>
      b.rolloverEnabled && b.lastRolloverMonth !== currentPeriodKey(b.period, now)
    );
    // nếu có ngân sách nào bật tính năng rollover và chưa được cập nhật cho kỳ hiện tại, thì sẽ thực hiện tính toán số tiền thừa hoặc thiếu từ kỳ trước và cập nhật vào trường rolloverAmount của ngân sách đó, 
    // giúp người dùng có cái nhìn chính xác hơn về số tiền còn lại trong ngân sách hiện tại sau khi đã tính đến phần dư hoặc thiếu từ kỳ trước, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
    if (rolloverTargets.length > 0) {
      const byPeriod = {};
      rolloverTargets.forEach(b => { (byPeriod[b.period] ??= []).push(b); });
      // nhóm các ngân sách cần rollover theo kỳ (tuần/tháng/năm) để tối ưu việc truy vấn tổng chi tiêu của kỳ đó, tránh phải thực hiện nhiều truy vấn cho từng ngân sách riêng lẻ, từ đó cải thiện hiệu suất của API khi có nhiều ngân sách cần rollover cùng lúc.
      const rolloverWrites = [];
      await Promise.all(Object.entries(byPeriod).map(async ([period, pBudgets]) => {
        const lastRange = getLastPeriodRange(period, now);
        const agg = await Transaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: lastRange.start, $lte: lastRange.end } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);
        const catSpend   = {};
        let   totalSpend = 0;
        agg.forEach(r => { catSpend[r._id] = r.total; totalSpend += r.total; });
        // tính toán số tiền thừa hoặc thiếu từ kỳ trước cho từng ngân sách cần rollover dựa trên tổng chi tiêu của kỳ đó, sau đó chuẩn bị các cập nhật để ghi vào cơ sở dữ liệu, giúp người dùng có cái nhìn chính xác hơn về số tiền còn lại trong ngân sách hiện tại sau khi đã tính đến phần dư hoặc thiếu từ kỳ trước, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
        // tính bằng cách lấy số tiền đã chi tiêu của kỳ trước (theo danh mục nếu có, hoặc tổng nếu là ngân sách tổng) và so sánh với số tiền của ngân sách cộng với phần rolloverAmount từ kỳ trước (nếu có), phần chênh lệch sẽ được ghi vào trường rolloverAmount để cộng vào ngân sách của kỳ hiện tại, giúp người dùng có cái nhìn chính xác hơn về số tiền còn lại trong ngân sách hiện tại sau khi đã tính đến phần dư hoặc thiếu từ kỳ trước, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
        const periodKey = currentPeriodKey(period, now);
        pBudgets.forEach(b => {
          const lastSpending  = b.categoryName ? (catSpend[b.categoryName] ?? 0) : totalSpend;
          const surplus       = (b.amount + (b.rolloverAmount || 0)) - lastSpending;
          rolloverWrites.push({ id: b._id.toString(), rolloverAmount: surplus, lastRolloverMonth: periodKey });
        });
      }));

      if (rolloverWrites.length > 0) {
        await Budget.bulkWrite(rolloverWrites.map(u => ({
          updateOne: { filter: { _id: u.id }, update: { $set: { rolloverAmount: u.rolloverAmount, lastRolloverMonth: u.lastRolloverMonth } } }
        })));
        const writeMap = Object.fromEntries(rolloverWrites.map(u => [u.id, u]));
        budgets.forEach(b => {
          const u = writeMap[b._id.toString()];
          if (u) { b.rolloverAmount = u.rolloverAmount; b.lastRolloverMonth = u.lastRolloverMonth; }
        });
      }
    }

    // ── Current spending: 1 aggregation per unique date range ────────────────
    const getSpending = await buildSpendingLookup(userId, budgets);

    const result = budgets.map(b => {
      const currentSpending  = getSpending(b);
      const effectiveAmount  = b.amount + (b.rolloverAmount || 0);
      const alerts           = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
      return { ...b, effectiveAmount, currentSpending, ...alerts };
    });

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách ngân sách', error: error.message });
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
    const { amount, period, alertThresholds, notificationEnabled, isActive, rolloverEnabled } = req.body;

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
    if (rolloverEnabled !== undefined) budget.rolloverEnabled = rolloverEnabled;

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
// lấy trạng thái của tất cả ngân sách hiện tại bao gồm số tiền đã chi, còn lại, phần trăm đã đạt được và các cảnh báo nếu có, giúp người dùng nhanh chóng đánh giá tình hình ngân sách của họ và nhận biết những ngân sách nào đang có nguy cơ bị vượt hoặc đã vượt mức, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
export const getBudgetStatus = async (req, res) => {
  try {
    const userId  = req.user._id;
    const budgets = await Budget.find({ userId, isActive: true }).lean();

    const getSpending = await buildSpendingLookup(userId, budgets);

    const statusList = budgets.map(b => {
      const currentSpending = getSpending(b);
      const effectiveAmount = b.amount + (b.rolloverAmount || 0);
      const alerts = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
      return {
        budgetId: b._id, categoryName: b.categoryName || 'Tổng',
        amount: b.amount, effectiveAmount, currentSpending,
        remaining: effectiveAmount - currentSpending, ...alerts
      };
    });

    const totalBudget   = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpending = statusList.reduce((s, b) => s + b.currentSpending, 0);
    const overBudgetCount = statusList.filter(b => b.isOverBudget).length;

    res.status(200).json({
      success: true,
      data: {
        budgets: statusList,
        summary: { totalBudget, totalSpending, totalRemaining: totalBudget - totalSpending, overBudgetCount, percentage: Math.round((totalSpending / totalBudget) * 100) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy tổng quan ngân sách', error: error.message });
  }
};

// @desc    Check and get triggered alerts
// @route   GET /api/budgets/alerts
// @access  Private
// Lấy danh sách các cảnh báo đã kích hoạt dựa trên các ngân sách hiện tại và mức chi tiêu,
//  giúp người dùng nhanh chóng nhận biết những ngân sách nào đang có nguy cơ bị vượt hoặc đã vượt mức, từ đó có thể điều chỉnh kế hoạch chi tiêu kịp thời để tránh rủi ro tài chính.
export const getAlerts = async (req, res) => {
  try {
    const userId  = req.user._id;
    const budgets = await Budget.find({ userId, isActive: true, notificationEnabled: true }).lean();

    const getSpending = await buildSpendingLookup(userId, budgets);

    const alerts = [];
    budgets.forEach(b => {
      const currentSpending = getSpending(b);
      const effectiveAmount = b.amount + (b.rolloverAmount || 0);
      const alertInfo = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
      if (alertInfo.triggeredAlerts.length > 0) {
        alerts.push({
          budgetId: b._id, categoryName: b.categoryName || 'Tổng',
          amount: b.amount, currentSpending, percentage: alertInfo.percentage,
          triggeredAlerts: alertInfo.triggeredAlerts, isOverBudget: alertInfo.isOverBudget,
          message: alertInfo.isOverBudget
            ? `Vượt ngân sách ${b.categoryName || 'tổng'} ${alertInfo.percentage - 100}%`
            : `Đạt ${alertInfo.percentage}% ngân sách ${b.categoryName || 'tổng'}`
        });
      }
    });

    res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy cảnh báo', error: error.message });
  }
};

// @desc    Combined budgets + status + alerts in one call
// @route   GET /api/budgets/overview
// @access  Private
// lấy tổng quan ngân sách bao gồm danh sách ngân sách, trạng thái hiện tại (đã chi bao nhiêu, còn lại bao nhiêu, đã đạt được bao nhiêu phần trăm) và các cảnh báo đã kích hoạt nếu có, giúp người dùng có cái nhìn tổng thể về tình hình ngân sách của họ trong một lần gọi API duy nhất, từ đó dễ dàng theo dõi và quản lý tài chính cá nhân hiệu quả hơn.
export const getBudgetOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const now    = new Date();

    // Rollover check (same batch logic as getBudgets)
    const allBudgets = await Budget.find({ userId, isActive: true }).sort({ categoryName: 1 }).lean();

    const rolloverTargets = allBudgets.filter(b =>
      b.rolloverEnabled && b.lastRolloverMonth !== currentPeriodKey(b.period, now)
    );
    if (rolloverTargets.length > 0) {
      const byPeriod = {};
      rolloverTargets.forEach(b => { (byPeriod[b.period] ??= []).push(b); });
      const rolloverWrites = [];
      await Promise.all(Object.entries(byPeriod).map(async ([period, pBudgets]) => {
        const lastRange = getLastPeriodRange(period, now);
        const agg = await Transaction.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'expense', date: { $gte: lastRange.start, $lte: lastRange.end } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);
        const catSpend = {}; let totalSpend = 0;
        agg.forEach(r => { catSpend[r._id] = r.total; totalSpend += r.total; });
        const periodKey = currentPeriodKey(period, now);
        pBudgets.forEach(b => {
          const lastSpending = b.categoryName ? (catSpend[b.categoryName] ?? 0) : totalSpend;
          const surplus = (b.amount + (b.rolloverAmount || 0)) - lastSpending;
          rolloverWrites.push({ id: b._id.toString(), rolloverAmount: surplus, lastRolloverMonth: periodKey });
        });
      }));
      if (rolloverWrites.length > 0) {
        await Budget.bulkWrite(rolloverWrites.map(u => ({
          updateOne: { filter: { _id: u.id }, update: { $set: { rolloverAmount: u.rolloverAmount, lastRolloverMonth: u.lastRolloverMonth } } }
        })));
        const writeMap = Object.fromEntries(rolloverWrites.map(u => [u.id, u]));
        allBudgets.forEach(b => { const u = writeMap[b._id.toString()]; if (u) { b.rolloverAmount = u.rolloverAmount; b.lastRolloverMonth = u.lastRolloverMonth; }});
      }
    }

    // Single batch spending lookup
    const getSpending = await buildSpendingLookup(userId, allBudgets);

    const budgetsWithSpending = allBudgets.map(b => {
      const currentSpending = getSpending(b);
      const effectiveAmount = b.amount + (b.rolloverAmount || 0);
      const alerts = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
      return { ...b, effectiveAmount, currentSpending, ...alerts };
    });

    // Build status summary
    const totalBudget   = allBudgets.reduce((s, b) => s + b.amount, 0);
    const totalSpending = budgetsWithSpending.reduce((s, b) => s + b.currentSpending, 0);
    const overBudgetCount = budgetsWithSpending.filter(b => b.isOverBudget).length;
    const status = {
      budgets: budgetsWithSpending.map(b => ({
        budgetId: b._id, categoryName: b.categoryName || 'Tổng',
        amount: b.amount, effectiveAmount: b.effectiveAmount, currentSpending: b.currentSpending,
        remaining: b.effectiveAmount - b.currentSpending,
        percentage: b.percentage, triggeredAlerts: b.triggeredAlerts, isOverBudget: b.isOverBudget
      })),
      summary: { totalBudget, totalSpending, totalRemaining: totalBudget - totalSpending, overBudgetCount,
        percentage: totalBudget > 0 ? Math.round((totalSpending / totalBudget) * 100) : 0 }
    };

    // Build alerts
    const triggeredAlerts = budgetsWithSpending
      .filter(b => b.notificationEnabled !== false && b.triggeredAlerts?.length > 0)
      .map(b => ({
        budgetId: b._id, categoryName: b.categoryName || 'Tổng',
        amount: b.amount, currentSpending: b.currentSpending, percentage: b.percentage,
        triggeredAlerts: b.triggeredAlerts, isOverBudget: b.isOverBudget,
        message: b.isOverBudget
          ? `Vượt ngân sách ${b.categoryName || 'tổng'} ${b.percentage - 100}%`
          : `Đạt ${b.percentage}% ngân sách ${b.categoryName || 'tổng'}`
      }));

    res.status(200).json({
      success: true,
      data: { budgets: budgetsWithSpending, status, alerts: triggeredAlerts }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi lấy tổng quan ngân sách', error: error.message });
  }
};
