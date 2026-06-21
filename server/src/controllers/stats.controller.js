import { asyncHandler } from '../utils/asyncHandler.js';
import * as statsService from '../services/stats.service.js';

// @desc    Get monthly statistics
// @route   GET /api/stats/monthly
// @access  Private
export const getMonthlyStats = asyncHandler(async (req, res) => {
  const data = await statsService.getMonthlyStats(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Get summary statistics
// @route   GET /api/stats/summary
// @access  Private
export const getSummary = asyncHandler(async (req, res) => {
  const data = await statsService.getSummary(req.user.id);
  res.json({ success: true, data });
});

// @desc    Get category statistics
// @route   GET /api/stats/categories
// @access  Private
export const getCategoryStats = asyncHandler(async (req, res) => {
  const data = await statsService.getCategoryStats(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Compare statistics between periods
// @route   GET /api/stats/compare
// @access  Private
export const compareStats = asyncHandler(async (req, res) => {
  const data = await statsService.compareStats(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Forecast next month using XGBoost Machine Learning Model
// @route   GET /api/stats/forecast
// @access  Private
export const forecastSpending = asyncHandler(async (req, res) => {
  const data = await statsService.forecastSpending(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Analyze spending trends
// @route   GET /api/stats/trends
// @access  Private
export const analyzeTrends = asyncHandler(async (req, res) => {
  const data = await statsService.analyzeTrends(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Get top spending categories
// @route   GET /api/stats/top-categories
// @access  Private
export const getTopCategories = asyncHandler(async (req, res) => {
  const data = await statsService.getTopCategories(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Get daily statistics
// @route   GET /api/stats/daily
// @access  Private
export const getDailyStats = asyncHandler(async (req, res) => {
  const data = await statsService.getDailyStats(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Get weekly statistics
// @route   GET /api/stats/weekly
// @access  Private
export const getWeeklyStats = asyncHandler(async (req, res) => {
  const data = await statsService.getWeeklyStats(req.user.id, req.query);
  res.json({ success: true, data });
});

// @desc    Combined dashboard data
// @route   GET /api/stats/dashboard
// @access  Private
export const getDashboard = asyncHandler(async (req, res) => {
  const data = await statsService.getDashboard(req.user.id, req.query);
  res.json({ success: true, data });
});
