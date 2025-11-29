import express from 'express';
import { globalSearch, advancedSearch, getSearchSuggestions } from '../controllers/search.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// @route   GET /api/search?q=query&type=all&limit=20
// @desc    Global search across all collections
// @access  Private
router.get('/', globalSearch);

// @route   POST /api/search/advanced
// @desc    Advanced search with multiple filters
// @access  Private
router.post('/advanced', advancedSearch);

// @route   GET /api/search/suggestions?q=query
// @desc    Get search suggestions for autocomplete
// @access  Private
router.get('/suggestions', getSearchSuggestions);

export default router;
