import {
  getRecurringTransactions as getRulesService,
  createRecurringTransaction as createRuleService,
  updateRecurringTransaction as updateRuleService,
  deleteRecurringTransaction as deleteRuleService
} from '../services/recurring.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all recurring transaction rules
// @route   GET /api/recurring-transactions
// @access  Private
export const getRecurringTransactions = asyncHandler(async (req, res) => {
  const result = await getRulesService(req.user.id, req.query);
  return res.json({
    success: true,
    ...result
  });
});

// @desc    Create recurring transaction rule
// @route   POST /api/recurring-transactions
// @access  Private
export const createRecurringTransaction = asyncHandler(async (req, res) => {
  const rule = await createRuleService(req.user.id, req.body);
  return res.status(201).json({
    success: true,
    message: 'Tạo thiết lập giao dịch định kỳ thành công',
    data: rule
  });
});

// @desc    Update recurring transaction rule (including pause/resume)
// @route   PUT /api/recurring-transactions/:id
// @access  Private
export const updateRecurringTransaction = asyncHandler(async (req, res) => {
  const rule = await updateRuleService(req.user.id, req.params.id, req.body);
  return res.json({
    success: true,
    message: 'Cập nhật giao dịch định kỳ thành công',
    data: rule
  });
});

// @desc    Delete recurring transaction rule
// @route   DELETE /api/recurring-transactions/:id
// @access  Private
export const deleteRecurringTransaction = asyncHandler(async (req, res) => {
  await deleteRuleService(req.user.id, req.params.id);
  return res.json({
    success: true,
    message: 'Xóa giao dịch định kỳ thành công'
  });
});
