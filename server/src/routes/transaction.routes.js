import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../controllers/transaction.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { checkTransactionLimit } from '../middleware/vip.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(checkTransactionLimit, createTransaction);

router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;
