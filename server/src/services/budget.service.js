import { Budget, Transaction, Category, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import ErrorResponse from '../utils/errorResponse.js';

// ── Helpers ───────────────────────────────────────────────────────────

const checkAlertsInline = (alertThresholds, notificationEnabled, currentSpending, effectiveAmount) => {
  const pct = effectiveAmount > 0 ? (currentSpending / effectiveAmount) * 100 : 0;
  const thresholds = alertThresholds?.length ? alertThresholds : [80, 100, 120];
  const triggered = thresholds.filter(t => pct >= t && notificationEnabled !== false);
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

const getLastPeriodRange = (period, now = new Date()) => {
  const start = new Date(now);
  const end   = new Date(now);
  switch (period) {
    case 'monthly':
      start.setMonth(start.getMonth() - 1, 1);
      end.setDate(0);
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

  return (b) => {
    const { start, end } = getDateRange(b.period, b.startDate);
    const key = `${start.getTime()}-${end.getTime()}`;
    const { catSpend = {}, totalSpend = 0 } = spendingByKey[key] || {};
    return b.categoryName ? (catSpend[b.categoryName] ?? 0) : totalSpend;
  };
};

const calculateSpending = async (userId, categoryName, dateRange) => {
  const where = { userId, type: 'expense', date: { [Op.between]: [dateRange.start, dateRange.end] } };
  if (categoryName) where.category = categoryName;
  const rows = await Transaction.findAll({ where, attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']], raw: true });
  return rows && rows.length > 0 ? parseFloat(rows[0].total) || 0 : 0;
};

// ── Service Operations ──────────────────────────────────────────────────

/**
 * Get budgets list, handle rollover logic, calculate current spending
 */
export const getBudgets = async (userId) => {
  const now = new Date();
  let budgets = await Budget.findAll({ where: { userId, isActive: true }, order: [['categoryName', 'ASC']], raw: true });
  budgets = budgets.map(normalizeBudgetRow);

  // Rollover logic
  const rolloverTargets = budgets.filter(b =>
    b.rolloverEnabled && b.lastRolloverMonth !== currentPeriodKey(b.period, now)
  );

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
      budgets.forEach(b => {
        const u = writeMap[b.id];
        if (u) { b.rolloverAmount = u.rolloverAmount; b.lastRolloverMonth = u.lastRolloverMonth; }
      });
    }
  }

  const getSpending = await buildSpendingLookup(userId, budgets);

  return budgets.map(b => {
    const currentSpending = getSpending(b);
    const effectiveAmount = b.amount + (b.rolloverAmount || 0);
    const alerts = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
    return { ...b, effectiveAmount, currentSpending, ...alerts };
  });
};

/**
 * Get a single budget by ID with detail stats and recent transactions
 */
export const getBudget = async (userId, id) => {
  const budget = await Budget.findOne({ where: { id, userId }, raw: false });
  if (!budget) {
    throw new ErrorResponse('Không tìm thấy ngân sách', 404);
  }

  const dateRange = getDateRange(budget.period, budget.startDate);
  const currentSpending = await calculateSpending(userId, budget.categoryName, dateRange);

  const budgetObj = budget.get({ plain: true });
  const alerts = checkAlertsInline(budgetObj.alertThresholds, budgetObj.notificationEnabled, currentSpending, budgetObj.amount + (budgetObj.rolloverAmount || 0));

  const recentTransactions = await Transaction.findAll({
    where: { userId, type: 'expense', category: budgetObj.categoryName, date: { [Op.between]: [dateRange.start, dateRange.end] } },
    order: [['date', 'DESC']],
    limit: 10,
    raw: true
  });

  return {
    ...budgetObj,
    currentSpending,
    ...alerts,
    dateRange,
    recentTransactions
  };
};

/**
 * Create a new budget
 */
export const createBudget = async (userId, data) => {
  const { categoryId, categoryName, amount, period, alertThresholds, notificationEnabled } = data;

  const existingBudget = await Budget.findOne({
    where: { userId, categoryName: categoryName || null, period, isActive: true }
  });

  if (existingBudget) {
    throw new ErrorResponse(`Ngân sách ${period === 'monthly' ? 'tháng' : period === 'weekly' ? 'tuần' : 'năm'} cho ${categoryName || 'tổng'} đã tồn tại`, 400);
  }

  const numAmount = Number(amount);
  if (amount === undefined || Number.isNaN(numAmount) || numAmount < 0) {
    throw new ErrorResponse('Số tiền ngân sách không hợp lệ', 400);
  }

  if (categoryId) {
    const category = await Category.findOne({ where: { id: categoryId, userId } });
    if (!category) {
      throw new ErrorResponse('Không tìm thấy danh mục', 404);
    }
  }

  return await Budget.create({
    userId,
    categoryId: categoryId || null,
    categoryName: categoryName || null,
    amount: numAmount,
    period: period || 'monthly',
    alertThresholds: alertThresholds || [80, 100, 120],
    notificationEnabled: notificationEnabled !== false
  });
};

/**
 * Update budget
 */
export const updateBudget = async (userId, id, data) => {
  const { amount, period, alertThresholds, notificationEnabled, isActive, rolloverEnabled } = data;
  const budget = await Budget.findOne({ where: { id, userId } });
  if (!budget) {
    throw new ErrorResponse('Không tìm thấy ngân sách', 404);
  }

  const updates = {};
  if (amount !== undefined) updates.amount = amount;
  if (period) updates.period = period;
  if (alertThresholds) updates.alertThresholds = alertThresholds;
  if (notificationEnabled !== undefined) updates.notificationEnabled = notificationEnabled;
  if (isActive !== undefined) updates.isActive = isActive;
  if (rolloverEnabled !== undefined) updates.rolloverEnabled = rolloverEnabled;

  await Budget.update(updates, { where: { id } });
  return await Budget.findByPk(id, { raw: true });
};

/**
 * Delete budget
 */
export const deleteBudget = async (userId, id) => {
  const deleted = await Budget.destroy({ where: { id, userId } });
  if (!deleted) {
    throw new ErrorResponse('Không tìm thấy ngân sách', 404);
  }
  return true;
};

/**
 * Get budget status details and summary stats
 */
export const getBudgetStatus = async (userId) => {
  const budgets = (await Budget.findAll({ where: { userId, isActive: true }, order: [['categoryName', 'ASC']], raw: true })).map(normalizeBudgetRow);
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

  const totalBudget   = budgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
  const totalSpending = statusList.reduce((s, b) => s + b.currentSpending, 0);
  const overBudgetCount = statusList.filter(b => b.isOverBudget).length;

  return {
    budgets: statusList,
    summary: { totalBudget, totalSpending, totalRemaining: totalBudget - totalSpending, overBudgetCount, percentage: totalBudget > 0 ? Math.round((totalSpending / totalBudget) * 100) : 0 }
  };
};

/**
 * Get all triggered alerts
 */
export const getAlerts = async (userId) => {
  const budgets = (await Budget.findAll({ where: { userId, isActive: true, notificationEnabled: true }, raw: true })).map(normalizeBudgetRow);
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

  return alerts;
};

/**
 * Get budgets combined overview
 */
export const getBudgetOverview = async (userId) => {
  const now = new Date();
  const allBudgets = (await Budget.findAll({ where: { userId, isActive: true }, order: [['categoryName', 'ASC']], raw: true })).map(normalizeBudgetRow);

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

  const getSpending = await buildSpendingLookup(userId, allBudgets);

  const budgetsWithSpending = allBudgets.map(b => {
    const currentSpending = getSpending(b);
    const effectiveAmount = b.amount + (b.rolloverAmount || 0);
    const alerts = checkAlertsInline(b.alertThresholds, b.notificationEnabled, currentSpending, effectiveAmount);
    return { ...b, effectiveAmount, currentSpending, ...alerts };
  });

  const totalBudget   = allBudgets.reduce((s, b) => s + parseFloat(b.amount || 0), 0);
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

  return {
    budgets: budgetsWithSpending,
    status,
    alerts: triggeredAlerts
  };
};
