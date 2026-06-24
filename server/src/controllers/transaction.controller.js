import { asyncHandler } from '../utils/asyncHandler.js';
import * as transactionService from '../services/transaction.service.js';

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(req.user.id, req.query);
  res.json({
    success: true,
    ...result
  });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(req.user.id, req.params.id);
  res.json({
    success: true,
    data: transaction
  });
});

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Tạo giao dịch thành công',
    data: transaction
  });
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.updateTransaction(req.user.id, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Cập nhật thành công',
    data: transaction
  });
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(req.user.id, req.params.id);
  res.json({
    success: true,
    message: 'Xóa giao dịch thành công'
  });
});

// @desc    Tách giao dịch thành nhiều danh mục
// @route   POST /api/transactions/:id/split
// @access  Private
export const splitTransaction = asyncHandler(async (req, res) => {
  const result = await transactionService.splitTransaction(req.user.id, req.params.id, req.body.splits);
  res.status(201).json({
    success: true,
    message: 'Tách giao dịch thành công',
    data: result
  });
});

// @desc    Gỡ tách giao dịch
// @route   DELETE /api/transactions/:id/split
// @access  Private
export const unsplitTransaction = asyncHandler(async (req, res) => {
  await transactionService.unsplitTransaction(req.user.id, req.params.id);
  res.json({
    success: true,
    message: 'Đã gỡ tách giao dịch'
  });
});

// @desc    Bulk delete transactions
// @route   POST /api/transactions/bulk-delete
// @access  Private
export const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.bulkDeleteTransactions(req.user.id, req.body.ids);
  res.json({
    success: true,
    message: `Đã xóa ${result.deletedCount} giao dịch thành công`,
    data: result
  });
});

// @desc    Bulk update transactions
// @route   POST /api/transactions/bulk-update
// @access  Private
export const bulkUpdateTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.bulkUpdateTransactions(req.user.id, req.body.ids, req.body.updateData);
  res.json({
    success: true,
    message: `Đã cập nhật ${result.updatedCount} giao dịch thành công`,
    data: result
  });
});

// Export helper for use in other places (if needed)
export const checkBudgetAndNotify = transactionService.checkBudgetAndNotify;
