import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { vipController } from '../controllers/vip.controller.js';

const router = express.Router();

// Public routes for PayOS integration (No authentication required because it is a callback/webhook)
router.post('/payos-webhook', vipController.payosWebhook);

router.use(protect);

router.post('/order', vipController.createOrder);
router.get('/my-orders', vipController.getMyOrders);
router.get('/order/:id', vipController.getOrderStatus);
router.post('/cancel', vipController.cancelVip);
router.delete('/order/:id', vipController.deleteOrder);

// Admin-only routes
router.get('/orders', authorize('admin'), vipController.getOrders);
router.put('/order/:id/confirm', authorize('admin'), vipController.confirmOrder);

export default router;
