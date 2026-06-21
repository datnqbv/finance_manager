import { Transaction, Category, Budget, Goal, Debt, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import { getSearchCondition } from '../utils/fts.js';
import ErrorResponse from '../utils/errorResponse.js';

export const globalSearchService = async (userId, queryOptions) => {
  const { q, type = 'all', limit = 20 } = queryOptions;

  if (!q || q.trim() === '') {
    return {
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      debts: [],
      total: 0
    };
  }

  const searchQuery = q.trim();
  const results = {};

  // 1. SEARCH TRANSACTIONS
  if (type === 'all' || type === 'transaction') {
    const whereTx = { userId };
    whereTx[Op.and] = [getSearchCondition(['category', 'note'], searchQuery)];
    const txs = await Transaction.findAll({ where: whereTx, limit: parseInt(limit) || 20, raw: true });
    results.transactions = txs;
  }

  // 2. SEARCH CATEGORIES
  if (type === 'all' || type === 'category') {
    const whereCat = { userId };
    whereCat[Op.and] = [getSearchCondition('name', searchQuery)];
    const cats = await Category.findAll({ where: whereCat, limit: parseInt(limit) || 20, raw: true });
    results.categories = cats;
  }

  // 3. SEARCH BUDGETS
  if (type === 'all' || type === 'budget') {
    const whereBud = { userId };
    whereBud[Op.and] = [getSearchCondition('categoryName', searchQuery)];
    const buds = await Budget.findAll({ where: whereBud, limit: parseInt(limit) || 20, raw: true });
    results.budgets = buds;
  }

  // 4. SEARCH GOALS
  if (type === 'all' || type === 'goal') {
    const whereGoal = { userId };
    whereGoal[Op.and] = [getSearchCondition(['name', 'description'], searchQuery)];
    const goals = await Goal.findAll({ where: whereGoal, limit: parseInt(limit) || 20, raw: true });
    results.goals = goals;
  }

  // 5. SEARCH DEBTS
  if (type === 'all' || type === 'debt') {
    const whereDebt = { userId };
    whereDebt[Op.and] = [getSearchCondition(['personName', 'description'], searchQuery)];
    const debtsRes = await Debt.findAll({ where: whereDebt, limit: parseInt(limit) || 20, raw: true });
    results.debts = debtsRes;
  }

  const total = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return { ...results, total, query: searchQuery };
};

export const advancedSearchService = async (userId, searchInput) => {
  const {
    query,
    type,
    filters = {}
  } = searchInput;

  let results = [];

  switch (type) {
    case 'transaction': {
      const where = { userId };
      if (filters.type) where.type = filters.type;
      if (filters.category) {
        if (sequelize.options.dialect === 'mssql') {
          const escaped = filters.category.replace(/'/g, "''");
          where.category = sequelize.literal(`category LIKE N'%${escaped}%' COLLATE Latin1_General_CI_AI`);
        } else {
          where.category = { [Op.like]: `%${filters.category}%` };
        }
      }
      if (filters.minAmount) where.amount = { ...(where.amount || {}), [Op.gte]: filters.minAmount };
      if (filters.maxAmount) where.amount = { ...(where.amount || {}), [Op.lte]: filters.maxAmount };
      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          const start = new Date(filters.startDate);
          start.setHours(0, 0, 0, 0);
          where.date[Op.gte] = start;
        }
        if (filters.endDate) {
          const end = new Date(filters.endDate);
          end.setHours(23, 59, 59, 999);
          where.date[Op.lte] = end;
        }
      }

      if (query && query.trim()) {
        where[Op.and] = [getSearchCondition(['category', 'note'], query)];
      }

      const txs = await Transaction.findAll({ where, limit: 50, order: [['date','DESC']], raw: true });
      results = txs || [];
      break;
    }
    case 'budget': {
      const where = { userId };
      if (filters.isActive !== undefined) where.isActive = filters.isActive;
      if (filters.period) where.period = filters.period;
      if (query && query.trim()) {
        where[Op.and] = [getSearchCondition('categoryName', query)];
      }

      const buds = await Budget.findAll({ where, limit: 50, order: [['createdAt','DESC']], raw: true });
      results = buds || [];
      break;
    }
    default:
      throw new ErrorResponse('Invalid search type', 400);
  }

  return {
    results,
    count: results.length
  };
};

export const getSearchSuggestionsService = async (userId, q) => {
  if (!q || q.length < 2) {
    return [];
  }

  const txs = await Transaction.findAll({ where: { userId, category: { [Op.like]: `${q}%` } }, attributes: ['category', 'amount'], raw: true, limit: 200 });
  const counts = {};
  for (const t of txs) {
    if (!t.category) continue;
    counts[t.category] = counts[t.category] ? counts[t.category] + 1 : 1;
  }
  const categorySuggestions = Object.entries(counts)
    .sort((a,b) => b[1] - a[1])
    .slice(0,5)
    .map(([text,count]) => ({ text, type: 'category', count }));

  const notes = await Transaction.findAll({ where: { userId, note: { [Op.like]: `${q}%` }, note: { [Op.ne]: '' } }, attributes: ['note'], raw: true, limit: 50 });
  const noteCounts = {};
  for (const n of notes) { noteCounts[n.note] = (noteCounts[n.note] || 0) + 1; }
  const noteSuggestions = Object.entries(noteCounts).slice(0,3).map(([text,count]) => ({ text, type: 'note', count }));

  return [...categorySuggestions, ...noteSuggestions];
};
