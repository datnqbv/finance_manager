import express from 'express';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  getAlerts,
  getBudgetOverview
} from '../controllers/budget.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkBudgetLimit } from '../middleware/vip.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes (must be before /:id)
router.get('/overview', getBudgetOverview);   // combined budgets + status + alerts
router.get('/status', getBudgetStatus);
router.get('/alerts', getAlerts);

// CRUD operations
router.route('/')
  .get(getBudgets)
  .post(checkBudgetLimit, createBudget);

router.route('/:id')
  .get(getBudget)
  .put(updateBudget)
  .delete(deleteBudget);

export default router;
