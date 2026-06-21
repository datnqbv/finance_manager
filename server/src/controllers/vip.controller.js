import { asyncHandler } from '../utils/asyncHandler.js';
import * as vipService from '../services/vip.service.js';

function getClientOrigin(req) {
  if (req.headers.referer) {
    try {
      const url = new URL(req.headers.referer);
      return url.origin;
    } catch (e) {
      // ignore
    }
  }
  if (req.headers.origin) {
    return req.headers.origin;
  }
  return 'http://localhost:5173';
}

export const vipController = {
  // Create VIP Order
  createOrder: asyncHandler(async (req, res) => {
    const clientOrigin = getClientOrigin(req);
    const data = await vipService.createOrder(req.user.id, req.body, clientOrigin);
    res.status(201).json({
      success: true,
      message: 'Tạo đơn đăng ký VIP thành công',
      data
    });
  }),

  // Admin Manual Approve
  confirmOrder: asyncHandler(async (req, res) => {
    await vipService.confirmOrder(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Đã xác nhận thanh toán và kích hoạt VIP thành công!'
    });
  }),

  // Get orders list (Admin only)
  getOrders: asyncHandler(async (req, res) => {
    const data = await vipService.getOrders();
    res.status(200).json({
      success: true,
      data
    });
  }),

  // Get specific order status (Authenticated user)
  getOrderStatus: asyncHandler(async (req, res) => {
    const data = await vipService.getOrderStatus(req.user.id, req.params.id);
    res.status(200).json({
      success: true,
      data
    });
  }),

  // Get user VIP orders history (Authenticated user)
  getMyOrders: asyncHandler(async (req, res) => {
    const data = await vipService.getMyOrders(req.user.id);
    res.status(200).json({
      success: true,
      data
    });
  }),

  // Cancel VIP membership status (Authenticated user)
  cancelVip: asyncHandler(async (req, res) => {
    const data = await vipService.cancelVip(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Đã hủy tư cách thành viên VIP thành công!',
      data
    });
  }),

  // Delete order (Rejects order log for admin, cancels pending order for user)
  deleteOrder: asyncHandler(async (req, res) => {
    await vipService.deleteOrder(req.user.id, req.user.role, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Xóa đơn hàng thành công!'
    });
  }),

  // PayOS Webhook (POST /api/vip/payos-webhook)
  payosWebhook: asyncHandler(async (req, res) => {
    const data = await vipService.payosWebhook(req.body);
    res.status(200).json(data);
  })
};
