import { Budget, Transaction, Category, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';

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

const normalizeBudgetRow = (b) => ({
  ...b,
  alertThresholds: Array.isArray(b.alertThresholds)
    ? b.alertThresholds
    : (typeof b.alertThresholds === 'string'
      ? (() => { try { return JSON.parse(b.alertThresholds || '[]'); } catch (e) { return []; } })()
      : []),
  notificationEnabled: typeof b.notificationEnabled === 'string'
    ? (b.notificationEnabled === '1' || b.notificationEnabled === 'true')
    : Boolean(b.notificationEnabled)
});

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
    const rows = await Transaction.findAll({
      where: { userId, type: 'expense', date: { [Op.between]: [start, end] } },
      attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      group: ['category'],
      raw: true,
    });
    const catSpend = {};
    let totalSpend = 0;
    rows.forEach(r => { catSpend[r.category] = parseFloat(r.total) || 0; totalSpend += parseFloat(r.total) || 0; });
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
  const where = { userId, type: 'expense', date: { [Op.between]: [dateRange.start, dateRange.end] } };
  if (categoryName) where.category = categoryName;
  const rows = await Transaction.findAll({ where, attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']], raw: true });
  return rows && rows.length > 0 ? parseFloat(rows[0].total) || 0 : 0;
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
    const userId = req.user.id;
    const now    = new Date();

    let budgets = await Budget.findAll({ where: { userId, isActive: true }, order: [['categoryName','ASC']], raw: true });
    // When using `raw: true`, Sequelize returns raw DB values (JSON stored as text).
    // Ensure `alertThresholds` is an array for downstream helpers.
    budgets = budgets.map(normalizeBudgetRow);

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
        const rows = await Transaction.findAll({
          where: { userId, type: 'expense', date: { [Op.between]: [lastRange.start, lastRange.end] } },
          attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
          group: ['category'],
          raw: true,
        });
        const catSpend = {}; let totalSpend = 0;
        rows.forEach(r => { catSpend[r.category] = parseFloat(r.total) || 0; totalSpend += parseFloat(r.total) || 0; });
        const periodKey = currentPeriodKey(period, now);
        pBudgets.forEach(b => {
          const lastSpending = b.categoryName ? (catSpend[b.categoryName] ?? 0) : totalSpend;
          const surplus = (b.amount + (b.rolloverAmount || 0)) - lastSpending;
          rolloverWrites.push({ id: b.id, rolloverAmount: surplus, lastRolloverMonth: periodKey });
        });
      }));

      if (rolloverWrites.length > 0) {
        await Promise.all(rolloverWrites.map(u => Budget.update({ rolloverAmount: u.rolloverAmount, lastRolloverMonth: u.lastRolloverMonth }, { where: { id: u.id } })));
        const writeMap = Object.fromEntries(rolloverWrites.map(u => [u.id, u]));
        budgets.forEach(b => {
          const key = b.id;
          const u = writeMap[key];
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
    console.error('getBudgets error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách ngân sách', error: error.message });
  }
};

