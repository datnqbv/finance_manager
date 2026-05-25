
import { Transaction, Category, Budget, Goal, Debt, sequelize } from '../models/sequelize/index.js';
import { searchDocuments } from '../services/meilisearch.service.js';
import { Op } from 'sequelize';

/**
 * @desc    Global search sử dụng Sequelize/SQL Server
 * @route   GET /api/search
 * @access  Private
 * @query   q (search query), type (optional: transaction|category|budget|goal|debt|all)
 */
export const globalSearch = async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    const userId = req.user.id;

    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        data: {
          transactions: [],
          categories: [],
          budgets: [],
          goals: [],
          debts: [],
          total: 0
        }
      });
    }

    const searchQuery = q.trim();
    const results = {};

    // Cấu hình filter cho Meilisearch
    const searchOptions = {
      filter: [`userId = ${userId}`],
      limit: parseInt(limit) || 20
    };

    // 1. SEARCH TRANSACTIONS
    if (type === 'all' || type === 'transaction') {
      const msRes = await searchDocuments('transactions', searchQuery, searchOptions);
      results.transactions = msRes.hits || [];
    }

    // 2. SEARCH CATEGORIES
    if (type === 'all' || type === 'category') {
      const msRes = await searchDocuments('categories', searchQuery, searchOptions);
      results.categories = msRes.hits || [];
    }

    // 3. SEARCH BUDGETS
    if (type === 'all' || type === 'budget') {
      const msRes = await searchDocuments('budgets', searchQuery, searchOptions);
      results.budgets = msRes.hits || [];
    }

    // 4. SEARCH GOALS
    if (type === 'all' || type === 'goal') {
      const msRes = await searchDocuments('goals', searchQuery, searchOptions);
      results.goals = msRes.hits || [];
    }
    // 5. SEARCH DEBTS
    if (type === 'all' || type === 'debt') {
      const msRes = await searchDocuments('debts', searchQuery, searchOptions);
      results.debts = msRes.hits || [];
    }

    // Calculate total results
    const total = Object.values(results).reduce((sum, arr) => sum + (arr?.length || 0), 0);

    res.json({
      success: true,
      data: {
        ...results,
        total,
        query: searchQuery
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm: ' + error.message
    });
  }
};

/**
 * @desc    Advanced search với nhiều filters
 * @route   POST /api/search/advanced
 * @access  Private
 */
export const advancedSearch = async (req, res) => {
  try {
    const {
      query,
      type, // transaction, category, budget, goal
      filters = {}
    } = req.body;

    const userId = req.user.id;
    const searchRegex = new RegExp(query, 'i');

    let results = [];

    switch (type) {
      case 'transaction': {
        const filtersArray = [`userId = ${userId}`];
        if (filters.type) filtersArray.push(`type = "${filters.type}"`);
        if (filters.category) filtersArray.push(`category = "${filters.category}"`);
        // Note: Meilisearch numeric dates need to be UNIX timestamp. If date is not indexed as numeric in Meilisearch, filtering by date range won't work out of the box unless handled. 
        // For amounts:
        if (filters.minAmount) filtersArray.push(`amount >= ${filters.minAmount}`);
        if (filters.maxAmount) filtersArray.push(`amount <= ${filters.maxAmount}`);
        
        const msRes = await searchDocuments('transactions', query || '', {
          filter: filtersArray,
          limit: 50,
          sort: ['date:desc']
        });
        results = msRes.hits || [];
        break;
      }
      case 'budget': {
        const filtersArray = [`userId = ${userId}`];
        if (filters.isActive !== undefined) filtersArray.push(`isActive = ${filters.isActive}`);
        if (filters.period) filtersArray.push(`period = "${filters.period}"`);

        const msRes = await searchDocuments('budgets', query || '', {
          filter: filtersArray,
          limit: 50,
          sort: ['createdAt:desc']
        });
        results = msRes.hits || [];
        break;
      }
      default:
        return res.status(400).json({ success: false, message: 'Invalid search type' });
    }

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm nâng cao: ' + error.message
    });
  }
};

/**
 * @desc    Quick search suggestions (autocomplete)
 * @route   GET /api/search/suggestions
 * @access  Private
 */
export const getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchRegex = new RegExp('^' + q, 'i'); // Starts with

    // Category suggestions: fetch categories starting with query, dedupe and sort by frequency
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

    // Note suggestions: recent non-empty notes starting with q
    const notes = await Transaction.findAll({ where: { userId, note: { [Op.like]: `${q}%` }, note: { [Op.ne]: '' } }, attributes: ['note'], raw: true, limit: 50 });
    const noteCounts = {};
    for (const n of notes) { noteCounts[n.note] = (noteCounts[n.note] || 0) + 1; }
    const noteSuggestions = Object.entries(noteCounts).slice(0,3).map(([text,count]) => ({ text, type: 'note', count }));

    const suggestions = [...categorySuggestions, ...noteSuggestions];

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
