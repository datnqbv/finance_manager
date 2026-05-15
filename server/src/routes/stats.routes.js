import express from 'express';
import {
  getMonthlyStats,
  getSummary,
  getCategoryStats,
  compareStats,
  forecastSpending,
  analyzeTrends,
  getTopCategories,
  getDailyStats,
  getWeeklyStats,
  // getAIInsights,  // DISABLED - Not used by client
  getDashboard
} from '../controllers/stats.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/dashboard', getDashboard);   // combined endpoint - replaces multiple calls
router.get('/monthly', getMonthlyStats);
router.get('/summary', getSummary);
router.get('/categories', getCategoryStats);
router.get('/compare', compareStats);
router.get('/forecast', forecastSpending);
router.get('/trends', analyzeTrends);
router.get('/top-categories', getTopCategories);
router.get('/daily', getDailyStats);
router.get('/weekly', getWeeklyStats);
// router.get('/ai-insights', getAIInsights);  // DISABLED - Not used by client

export default router;
