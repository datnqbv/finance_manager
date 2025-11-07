import express from 'express';
import {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  getAlerts
} from '../controllers/budget.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes
router.get('/status', getBudgetStatus);
router.get('/alerts', getAlerts);

// CRUD operations
router.route('/')
  .get(getBudgets)
  .post(createBudget);

router.route('/:id')
  .get(getBudget)
  .put(updateBudget)
  .delete(deleteBudget);

export default router;
