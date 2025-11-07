import express from 'express';
import {
  getMonthlyStats,
  getSummary,
  getCategoryStats
} from '../controllers/stats.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/monthly', getMonthlyStats);
router.get('/summary', getSummary);
router.get('/categories', getCategoryStats);

export default router;
