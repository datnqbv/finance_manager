import express from 'express';
import {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
  transferFunds
} from '../controllers/wallet.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Transfer funds between wallets
router.post('/transfer', transferFunds);

// Wallet CRUD
router.route('/')
  .get(getWallets)
  .post(createWallet);

router.route('/:id')
  .put(updateWallet)
  .delete(deleteWallet);

export default router;
