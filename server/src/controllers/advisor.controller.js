import { asyncHandler } from '../utils/asyncHandler.js';
import * as advisorService from '../services/advisor.service.js';

// @desc    Get rule-based financial advice (50/30/20, anomalies, budget/goal pace warnings)
// @route   GET /api/advisor
// @access  Private
export const getFinancialAdvice = asyncHandler(async (req, res) => {
  const data = await advisorService.getFinancialAdvice(req.user.id, req.query);
  res.json({ success: true, data });
});
