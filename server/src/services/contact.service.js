import { ContactMessage } from '../models/sequelize/index.js';
import {
  sendContactNotificationToAdmin,
  sendContactConfirmationToUser,
} from '../utils/sendEmail.js';
import { Op } from 'sequelize';
import { getSearchCondition } from '../utils/fts.js';
import ErrorResponse from '../utils/errorResponse.js';

export const submitContactService = async (contactData, ipAddress) => {
  const { name, email, subject, message } = contactData;

  // Validate cơ bản
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    throw new ErrorResponse('Vui lòng điền đầy đủ tất cả các trường.', 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ErrorResponse('Địa chỉ email không hợp lệ.', 400);
  }

  // Giới hạn độ dài
  if (name.trim().length > 100)    throw new ErrorResponse('Họ tên quá dài (tối đa 100 ký tự).', 400);
  if (subject.trim().length > 200) throw new ErrorResponse('Tiêu đề quá dài (tối đa 200 ký tự).', 400);
  if (message.trim().length > 3000) throw new ErrorResponse('Nội dung quá dài (tối đa 3000 ký tự).', 400);

  // Chống spam: Kiểm tra cùng email gửi trong vòng 5 phút
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentMessage = await ContactMessage.findOne({
    where: { email: email.trim().toLowerCase(), createdAt: { [Op.gte]: fiveMinutesAgo } }
  });
  if (recentMessage) {
    throw new ErrorResponse('Bạn đã gửi tin nhắn gần đây. Vui lòng đợi một lúc trước khi gửi tiếp.', 429);
  }

  // Lưu vào database (Sequelize)
  const contactMsg = await ContactMessage.create({
    name:      name.trim(),
    email:     email.trim().toLowerCase(),
    subject:   subject.trim(),
    message:   message.trim(),
    ipAddress: ipAddress || '',
  });

  // Gửi email (song song, không block response nếu lỗi)
  Promise.allSettled([
    sendContactNotificationToAdmin({
      name:      contactMsg.name,
      email:     contactMsg.email,
      subject:   contactMsg.subject,
      message:   contactMsg.message,
      createdAt: contactMsg.createdAt,
    }),
    sendContactConfirmationToUser({
      name:    contactMsg.name,
      email:   contactMsg.email,
      subject: contactMsg.subject,
    }),
  ]).catch(err => {
    // Chỉ log lỗi email, không throw vì db đã lưu thành công
    console.error('Error sending contact emails:', err);
  });

  return contactMsg;
};

export const getContactMessagesList = async (queryOptions) => {
  const {
    status,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = queryOptions;

  const where = {};
  if (status && ['new', 'read', 'replied'].includes(status)) where.status = status;
  if (search?.trim()) {
    where[Op.and] = [getSearchCondition(['name', 'email', 'subject', 'message'], search.trim(), true)];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNum - 1) * limitNum;
  const orderArr = [[sortBy, order === 'asc' ? 'ASC' : 'DESC']];

  const [result, statusCounts] = await Promise.all([
    ContactMessage.findAndCountAll({ where, limit: limitNum, offset, order: orderArr }),
    ContactMessage.findAll({ attributes: ['status', [ContactMessage.sequelize.fn('COUNT', ContactMessage.sequelize.col('status')), 'count']], group: ['status'], raw: true }),
  ]);

  const items = result.rows;
  const total = result.count;

  const summary = { new: 0, read: 0, replied: 0 };
  statusCounts.forEach((entry) => { if (summary[entry.status] !== undefined) summary[entry.status] = parseInt(entry.count, 10); });

  return {
    items,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.max(Math.ceil(total / limitNum), 1),
    },
    summary,
  };
};

export const updateContactMessageService = async (id, updateDataInput) => {
  const { status, adminNote } = updateDataInput;
  const updateData = {};

  if (status !== undefined) {
    if (!['new', 'read', 'replied'].includes(status)) {
      throw new ErrorResponse('Trạng thái không hợp lệ', 400);
    }
    updateData.status = status;
  }

  if (adminNote !== undefined) {
    updateData.adminNote = String(adminNote).trim();
  }

  const item = await ContactMessage.findByPk(id);
  if (!item) {
    throw new ErrorResponse('Không tìm thấy liên hệ', 404);
  }

  await item.update(updateData);
  return item;
};

export const deleteContactMessageService = async (id) => {
  const item = await ContactMessage.findByPk(id);
  if (!item) {
    throw new ErrorResponse('Không tìm thấy liên hệ', 404);
  }

  await item.destroy();
  return true;
};
