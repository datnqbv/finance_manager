import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  splitTransaction,
  unsplitTransaction,
  bulkDeleteTransactions,
  bulkUpdateTransactions
} from '../controllers/transaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkTransactionLimit } from '../middleware/vip.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(checkTransactionLimit, createTransaction);

router.post('/bulk-delete', bulkDeleteTransactions);
router.post('/bulk-update', bulkUpdateTransactions);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

// Tách / gỡ tách giao dịch
router.route('/:id/split')
  .post(splitTransaction)
  .delete(unsplitTransaction);

export default router;
