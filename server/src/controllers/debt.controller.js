import * as debtService from '../services/debt.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/debts
export const getDebts = asyncHandler(async (req, res) => {
  const { debts, stats } = await debtService.getDebts(req.user.id, req.query);
  res.json({ success: true, data: debts, stats });
});

// POST /api/debts
export const createDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.createDebt(req.user.id, req.body);
  res.status(201).json({ success: true, message: 'Tạo khoản nợ thành công', data: debt });
});

// PUT /api/debts/:id
export const updateDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.updateDebt(req.user.id, req.params.id, req.body);
  res.json({ success: true, message: 'Cập nhật thành công', data: debt });
});

// DELETE /api/debts/:id
export const deleteDebt = asyncHandler(async (req, res) => {
  await debtService.deleteDebt(req.user.id, req.params.id);
  res.json({ success: true, message: 'Đã xóa khoản nợ' });
});

// POST /api/debts/:id/pay   — ghi nhận trả/thu một phần
export const addPayment = asyncHandler(async (req, res) => {
  const debt = await debtService.addPayment(req.user.id, req.params.id, req.body);
  res.json({
    success: true,
    message: debt.status === 'settled' ? '✅ Đã tất toán khoản nợ!' : 'Ghi nhận thanh toán thành công',
    data: debt
  });
});

// PATCH /api/debts/:id/settle  — đánh dấu tất toán thủ công
export const settleDebt = asyncHandler(async (req, res) => {
  const debt = await debtService.settleDebt(req.user.id, req.params.id);
  res.json({ success: true, message: 'Đã đánh dấu tất toán', data: debt });
});
