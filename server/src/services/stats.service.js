import { Transaction, Goal, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import * as ss from 'simple-statistics';
import ErrorResponse from '../utils/errorResponse.js';

export const getMonthlyStats = async (userId, query) => {
  const { year, month } = query;
  const targetYear = year ? parseInt(year) : new Date().getFullYear();
  const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const transactions = await Transaction.findAll({ where: { userId, date: { [Op.between]: [startDate, endDate] } }, raw: true });

  // Chỉ tính tổng thu/chi từ giao dịch gốc (không có parentId) để tránh đếm trùng
  const rootTransactions = transactions.filter(t => !t.parentId);
  const income = rootTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = rootTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  // Phân loại theo danh mục: dùng giao dịch con nếu cha đã tách, ngược lại dùng giao dịch gốc
  const splitParentIds = new Set(transactions.filter(t => t.parentId).map(t => t.parentId));
  const categoryTransactions = transactions.filter(t => {
    if (t.parentId) return true;
    return !splitParentIds.has(t.id);
  });
  const byCategory = categoryTransactions.reduce((acc, t) => {
    const cat = t.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { income: 0, expense: 0 };
    acc[cat][t.type] += Number(t.amount);
    return acc;
  }, {});

  return { period: { year: targetYear, month: targetMonth, startDate, endDate }, summary: { income, expense, balance: income - expense }, byCategory, transactions: transactions.length };
};

export const getSummary = async (userId) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Chỉ tính giao dịch gốc (parentId = null) cho tổng thu/chi
  const overallRows = await Transaction.findAll({ where: { userId, parentId: null }, attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']], group: ['type'], raw: true });
  const overallMap = {}; overallRows.forEach(r => overallMap[r.type] = r);
  const totalIncome = parseFloat(overallMap.income?.total || 0);
  const totalExpense = parseFloat(overallMap.expense?.total || 0);
  const totalCount = parseInt(overallMap.income?.count || 0) + parseInt(overallMap.expense?.count || 0);

  const monthlyRows = await Transaction.findAll({ where: { userId, parentId: null, date: { [Op.gte]: startOfMonth } }, attributes: ['type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: ['type'], raw: true });
  const monthlyMap = {}; monthlyRows.forEach(r => monthlyMap[r.type] = r);
  const monthlyIncome = parseFloat(monthlyMap.income?.total || 0);
  const monthlyExpense = parseFloat(monthlyMap.expense?.total || 0);

  const recent = await Transaction.findAll({ where: { userId, parentId: null }, order: [['date','DESC']], limit: 5, raw: true });

  return { overall: { totalIncome, totalExpense, balance: totalIncome - totalExpense, transactionCount: totalCount }, thisMonth: { income: monthlyIncome, expense: monthlyExpense, balance: monthlyIncome - monthlyExpense }, recentTransactions: recent };
};

export const getCategoryStats = async (userId, query) => {
  const { startDate, endDate } = query;
  const where = { userId };
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
  return Object.values(categoryStats).sort((a,b) => b.expense - a.expense);
};

export const compareStats = async (userId, query) => {
  const { type = 'month', periods = 6, refYear, refMonth } = query;
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

  let growth = { income: 0, expense: 0 };
  if (results.length >= 2) {
    const last = results[results.length - 1];
    const prev = results[results.length - 2];
    growth.income = prev.income > 0 ? +(((last.income - prev.income) / prev.income) * 100).toFixed(2) : 0;
    growth.expense = prev.expense > 0 ? +(((last.expense - prev.expense) / prev.expense) * 100).toFixed(2) : 0;
  }

  return { type, periods: results, growth };
};

export const analyzeTrends = async (userId, query) => {
  const { period = 12, refYear, refMonth } = query;
  const n = parseInt(period);
  const now = (refYear && refMonth)
    ? new Date(parseInt(refYear), parseInt(refMonth) - 1, 1)
    : new Date();
  
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - n + 1, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
  const monthFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%m', sequelize.col('date')) : sequelize.fn('MONTH', sequelize.col('date'));
  const rows = await Transaction.findAll({ where: { userId, date: { [Op.between]: [rangeStart, rangeEnd] } }, attributes: [[yearFn, 'year'], [monthFn, 'month'], 'type', [sequelize.fn('SUM', sequelize.col('amount')), 'total']], group: [yearFn, monthFn, 'type'], raw: true });
  
  const map = {};
  rows.forEach(r => { r.year = parseInt(r.year); r.month = parseInt(r.month); const key = `${r.year}-${r.month}`; if (!map[key]) map[key] = { income: 0, expense: 0 }; map[key][r.type] = parseFloat(r.total || 0); });
  
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
  
  const avgIncome = ss.mean(trends.map(t => t.income));
  const avgExpense = ss.mean(trends.map(t => t.expense));
  const avgSavings = ss.mean(trends.map(t => t.savings));
  
  const recentMonths = trends.slice(-3);
  const historicalMonths = trends.slice(0, -3);
  const recentAvg = ss.mean(recentMonths.map(t => t.expense));
  const historicalAvg = historicalMonths.length > 0 ? ss.mean(historicalMonths.map(t => t.expense)) : recentAvg;
  
  const expenseChange = historicalAvg > 0 ? +((recentAvg - historicalAvg) / historicalAvg * 100).toFixed(2) : 0;
  
  return {
    trends,
    analysis: {
      averageIncome: Math.round(avgIncome),
      averageExpense: Math.round(avgExpense),
      averageSavings: Math.round(avgSavings),
      recentExpenseChange: expenseChange,
      spendingTrend: expenseChange > 5 ? 'increasing' : expenseChange < -5 ? 'decreasing' : 'stable'
    }
  };
};

export const getTopCategories = async (userId, query) => {
  const { limit = 10, startDate, endDate, type = 'expense' } = query;
  const where = { userId, type };
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
  return { categories: formatted, totalAmount, type };
};

export const getDailyStats = async (userId, query) => {
  const { startDate, endDate } = query;
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  start.setHours(0, 0, 0, 0);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const transactions = await Transaction.findAll({ where: { userId, date: { [Op.between]: [start, end] } }, order: [['date','ASC']], raw: true });
  const dailyData = {};
  transactions.forEach(t => {
    const key = new Date(t.date).toISOString().split('T')[0];
    if (!dailyData[key]) dailyData[key] = { date: key, income: 0, expense: 0, transactions: 0 };
    dailyData[key][t.type] += Number(t.amount);
    dailyData[key].transactions++;
  });
  return Object.values(dailyData).map(day => ({ ...day, balance: day.income - day.expense }));
};

export const getWeeklyStats = async (userId, query) => {
  const { weeks = 12 } = query;
  const n = parseInt(weeks);
  const now = new Date();

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

  const getISOWeekKey = (d) => {
    const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
    const year = tmp.getUTCFullYear();
    const week = Math.ceil((((tmp - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
    return `${year}-${week}`;
  };

  return weekSlots.map(({ start, end }) => {
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
};

export const getDashboard = async (userId, query) => {
  const { startDate, endDate } = query;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const periodStart = startDate ? new Date(startDate) : startOfMonth;
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  periodEnd.setHours(23, 59, 59, 999);

  const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

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

  const catMap = {};
  periodRows.forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = { category: t.category, income: 0, expense: 0, count: 0 };
    catMap[t.category][t.type] += Number(t.amount);
    catMap[t.category].count++;
  });
  const categoryStats = Object.values(catMap).sort((a, b) => b.expense - a.expense);

  const lastMonthCatMap = {};
  lastMonthCatRows.forEach(r => {
    const cat = r.category;
    if (!lastMonthCatMap[cat]) lastMonthCatMap[cat] = { category: cat, income: 0, expense: 0, count: 0 };
    lastMonthCatMap[cat][r.type] += parseFloat(r.total || 0);
    lastMonthCatMap[cat].count += parseInt(r.count || 0);
  });
  const lastMonthCategoryStats = Object.values(lastMonthCatMap).sort((a, b) => b.expense - a.expense);

  const periodIncome = periodRows.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const periodExpense = periodRows.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const filteredSummary = {
    income: periodIncome,
    expense: periodExpense,
    balance: periodIncome - periodExpense,
    transactionCount: periodRows.length,
    recentTransactions: periodRows.slice(0, 5)
  };

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

  return {
    summary,
    filteredSummary,
    monthlyStats,
    categoryStats,
    lastMonthCategoryStats,
    dailyFluctuation: dailyArr,
    goals: goalsRows
  };
};
