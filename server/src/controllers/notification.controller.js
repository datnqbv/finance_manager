import {
  getNotificationsService,
  markAsReadService,
  markAllAsReadService,
  deleteNotificationService,
  deleteAllNotificationsService,
  registerSseClient,
  pushNotificationToUser
} from '../services/notification.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Re-export pushNotificationToUser in case any other controllers still import it from here.
export { pushNotificationToUser };

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Private
// Lấy thông báo cho người dùng
export const getNotifications = asyncHandler(async (req, res) => {
  const result = await getNotificationsService(req.user.id, req.query);
  res.json({
    success: true,
    data: result
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await markAsReadService(req.user.id, req.params.id);
  res.json({ success: true, message: 'Đã đánh dấu đã đọc', data: notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  await markAllAsReadService(req.user.id);
  res.json({
    success: true,
    message: 'Đã đánh dấu tất cả đã đọc'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  await deleteNotificationService(req.user.id, req.params.id);
  res.json({ success: true, message: 'Đã xóa thông báo' });
});

// @desc    Delete all notifications
// @route   DELETE /api/notifications/all
// @access  Private
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  await deleteAllNotificationsService(req.user.id);
  res.json({
    success: true,
    message: 'Đã xóa tất cả thông báo'
  });
});

// @desc    SSE stream - real-time notification push
// @route   GET /api/notifications/stream
// @access  Private
export const streamNotifications = asyncHandler(async (req, res) => {
  await registerSseClient(req.user.id, req, res);
});
