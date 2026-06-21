import * as goalService from '../services/goal.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
export const getGoals = asyncHandler(async (req, res) => {
  const goalsData = await goalService.getGoals(req.user.id, req.query);
  res.json({
    success: true,
    count: goalsData.length,
    data: goalsData
  });
});

// @desc    Get single goal
// @route   GET /api/goals/:id
// @access  Private
export const getGoal = asyncHandler(async (req, res) => {
  const goalData = await goalService.getGoal(req.user.id, req.params.id);
  res.json({
    success: true,
    data: goalData
  });
});

// @desc    Create goal
// @route   POST /api/goals
// @access  Private
export const createGoal = asyncHandler(async (req, res) => {
  const goalData = await goalService.createGoal(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Tạo mục tiêu thành công',
    data: goalData
  });
});

// @desc    Update goal
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = asyncHandler(async (req, res) => {
  const goalData = await goalService.updateGoal(req.user.id, req.params.id, req.body);
  res.json({
    success: true,
    message: 'Cập nhật mục tiêu thành công',
    data: goalData
  });
});

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = asyncHandler(async (req, res) => {
  await goalService.deleteGoal(req.user.id, req.params.id);
  res.json({
    success: true,
    message: 'Xóa mục tiêu thành công'
  });
});

// @desc    Add amount to goal
// @route   POST /api/goals/:id/add-amount
// @access  Private
export const addAmountToGoal = asyncHandler(async (req, res) => {
  const result = await goalService.addAmountToGoal(req.user.id, req.params.id, req.body);
  res.json({
    success: true,
    message: result.isAchieved ? '🎉 Chúc mừng! Bạn đã đạt được mục tiêu!' : 'Thêm tiền thành công',
    data: result.data
  });
});

// @desc    Get goal statistics
// @route   GET /api/goals/stats
// @access  Private
export const getGoalStats = asyncHandler(async (req, res) => {
  const stats = await goalService.getGoalStats(req.user.id);
  res.json({
    success: true,
    data: stats
  });
});
