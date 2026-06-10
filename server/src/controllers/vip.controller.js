import { VipOrder, User, Notification } from '../models/sequelize/index.js';
import payosPkg from '@payos/node';
const PayOS = payosPkg.PayOS || payosPkg;

let payosInstance = null;
function getPayOS() {
  if (process.env.NODE_ENV === 'test') {
    return {
      paymentRequests: {
        create: async (body) => {
          return { checkoutUrl: 'https://checkout.payos.vn/web/test-sandbox-checkout' };
        }
      },
      webhooks: {
        verify: (body) => {
          return { orderCode: body.orderCode || 123456 };
        }
      }
    };
  }
  if (!payosInstance) {
    payosInstance = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID,
      apiKey: process.env.PAYOS_API_KEY,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY
    });
  }
  return payosInstance;
}

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
  createOrder: async (req, res) => {
    try {
      const { durationMonths, amount } = req.body;
      const userId = req.user.id;

      if (!durationMonths || !amount) {
        return res.status(400).json({ success: false, message: 'Thiếu thông tin gói VIP hoặc số tiền' });
      }

      // Check active VIP plan duration restrictions
      const user = await User.findByPk(userId);
      if (user.isVip && user.vipExpire && new Date(user.vipExpire) > new Date()) {
        const maxCompletedOrder = await VipOrder.findOne({
          where: { userId, status: 'completed' },
          order: [['durationMonths', 'DESC']]
        });

        if (maxCompletedOrder && durationMonths <= maxCompletedOrder.durationMonths) {
          return res.status(403).json({
            success: false,
            message: `Bạn đang sử dụng gói VIP có thời hạn ${maxCompletedOrder.durationMonths} tháng. Bạn chỉ có thể nâng cấp lên gói có thời hạn dài hơn!`
          });
        }
      }

      // Check if there is any pending order for this user
      const existingPendingOrder = await VipOrder.findOne({
        where: { userId, status: 'pending' }
      });

      if (existingPendingOrder) {
        return res.status(400).json({
          success: false,
          message: existingPendingOrder.isPaid
            ? 'Bạn đã có một giao dịch VIP đã thanh toán đang chờ Admin kiểm duyệt. Vui lòng chờ Admin kích hoạt trước khi nâng cấp tiếp!'
            : 'Bạn đang có một yêu cầu đăng ký VIP chưa thanh toán. Vui lòng hoàn tất thanh toán hoặc hủy yêu cầu cũ trước khi tạo yêu cầu mới!'
        });
      }

      // Generate a unique numeric orderCode for PayOS (max 53 bits integer)
      const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(1000 + Math.random() * 9000)));

      const order = await VipOrder.create({
        userId,
        amount,
        durationMonths,
        paymentCode: orderCode.toString(),
        status: 'pending'
      });

      const clientOrigin = getClientOrigin(req);
      const returnUrl = `${clientOrigin}/vip`;

      const body = {
        orderCode: orderCode,
        amount: parseInt(order.amount, 10),
        description: 'Dang ky VIP',
        returnUrl: returnUrl,
        cancelUrl: returnUrl
      };

      const payos = getPayOS();
      const paymentLinkResponse = await payos.paymentRequests.create(body);

      return res.status(201).json({
        success: true,
        message: 'Tạo đơn đăng ký VIP thành công',
        data: {
          ...order.toJSON(),
          checkoutUrl: paymentLinkResponse.checkoutUrl
        }
      });
    } catch (error) {
      console.error('Error creating VIP order:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo đơn hàng' });
    }
  },



  // Admin Manual Approve
  confirmOrder: async (req, res) => {
    try {
      const { id } = req.params;

      const order = await VipOrder.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Đơn hàng này đã được xử lý trước đó' });
      }

      const user = await User.findByPk(order.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng sở hữu đơn hàng' });
      }

      let startFrom = new Date();
      if (user.isVip && user.vipExpire && new Date(user.vipExpire) > new Date()) {
        startFrom = new Date(user.vipExpire);
      }

      const endAt = new Date(startFrom);
      endAt.setMonth(endAt.getMonth() + order.durationMonths);

      user.isVip = true;
      user.vipExpire = endAt;
      await user.save();

      order.status = 'completed';
      order.isPaid = true;
      await order.save();

      // Send success notification
      await Notification.create({
        userId: user.id,
        title: 'Kích hoạt VIP thành công 👑',
        message: `Tài khoản của bạn đã được nâng cấp lên VIP thông qua kiểm duyệt giao dịch. Thời hạn sử dụng đến hết ngày ${endAt.toLocaleDateString('vi-VN')}.`,
        type: 'success',
        read: false
      });

      return res.status(200).json({
        success: true,
        message: 'Đã xác nhận thanh toán và kích hoạt VIP thành công!'
      });
    } catch (error) {
      console.error('Error confirming VIP order:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác nhận đơn hàng' });
    }
  },

  // Get orders list (Admin only)
  getOrders: async (req, res) => {
    try {
      const orders = await VipOrder.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching VIP orders:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải danh sách đơn hàng' });
    }
  },

  // Get specific order status (Authenticated user)
  getOrderStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const order = await VipOrder.findOne({ where: { id, userId } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đăng ký' });
      }

      return res.status(200).json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching VIP order status:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải trạng thái đơn hàng' });
    }
  },

  // Get user VIP orders history (Authenticated user)
  getMyOrders: async (req, res) => {
    try {
      const userId = req.user.id;
      const orders = await VipOrder.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error fetching user VIP orders:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tải lịch sử đơn hàng' });
    }
  },

  // Cancel VIP membership status (Authenticated user)
  cancelVip: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
      }

      if (!user.isVip) {
        return res.status(400).json({ success: false, message: 'Tài khoản của bạn hiện không phải là tài khoản VIP' });
      }

      user.isVip = false;
      user.vipExpire = null;
      await user.save();

      // Send cancellation notification
      await Notification.create({
        userId,
        title: 'Đã hủy tư cách thành viên VIP 👑',
        message: 'Bạn đã hủy thành công tư cách thành viên VIP. Các quyền lợi VIP của bạn đã bị ngừng hoạt động.',
        type: 'info',
        read: false
      });

      return res.status(200).json({
        success: true,
        message: 'Đã hủy tư cách thành viên VIP thành công!',
        data: {
          isVip: user.isVip,
          vipExpire: user.vipExpire
        }
      });
    } catch (error) {
      console.error('Error cancelling VIP status:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi hủy VIP' });
    }
  },

  // Delete order (Rejects order log for admin, cancels pending order for user)
  deleteOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const order = await VipOrder.findByPk(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      // If user is not admin, they can only delete their own pending orders
      if (user.role !== 'admin' && order.userId !== user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đơn hàng này' });
      }

      if (user.role !== 'admin' && order.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Chỉ có thể xóa đơn hàng ở trạng thái chờ duyệt' });
      }

      await order.destroy();
      return res.status(200).json({
        success: true,
        message: 'Xóa đơn hàng thành công!'
      });
    } catch (error) {
      console.error('Error deleting VIP order:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xóa đơn hàng' });
    }
  },

  // PayOS Webhook (POST /api/vip/payos-webhook)
  payosWebhook: async (req, res) => {
    try {
      const payos = getPayOS();
      const webhookData = payos.webhooks.verify(req.body);
      const orderCode = webhookData.orderCode;
      const order = await VipOrder.findOne({ where: { paymentCode: orderCode.toString() } });
      
      if (!order) {
        return res.status(200).json({ success: true, message: 'Order not found' });
      }

      if (order.status === 'pending') {
        order.isPaid = true;
        await order.save();

        await Notification.create({
          userId: order.userId,
          title: 'Thanh toán VIP thành công 💳',
          message: `Chúng tôi đã nhận được thanh toán cho đơn hàng ${order.paymentCode}. Vui lòng chờ quản trị viên duyệt và kích hoạt tài khoản VIP của bạn.`,
          type: 'info',
          read: false
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Webhook processed'
      });
    } catch (error) {
      console.error('Error processing PayOS webhook:', error);
      return res.status(400).json({ success: false, message: 'Invalid webhook' });
    }
  }
};
