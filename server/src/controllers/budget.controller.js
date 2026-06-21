import * as budgetService from '../services/budget.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all budgets for user with current spending
// @route   GET /api/budgets
// @access  Private
export const getBudgets = asyncHandler(async (req, res) => {
  const result = await budgetService.getBudgets(req.user.id);
  res.json({ success: true, count: result.length, data: result });
});

// @desc    Get single budget with details
// @route   GET /api/budgets/:id
// @access  Private
export const getBudget = asyncHandler(async (req, res) => {
  const budgetData = await budgetService.getBudget(req.user.id, req.params.id);
  res.json({
    success: true,
    data: budgetData
  });
});

// @desc    Create new budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Tạo ngân sách thành công',
    data: budget
  });
});

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = asyncHandler(async (req, res) => {
  const updated = await budgetService.updateBudget(req.user.id, req.params.id, req.body);
  res.json({ success: true, message: 'Cập nhật ngân sách thành công', data: updated });
});

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = asyncHandler(async (req, res) => {
  await budgetService.deleteBudget(req.user.id, req.params.id);
  res.json({ success: true, message: 'Xóa ngân sách thành công' });
});

// @desc    Get budget status/overview
// @route   GET /api/budgets/status
// @access  Private
export const getBudgetStatus = asyncHandler(async (req, res) => {
  const data = await budgetService.getBudgetStatus(req.user.id);
  res.json({
    success: true,
    data
  });
});

// @desc    Check and get triggered alerts
// @route   GET /api/budgets/alerts
// @access  Private
export const getAlerts = asyncHandler(async (req, res) => {
  const alerts = await budgetService.getAlerts(req.user.id);
  res.json({ success: true, count: alerts.length, data: alerts });
});

// @desc    Combined budgets + status + alerts in one call
// @route   GET /api/budgets/overview
// @access  Private
export const getBudgetOverview = asyncHandler(async (req, res) => {
  const data = await budgetService.getBudgetOverview(req.user.id);
  res.json({
    success: true,
    data
  });
});
