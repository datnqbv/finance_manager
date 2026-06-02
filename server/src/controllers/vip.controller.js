import crypto from 'crypto';
import { VipOrder, User, Notification } from '../models/sequelize/index.js';

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

function getVnpayDateFormat(date) {
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
}

function createVnpayUrl(req, order) {
  const tmnCode = process.env.VNP_TMN_CODE || 'VKSJBPIL';
  const secretKey = process.env.VNP_HASH_SECRET || 'W0J75BGKDUSFGHA815QB0S7HI0IKTOEZ';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5000/api/vip/vnpay-return';

  const date = new Date();
  const createDate = getVnpayDateFormat(date);

  let ipAddr = req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  if (ipAddr.includes('::ffff:')) {
    ipAddr = ipAddr.replace('::ffff:', '');
  }

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = order.paymentCode;
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan dang ky VIP ' + order.paymentCode;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = order.amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  const sorted = sortObject(vnp_Params);
  const signData = Object.keys(sorted).map(key => `${key}=${sorted[key]}`).join('&');

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  sorted['vnp_SecureHash'] = signed;
  const query = Object.keys(sorted).map(key => `${key}=${sorted[key]}`).join('&');

  return vnpUrl + '?' + query;
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

      // Generate a unique payment reference code
      const paymentCode = `VIP${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

      const order = await VipOrder.create({
        userId,
        amount,
        durationMonths,
        paymentCode,
        status: 'pending'
      });

      const vnpayUrl = createVnpayUrl(req, order);

      return res.status(201).json({
        success: true,
        message: 'Tạo đơn đăng ký VIP thành công',
        data: {
          ...order.toJSON(),
          vnpayUrl
        }
      });
    } catch (error) {
      console.error('Error creating VIP order:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo đơn hàng' });
    }
  },

  // Sandbox Pay (Simulates Instant Webhook success)
  sandboxPay: async (req, res) => {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;

      const order = await VipOrder.findOne({ where: { id: orderId, userId } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      if (order.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Đơn hàng này đã được xử lý' });
      }

      // Activate VIP status
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
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
      await order.save();

      // Send success notification
      await Notification.create({
        userId,
        title: 'Kích hoạt VIP thành công 👑',
        message: `Tài khoản của bạn đã được nâng cấp lên VIP. Thời hạn sử dụng đến hết ngày ${endAt.toLocaleDateString('vi-VN')}. Cảm ơn bạn đã đồng hành cùng chúng tôi!`,
        type: 'success',
        read: false
      });

      return res.status(200).json({
        success: true,
        message: 'Thanh toán thành công và đã kích hoạt tài khoản VIP!',
        data: {
          isVip: user.isVip,
          vipExpire: user.vipExpire
        }
      });
    } catch (error) {
      console.error('Error in sandbox payment:', error);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xử lý thanh toán' });
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

  // Return URL callback from VNPay (GET /api/vip/vnpay-return)
  vnpayReturn: async (req, res) => {
    try {
      let vnp_Params = { ...req.query };
      const secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      const secretKey = process.env.VNP_HASH_SECRET || 'W0J75BGKDUSFGHA815QB0S7HI0IKTOEZ';
      const sorted = sortObject(vnp_Params);
      const signData = Object.keys(sorted).map(key => `${key}=${sorted[key]}`).join('&');

      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

      const clientRedirectUrl = process.env.VNP_CLIENT_REDIRECT || 'http://localhost:5173/vip';

      if (secureHash === signed) {
        const paymentCode = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];

        const order = await VipOrder.findOne({ where: { paymentCode } });
        if (!order) {
          console.error(`Order not found for payment code: ${paymentCode}`);
          return res.redirect(`${clientRedirectUrl}?status=cancel`);
        }

        if (responseCode === '00') {
          if (order.status === 'pending') {
            order.isPaid = true;
            await order.save();

            // Send notification to user that payment is received and pending activation
            await Notification.create({
              userId: order.userId,
              title: 'Thanh toán VIP thành công 💳',
              message: `Chúng tôi đã nhận được thanh toán cho đơn hàng ${order.paymentCode}. Vui lòng chờ quản trị viên duyệt và kích hoạt tài khoản VIP của bạn.`,
              type: 'info',
              read: false
            });
          }
          return res.redirect(`${clientRedirectUrl}?status=paid_pending`);
        } else {
          // If transaction was canceled or failed
          if (order.status === 'pending') {
            order.status = 'cancelled';
            await order.save();
          }
          return res.redirect(`${clientRedirectUrl}?status=cancel`);
        }
      } else {
        console.error('Invalid checksum for VNPay Return');
        return res.redirect(`${clientRedirectUrl}?status=cancel`);
      }
    } catch (error) {
      console.error('Error in vnpayReturn:', error);
      const clientRedirectUrl = process.env.VNP_CLIENT_REDIRECT || 'http://localhost:5173/vip';
      return res.redirect(`${clientRedirectUrl}?status=cancel`);
    }
  },

  // IPN Webhook callback from VNPay (GET /api/vip/vnpay-ipn)
  vnpayIpn: async (req, res) => {
    try {
      let vnp_Params = { ...req.query };
      const secureHash = vnp_Params['vnp_SecureHash'];

      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      const secretKey = process.env.VNP_HASH_SECRET || 'W0J75BGKDUSFGHA815QB0S7HI0IKTOEZ';
      const sorted = sortObject(vnp_Params);
      const signData = Object.keys(sorted).map(key => `${key}=${sorted[key]}`).join('&');

      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

      if (secureHash === signed) {
        const paymentCode = vnp_Params['vnp_TxnRef'];
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const vnpAmount = parseInt(vnp_Params['vnp_Amount'], 10);

        const order = await VipOrder.findOne({ where: { paymentCode } });
        if (!order) {
          return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
        }

        // Verify amount
        if (order.amount * 100 !== vnpAmount) {
          return res.status(200).json({ RspCode: '04', Message: 'Invalid amount' });
        }

        if (order.status !== 'pending') {
          return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
        }

        if (responseCode === '00') {
          order.isPaid = true;
          await order.save();
        } else {
          order.status = 'cancelled';
          await order.save();
        }

        return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
      } else {
        return res.status(200).json({ RspCode: '97', Message: 'Invalid checksum' });
      }
    } catch (error) {
      console.error('Error in vnpayIpn:', error);
      return res.status(500).json({ RspCode: '99', Message: 'Internal error' });
    }
  }
};
