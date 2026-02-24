import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getDebts,
  createDebt,
  updateDebt,
  deleteDebt,
  addPayment,
  settleDebt
} from '../controllers/debt.controller.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getDebts).post(createDebt);
router.route('/:id').put(updateDebt).delete(deleteDebt);
router.post('/:id/pay', addPayment);
router.patch('/:id/settle', settleDebt);

export default router;
