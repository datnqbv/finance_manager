
import Transaction from '../models/Transaction.model.js';
import Category from '../models/Category.model.js';
import Budget from '../models/Budget.model.js';
import Goal from '../models/Goal.model.js';
import Debt from '../models/Debt.model.js';

/**
 * @desc    Global search sử dụng MongoDB Aggregation Pipeline
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

    // Tạo regex cho tìm kiếm không phân biệt hoa thường và dấu
    const searchRegex = new RegExp(searchQuery, 'i');

    // 1. SEARCH TRANSACTIONS - Sử dụng Aggregation Pipeline
    if (type === 'all' || type === 'transaction') {
      results.transactions = await Transaction.aggregate([
        {
          // Stage 1: nhóm các transaction của user và lọc theo truy vấn tìm kiếm
          $match: {
            userId: req.user._id,
            $or: [
              { category: { $regex: searchRegex } },
              { note: { $regex: searchRegex } },
              { amount: { $eq: parseFloat(searchQuery) || 0 } }
            ]
          }
        },
        {
          // Stage 2: thêm trường relevanceScore dựa trên mức độ phù hợp của kết quả với truy vấn tìm kiếm
          $addFields: {
            relevanceScore: {
              $add: [
                // Category exact match: +10
                { $cond: [{ $eq: ['$category', searchQuery] }, 10, 0] },
                // Category contains: +5
                { $cond: [{ $regexMatch: { input: '$category', regex: searchRegex } }, 5, 0] },
                // Note contains: +3
                { $cond: [{ $regexMatch: { input: '$note', regex: searchRegex } }, 3, 0] },
                // Amount match: +2
                { $cond: [{ $eq: ['$amount', parseFloat(searchQuery) || 0] }, 2, 0] }
              ]
            },
            dateFormatted: {
              $dateToString: { format: '%d/%m/%Y', date: '$date' }
            }
          }
        },
        {
          // Stage 3: sắp xếp kết quả theo relevanceScore giảm dần, sau đó theo date giảm dần
          $sort: { relevanceScore: -1, date: -1 }
        },
        {
          // Stage 4: Limit kết quả trả về
          $limit: parseInt(limit)
        },
        {
          // Stage 5: Chọn trường cần thiết để trả về
          $project: {
            type: 1,
            category: 1,
            amount: 1,
            note: 1,
            date: 1,
            dateFormatted: 1,
            relevanceScore: 1,
            createdAt: 1
          }
        }
      ]);
    }

    // 2. SEARCH CATEGORIES
    if (type === 'all' || type === 'category') {
      results.categories = await Category.aggregate([
        {
          $match: {
            userId: req.user._id,
            $or: [
              { name: { $regex: searchRegex } },
              { description: { $regex: searchRegex } }
            ]
          }
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                { $cond: [{ $eq: ['$name', searchQuery] }, 10, 0] },
                { $cond: [{ $regexMatch: { input: '$name', regex: searchRegex } }, 5, 0] }
              ]
            }
          }
        },
        {
          $sort: { relevanceScore: -1, order: 1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }

    // 3. SEARCH BUDGETS
    if (type === 'all' || type === 'budget') {
      results.budgets = await Budget.aggregate([
        {
          $match: {
            userId: req.user._id,
            $or: [
              { category: { $regex: searchRegex } },
              { name: { $regex: searchRegex } }
            ]
          }
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                { $cond: [{ $eq: ['$category', searchQuery] }, 10, 0] },
                { $cond: [{ $regexMatch: { input: '$category', regex: searchRegex } }, 5, 0] }
              ]
            },
            // Tính spending percentage
            spentPercentage: {
              $multiply: [
                { $divide: ['$spent', '$limit'] },
                100
              ]
            }
          }
        },
        {
          $sort: { relevanceScore: -1, createdAt: -1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }

    // 4. SEARCH GOALS
    if (type === 'all' || type === 'goal') {
      results.goals = await Goal.aggregate([
        {
          $match: {
            userId: req.user._id,
            $or: [
              { name: { $regex: searchRegex } },
              { description: { $regex: searchRegex } }
            ]
          }
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                { $cond: [{ $eq: ['$name', searchQuery] }, 10, 0] },
                { $cond: [{ $regexMatch: { input: '$name', regex: searchRegex } }, 5, 0] }
              ]
            },
            // Tính progress percentage
            progressPercentage: {
              $multiply: [
                { $divide: ['$currentAmount', '$targetAmount'] },
                100
              ]
            },
            // Tính days remaining
            daysRemaining: {
              $dateDiff: {
                startDate: new Date(),
                endDate: '$deadline',
                unit: 'day'
              }
            }
          }
        },
        {
          $sort: { relevanceScore: -1, deadline: 1 }
        },
        {
          $limit: parseInt(limit)
        }
      ]);
    }
    // 5. SEARCH DEBTS
    if (type === 'all' || type === 'debt') {
      const parsedAmount = parseFloat(searchQuery);
      const isAmountQuery = !Number.isNaN(parsedAmount);

      results.debts = await Debt.aggregate([
        {
          $match: {
            userId: req.user._id,
            $or: [
              { personName: { $regex: searchRegex } },
              { description: { $regex: searchRegex } },
              ...(isAmountQuery ? [{ amount: { $eq: parsedAmount } }, { remainingAmount: { $eq: parsedAmount } }] : [])
            ]
          }
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                { $cond: [{ $eq: ['$personName', searchQuery] }, 10, 0] },
                { $cond: [{ $regexMatch: { input: '$personName', regex: searchRegex } }, 5, 0] },
                { $cond: [{ $regexMatch: { input: '$description', regex: searchRegex } }, 3, 0] },
                ...(isAmountQuery ? [
                  { $cond: [{ $eq: ['$amount', parsedAmount] }, 2, 0] },
                  { $cond: [{ $eq: ['$remainingAmount', parsedAmount] }, 2, 0] }
                ] : []),
                { $cond: [{ $eq: ['$type', 'lend'] }, 1, 0] }
              ]
            },
            dueDateFormatted: {
              $cond: [
                { $ifNull: ['$dueDate', false] },
                { $dateToString: { format: '%d/%m/%Y', date: '$dueDate' } },
                null
              ]
            }
          }
        },
        {
          $sort: { relevanceScore: -1, createdAt: -1 }
        },
        {
          $limit: parseInt(limit)
        },
        {
          $project: {
            type: 1,
            personName: 1,
            amount: 1,
            remainingAmount: 1,
            description: 1,
            dueDate: 1,
            dueDateFormatted: 1,
            status: 1,
            relevanceScore: 1,
            createdAt: 1
          }
        }
      ]);
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
      case 'transaction':
        const transactionMatch = {
          userId: req.user._id
        };

        // Add search query
        if (query) {
          transactionMatch.$or = [
            { category: { $regex: searchRegex } },
            { note: { $regex: searchRegex } }
          ];
        }

        // Add filters
        if (filters.type) transactionMatch.type = filters.type;
        if (filters.category) transactionMatch.category = filters.category;
        if (filters.startDate || filters.endDate) {
          transactionMatch.date = {};
          if (filters.startDate) transactionMatch.date.$gte = new Date(filters.startDate);
          if (filters.endDate) transactionMatch.date.$lte = new Date(filters.endDate);
        }
        if (filters.minAmount) transactionMatch.amount = { $gte: parseFloat(filters.minAmount) };
        if (filters.maxAmount) {
          transactionMatch.amount = transactionMatch.amount || {};
          transactionMatch.amount.$lte = parseFloat(filters.maxAmount);
        }

        results = await Transaction.aggregate([
          { $match: transactionMatch },
          {
            $addFields: {
              relevanceScore: {
                $cond: [
                  { $regexMatch: { input: '$category', regex: searchRegex } },
                  10,
                  5
                ]
              }
            }
          },
          { $sort: { relevanceScore: -1, date: -1 } },
          { $limit: 50 }
        ]);
        break;

      case 'budget':
        const budgetMatch = {
          userId: req.user._id
        };

        if (query) {
          budgetMatch.$or = [
            { category: { $regex: searchRegex } },
            { name: { $regex: searchRegex } }
          ];
        }

        if (filters.isActive !== undefined) budgetMatch.isActive = filters.isActive;
        if (filters.period) budgetMatch.period = filters.period;

        results = await Budget.aggregate([
          { $match: budgetMatch },
          {
            $addFields: {
              spentPercentage: {
                $multiply: [{ $divide: ['$spent', '$limit'] }, 100]
              }
            }
          },
          { $sort: { createdAt: -1 } },
          { $limit: 50 }
        ]);
        break;

      // Add more cases for other types...
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid search type'
        });
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

    // Get unique categories from transactions
    const categorySuggestions = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          category: { $regex: searchRegex }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          text: '$_id',
          type: 'category',
          count: 1,
          totalAmount: 1
        }
      }
    ]);

    // Get recent notes
    const noteSuggestions = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          note: { $regex: searchRegex, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$note',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 3
      },
      {
        $project: {
          _id: 0,
          text: '$_id',
          type: 'note',
          count: 1
        }
      }
    ]);

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
