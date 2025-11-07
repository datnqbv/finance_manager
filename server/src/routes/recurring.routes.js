import express from 'express';
import {
  getRecurringTransactions,
  getRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  executeRecurringTransaction,
  executePendingRecurringTransactions,
  getUpcomingRecurringTransactions
} from '../controllers/recurring.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Special routes
router.get('/upcoming', getUpcomingRecurringTransactions);
router.post('/execute-pending', executePendingRecurringTransactions);
router.post('/:id/execute', executeRecurringTransaction);

// CRUD operations
router.route('/')
  .get(getRecurringTransactions)
  .post(createRecurringTransaction);

router.route('/:id')
  .get(getRecurringTransaction)
  .put(updateRecurringTransaction)
  .delete(deleteRecurringTransaction);

export default router;
