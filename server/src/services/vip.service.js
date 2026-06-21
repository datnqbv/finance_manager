import { VipOrder, User, Notification } from '../models/sequelize/index.js';
import payosPkg from '@payos/node';
import ErrorResponse from '../utils/errorResponse.js';
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

export const createOrder = async (userId, data, clientOrigin) => {
  const { durationMonths, amount } = data;

  if (!durationMonths || !amount) {
    throw new ErrorResponse('Thiếu thông tin gói VIP hoặc số tiền', 400);
  }

  const user = await User.findByPk(userId);
  if (user.isVip && user.vipExpire && new Date(user.vipExpire) > new Date()) {
    const maxCompletedOrder = await VipOrder.findOne({
      where: { userId, status: 'completed' },
      order: [['durationMonths', 'DESC']]
    });

    if (maxCompletedOrder && durationMonths <= maxCompletedOrder.durationMonths) {
      throw new ErrorResponse(`Bạn đang sử dụng gói VIP có thời hạn ${maxCompletedOrder.durationMonths} tháng. Bạn chỉ có thể nâng cấp lên gói có thời hạn dài hơn!`, 403);
    }
  }

  const existingPendingOrder = await VipOrder.findOne({
    where: { userId, status: 'pending' }
  });

  if (existingPendingOrder) {
    const message = existingPendingOrder.isPaid
      ? 'Bạn đã có một giao dịch VIP đã thanh toán đang chờ Admin kiểm duyệt. Vui lòng chờ Admin kích hoạt trước khi nâng cấp tiếp!'
      : 'Bạn đang có một yêu cầu đăng ký VIP chưa thanh toán. Vui lòng hoàn tất thanh toán hoặc hủy yêu cầu cũ trước khi tạo yêu cầu mới!';
    throw new ErrorResponse(message, 400);
  }

  const orderCode = Number(String(Date.now()).slice(-6) + String(Math.floor(1000 + Math.random() * 9000)));

  const order = await VipOrder.create({
    userId,
    amount,
    durationMonths,
    paymentCode: orderCode.toString(),
    status: 'pending'
  });

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

  return {
    ...order.toJSON(),
    checkoutUrl: paymentLinkResponse.checkoutUrl
  };
};

export const confirmOrder = async (id) => {
  const order = await VipOrder.findByPk(id);
  if (!order) {
    throw new ErrorResponse('Không tìm thấy đơn hàng', 404);
  }

  if (order.status !== 'pending') {
    throw new ErrorResponse('Đơn hàng này đã được xử lý trước đó', 400);
  }

  const user = await User.findByPk(order.userId);
  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng sở hữu đơn hàng', 404);
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

  await Notification.create({
    userId: user.id,
    title: 'Kích hoạt VIP thành công 👑',
    message: `Tài khoản của bạn đã được nâng cấp lên VIP thông qua kiểm duyệt giao dịch. Thời hạn sử dụng đến hết ngày ${endAt.toLocaleDateString('vi-VN')}.`,
    type: 'success',
    read: false
  });

  return true;
};

export const getOrders = async () => {
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
  return orders;
};

export const getOrderStatus = async (userId, id) => {
  const order = await VipOrder.findOne({ where: { id, userId } });
  if (!order) {
    throw new ErrorResponse('Không tìm thấy đơn đăng ký', 404);
  }
  return order;
};

export const getMyOrders = async (userId) => {
  const orders = await VipOrder.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
  return orders;
};

export const cancelVip = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new ErrorResponse('Không tìm thấy người dùng', 404);
  }

  if (!user.isVip) {
    throw new ErrorResponse('Tài khoản của bạn hiện không phải là tài khoản VIP', 400);
  }

  user.isVip = false;
  user.vipExpire = null;
  await user.save();

  await Notification.create({
    userId,
    title: 'Đã hủy tư cách thành viên VIP 👑',
    message: 'Bạn đã hủy thành công tư cách thành viên VIP. Các quyền lợi VIP của bạn đã bị ngừng hoạt động.',
    type: 'info',
    read: false
  });

  return {
    isVip: user.isVip,
    vipExpire: user.vipExpire
  };
};

export const deleteOrder = async (userId, userRole, id) => {
  const order = await VipOrder.findByPk(id);
  if (!order) {
    throw new ErrorResponse('Không tìm thấy đơn hàng', 404);
  }

  if (userRole !== 'admin' && order.userId !== userId) {
    throw new ErrorResponse('Bạn không có quyền xóa đơn hàng này', 403);
  }

  if (userRole !== 'admin' && order.status !== 'pending') {
    throw new ErrorResponse('Chỉ có thể xóa đơn hàng ở trạng thái chờ duyệt', 400);
  }

  await order.destroy();
  return true;
};

export const payosWebhook = async (body) => {
  try {
    const payos = getPayOS();
    const webhookData = payos.webhooks.verify(body);
    const orderCode = webhookData.orderCode;
    const order = await VipOrder.findOne({ where: { paymentCode: orderCode.toString() } });

    if (!order) {
      return { success: true, message: 'Order not found' };
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

    return { success: true, message: 'Webhook processed' };
  } catch (error) {
    console.error('Error processing PayOS webhook:', error);
    throw new ErrorResponse('Invalid webhook', 400);
  }
};
