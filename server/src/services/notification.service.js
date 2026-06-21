import { Notification, Goal } from '../models/sequelize/index.js';
import ErrorResponse from '../utils/errorResponse.js';

// Map lưu các SSE connection theo userId (mỗi user có thể có nhiều tab/connection)
export const sseClients = new Map(); // userId -> Set of res objects

// Gửi push notification qua SSE tới tất cả connection của 1 user
export const pushNotificationToUser = (userId, data) => {
  const clients = sseClients.get(String(userId));
  if (!clients || clients.size === 0) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch (_) { clients.delete(res); }
  }
};

// Hàm định dạng thời gian đã trôi qua
const getTimeAgo = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) {
    return `${minutes} phút trước`;
  } else if (hours < 24) {
    return `${hours} giờ trước`;
  } else {
    return `${days} ngày trước`;
  }
};

export const getNotificationsService = async (userId, queryOptions) => {
  const { limit = 20, skip = 0, read } = queryOptions;
  
  // Build query
  const query = { userId };
  if (read !== undefined) {
    query.read = read === 'true';
  }

  // Lấy thông báo từ database
  const dbNotifications = await Notification.findAll({ 
    where: query, 
    order: [['createdAt','DESC']], 
    limit: parseInt(limit), 
    offset: parseInt(skip), 
    raw: true 
  });

  // Format thông báo
  const formattedNotifications = dbNotifications.map(notif => {
    const timeAgo = getTimeAgo(notif.createdAt);
    return {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      time: timeAgo,
      read: !!notif.read,
      createdAt: notif.createdAt,
      relatedId: notif.relatedId,
      relatedModel: notif.relatedModel,
      metadata: notif.metadata
    };
  });

  // Đếm số thông báo chưa đọc
  const unreadCount = await Notification.count({ where: { userId, read: false } });

  // Tạo thêm các thông báo tự động từ goals
  const autoNotifications = [];
  const notificationIds = new Set();

  // 1. Kiểm tra các mục tiêu
  const goals = await Goal.findAll({ where: { userId }, raw: true });

  for (const goal of goals) {
    const percentage = (goal.currentAmount / goal.targetAmount) * 100;

    if (percentage >= 100 && goal.status !== 'completed') {
      const notifId = `goal-completed-${goal.id}`;
      if (!notificationIds.has(notifId)) {
        notificationIds.add(notifId);
        autoNotifications.push({
          id: notifId,
          type: 'success',
          title: 'Hoàn thành mục tiêu',
          message: `Chúc mừng! Bạn đã đạt được mục tiêu "${goal.name}"`,
          time: getTimeAgo(goal.updatedAt),
          read: false,
          createdAt: goal.updatedAt
        });
      }
    } else if (percentage >= 80 && percentage < 100) {
      const notifId = `goal-progress-${goal.id}`;
      if (!notificationIds.has(notifId)) {
        notificationIds.add(notifId);
        autoNotifications.push({
          id: notifId,
          type: 'info',
          title: 'Gần đạt mục tiêu',
          message: `Mục tiêu "${goal.name}": ${percentage.toFixed(0)}% (${goal.currentAmount.toLocaleString('vi-VN')}/${goal.targetAmount.toLocaleString('vi-VN')} ₫)`,
          time: getTimeAgo(goal.updatedAt),
          read: false,
          createdAt: goal.updatedAt
        });
      }
    }
  }

  // Kết hợp notifications từ DB và auto notifications
  const allNotifications = [...formattedNotifications, ...autoNotifications];
  
  // Sắp xếp theo thời gian
  allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    notifications: allNotifications,
    unreadCount: unreadCount
  };
};

export const markAsReadService = async (userId, notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new ErrorResponse('Không tìm thấy thông báo', 404);
  }
  if (notification.userId !== userId) {
    throw new ErrorResponse('Không có quyền truy cập', 403);
  }
  await notification.update({ read: true });
  return notification;
};

export const markAllAsReadService = async (userId) => {
  await Notification.update({ read: true }, { where: { userId, read: false } });
  return true;
};

export const deleteNotificationService = async (userId, notificationId) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new ErrorResponse('Không tìm thấy thông báo', 404);
  }
  if (notification.userId !== userId) {
    throw new ErrorResponse('Không có quyền truy cập', 403);
  }
  await notification.destroy();
  return true;
};

export const deleteAllNotificationsService = async (userId) => {
  await Notification.destroy({ where: { userId } });
  return true;
};

export const registerSseClient = async (userId, req, res) => {
  const strUserId = String(userId);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // tắt nginx buffering nếu có
  res.flushHeaders();

  // Đăng ký connection vào map
  if (!sseClients.has(strUserId)) {
    sseClients.set(strUserId, new Set());
  }
  sseClients.get(strUserId).add(res);

  // Gửi unreadCount ngay khi kết nối để client hiển thị badge
  try {
    const unreadCount = await Notification.count({ where: { userId, read: false } });
    res.write(`data: ${JSON.stringify({ type: 'init', unreadCount })}\n\n`);
  } catch (_) {
    res.write(`data: ${JSON.stringify({ type: 'init', unreadCount: 0 })}\n\n`);
  }

  // Giữ connection sống bằng heartbeat mỗi 30 giây
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch (_) { clearInterval(heartbeat); }
  }, 30000);

  // Cleanup khi client ngắt kết nối
  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(strUserId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) sseClients.delete(strUserId);
    }
  });
};
