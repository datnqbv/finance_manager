import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction
} from '../controllers/recurring.controller.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecurringTransactions)
  .post(createRecurringTransaction);

router.route('/:id')
  .put(updateRecurringTransaction)
  .delete(deleteRecurringTransaction);

export default router;
