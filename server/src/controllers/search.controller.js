import { asyncHandler } from '../utils/asyncHandler.js';
import {
  globalSearchService,
  advancedSearchService,
  getSearchSuggestionsService
} from '../services/search.service.js';

/**
 * @desc    Global search sử dụng Sequelize/SQL Server
 * @route   GET /api/search
 * @access  Private
 * @query   q (search query), type (optional: transaction|category|budget|goal|debt|all)
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const data = await globalSearchService(req.user.id, req.query);

  res.json({ success: true, data });
});

/**
 * @desc    Advanced search với nhiều filters
 * @route   POST /api/search/advanced
 * @access  Private
 */
export const advancedSearch = asyncHandler(async (req, res) => {
  const data = await advancedSearchService(req.user.id, req.body);

  res.json({
    success: true,
    data: data.results,
    count: data.count
  });
});

/**
 * @desc    Quick search suggestions (autocomplete)
 * @route   GET /api/search/suggestions
 * @access  Private
 */
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const data = await getSearchSuggestionsService(req.user.id, req.query.q);

  res.json({
    success: true,
    data
  });
});
