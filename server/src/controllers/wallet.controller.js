import * as walletService from '../services/wallet.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Re-export helper function in case it is imported by other controllers/schedulers
export const recalculateWalletBalance = walletService.recalculateWalletBalance;

// @desc    Get all wallets
// @route   GET /api/wallets
// @access  Private
export const getWallets = asyncHandler(async (req, res) => {
  const wallets = await walletService.getWallets(req.user.id);
  res.json({
    success: true,
    count: wallets.length,
    data: wallets
  });
});

// @desc    Create a new wallet
// @route   POST /api/wallets
// @access  Private
export const createWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.createWallet(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Tạo ví thành công',
    data: wallet
  });
});

// @desc    Update a wallet
// @route   PUT /api/wallets/:id
// @access  Private
export const updateWallet = asyncHandler(async (req, res) => {
  const wallet = await walletService.updateWallet(req.user.id, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Cập nhật ví thành công',
    data: wallet
  });
});

// @desc    Delete a wallet (migrates transactions to default wallet)
// @route   DELETE /api/wallets/:id
// @access  Private
export const deleteWallet = asyncHandler(async (req, res) => {
  const fallbackWallet = await walletService.deleteWallet(req.user.id, req.params.id);
  res.json({
    success: true,
    message: `Xóa ví thành công. Tất cả giao dịch đã được chuyển sang ví "${fallbackWallet.name}".`
  });
});

// @desc    Transfer money between wallets
// @route   POST /api/wallets/transfer
// @access  Private
export const transferFunds = asyncHandler(async (req, res) => {
  const transferTx = await walletService.transferFunds(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Chuyển khoản thành công',
    data: transferTx
  });
});