// @desc    Get single budget with details
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id }, raw: false });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ngân sách'
      });
    }

    const dateRange = getDateRange(budget.period, budget.startDate);
    const currentSpending = await calculateSpending(req.user.id, budget.categoryName, dateRange);

    const budgetObj = budget.get ? budget.get({ plain: true }) : budget;
    const alerts = checkAlertsInline(budgetObj.alertThresholds, budgetObj.notificationEnabled, currentSpending, budgetObj.amount + (budgetObj.rolloverAmount || 0));

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { userId: req.user.id, type: 'expense', category: budgetObj.categoryName, date: { [Op.between]: [dateRange.start, dateRange.end] } },
      order: [['date','DESC']],
      limit: 10,
      raw: true
    });

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
    const existingBudget = await Budget.findOne({ where: { userId: req.user.id, categoryName: categoryName || null, period, isActive: true } });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `Ngân sách ${period === 'monthly' ? 'tháng' : period === 'weekly' ? 'tuần' : 'năm'} cho ${categoryName || 'tổng'} đã tồn tại`
      });
    }

    // Validate amount
    const numAmount = Number(amount);
    if (amount === undefined || Number.isNaN(numAmount) || numAmount < 0) {
      return res.status(400).json({ success: false, message: 'Số tiền ngân sách không hợp lệ' });
    }

    // Validate category if provided
    if (categoryId) {
      const category = await Category.findOne({ where: { id: categoryId, userId: req.user.id } });

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
    }

    const budget = await Budget.create({
      userId: req.user.id,
      categoryId: categoryId || null,
      categoryName: categoryName || null,
      amount: numAmount,
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

    const budget = await Budget.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!budget) return res.status(404).json({ success: false, message: 'Không tìm thấy ngân sách' });

    const updates = {};
    if (amount !== undefined) updates.amount = amount;
    if (period) updates.period = period;
    if (alertThresholds) updates.alertThresholds = alertThresholds;
    if (notificationEnabled !== undefined) updates.notificationEnabled = notificationEnabled;
    if (isActive !== undefined) updates.isActive = isActive;
    if (rolloverEnabled !== undefined) updates.rolloverEnabled = rolloverEnabled;

    await Budget.update(updates, { where: { id: req.params.id } });
    const updated = await Budget.findByPk(req.params.id, { raw: true });
    res.status(200).json({ success: true, message: 'Cập nhật ngân sách thành công', data: updated });
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
    const deleted = await Budget.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Không tìm thấy ngân sách' });
    res.status(200).json({ success: true, message: 'Xóa ngân sách thành công' });
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
    const userId = req.user.id;
    const budgets = (await Budget.findAll({ where: { userId, isActive: true }, order: [['categoryName','ASC']], raw: true })).map(normalizeBudgetRow);

    const getSpending = await buildSpendingLookup(userId, budgets);

    const statusList = budgets.map(b => {
      const currentSpending = getSpending(b);
      const effectiveAmount = b.amount + (b.rolloverAmount || 0);
      const alerts = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
      return {
        budgetId: b.id, categoryName: b.categoryName || 'Tổng',
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
    const userId = req.user.id;
    let budgets = (await Budget.findAll({ where: { userId, isActive: true, notificationEnabled: true }, raw: true })).map(normalizeBudgetRow);

    const getSpending = await buildSpendingLookup(userId, budgets);

    const alerts = [];
    budgets.forEach(b => {
      const currentSpending = getSpending(b);
      const effectiveAmount = b.amount + (b.rolloverAmount || 0);
      const alertInfo = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
      if (alertInfo.triggeredAlerts.length > 0) {
        alerts.push({
          budgetId: b.id, categoryName: b.categoryName || 'Tổng',
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
    console.error('getAlerts error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy cảnh báo', error: error.message });
  }
};

// @desc    Combined budgets + status + alerts in one call
// @route   GET /api/budgets/overview
// @access  Private
// lấy tổng quan ngân sách bao gồm danh sách ngân sách, trạng thái hiện tại (đã chi bao nhiêu, còn lại bao nhiêu, đã đạt được bao nhiêu phần trăm) và các cảnh báo đã kích hoạt nếu có, giúp người dùng có cái nhìn tổng thể về tình hình ngân sách của họ trong một lần gọi API duy nhất, từ đó dễ dàng theo dõi và quản lý tài chính cá nhân hiệu quả hơn.
export const getBudgetOverview = async (req, res) => {
  try {
    const userId = req.user.id;
    const now    = new Date();

    // Rollover check (same batch logic as getBudgets)
    const allBudgets = (await Budget.findAll({ where: { userId, isActive: true }, order: [['categoryName','ASC']], raw: true })).map(normalizeBudgetRow);

    const rolloverTargets = allBudgets.filter(b => b.rolloverEnabled && b.lastRolloverMonth !== currentPeriodKey(b.period, now));
    if (rolloverTargets.length > 0) {
      const byPeriod = {};
      rolloverTargets.forEach(b => { (byPeriod[b.period] ??= []).push(b); });
      const rolloverWrites = [];
      await Promise.all(Object.entries(byPeriod).map(async ([period, pBudgets]) => {
        const lastRange = getLastPeriodRange(period, now);
        const rows = await Transaction.findAll({
          where: { userId, type: 'expense', date: { [Op.between]: [lastRange.start, lastRange.end] } },
          attributes: ['category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
          group: ['category'],
          raw: true,
        });
        const catSpend = {}; let totalSpend = 0;
        rows.forEach(r => { catSpend[r.category] = parseFloat(r.total) || 0; totalSpend += parseFloat(r.total) || 0; });
        const periodKey = currentPeriodKey(period, now);
        pBudgets.forEach(b => {
          const lastSpending = b.categoryName ? (catSpend[b.categoryName] ?? 0) : totalSpend;
          const surplus = (b.amount + (b.rolloverAmount || 0)) - lastSpending;
          rolloverWrites.push({ id: b.id, rolloverAmount: surplus, lastRolloverMonth: periodKey });
        });
      }));
      if (rolloverWrites.length > 0) {
        await Promise.all(rolloverWrites.map(u => Budget.update({ rolloverAmount: u.rolloverAmount, lastRolloverMonth: u.lastRolloverMonth }, { where: { id: u.id } })));
        const writeMap = Object.fromEntries(rolloverWrites.map(u => [u.id, u]));
        allBudgets.forEach(b => { const u = writeMap[b.id]; if (u) { b.rolloverAmount = u.rolloverAmount; b.lastRolloverMonth = u.lastRolloverMonth; }});
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
        budgetId: b.id, categoryName: b.categoryName || 'Tổng',
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
        budgetId: b.id, categoryName: b.categoryName || 'Tổng',
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
