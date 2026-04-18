import ContactMessage from '../models/ContactMessage.model.js';
import {
  sendContactNotificationToAdmin,
  sendContactConfirmationToUser,
} from '../utils/sendEmail.js';

// POST /api/contact
export const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate cơ bản
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ tất cả các trường.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Địa chỉ email không hợp lệ.' });
    }

    // Giới hạn độ dài
    if (name.trim().length > 100)    return res.status(400).json({ success: false, message: 'Họ tên quá dài (tối đa 100 ký tự).' });
    if (subject.trim().length > 200) return res.status(400).json({ success: false, message: 'Tiêu đề quá dài (tối đa 200 ký tự).' });
    if (message.trim().length > 3000) return res.status(400).json({ success: false, message: 'Nội dung quá dài (tối đa 3000 ký tự).' });

    // Chống spam: Kiểm tra cùng email gửi trong vòng 5 phút
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentMessage = await ContactMessage.findOne({
      email: email.trim().toLowerCase(),
      createdAt: { $gte: fiveMinutesAgo },
    });
    if (recentMessage) {
      return res.status(429).json({
        success: false,
        message: 'Bạn đã gửi tin nhắn gần đây. Vui lòng đợi một lúc trước khi gửi tiếp.',
      });
    }

    // Lưu vào MongoDB
    const contactMsg = await ContactMessage.create({
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      subject:   subject.trim(),
      message:   message.trim(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    });

    // Gửi email (song song, không block response nếu lỗi)
    await Promise.allSettled([
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
    ]);

    return res.status(201).json({
      success: true,
      message: 'Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ.',
    });
  } catch (error) {
    console.error('❌ submitContact error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const getContactMessages = async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};
    if (status && ['new', 'read', 'replied'].includes(status)) {
      query.status = status;
    }

    if (search?.trim()) {
      const pattern = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: pattern },
        { email: pattern },
        { subject: pattern },
        { message: pattern },
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'status', 'email'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [items, total, statusStats] = await Promise.all([
      ContactMessage.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(limitNum).lean(),
      ContactMessage.countDocuments(query),
      ContactMessage.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    const summary = { new: 0, read: 0, replied: 0 };
    statusStats.forEach((entry) => {
      if (summary[entry._id] !== undefined) summary[entry._id] = entry.count;
    });

    return res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.max(Math.ceil(total / limitNum), 1),
        },
        summary,
      }
    });
  } catch (error) {
    console.error('❌ getContactMessages error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const updateContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    const updateData = {};

    if (status !== undefined) {
      if (!['new', 'read', 'replied'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
      }
      updateData.status = status;
    }

    if (adminNote !== undefined) {
      updateData.adminNote = String(adminNote).trim();
    }

    const item = await ContactMessage.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
    }

    return res.json({ success: true, message: 'Cập nhật liên hệ thành công', data: item });
  } catch (error) {
    console.error('❌ updateContactMessage error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};

export const deleteContactMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ContactMessage.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
    }

    return res.json({ success: true, message: 'Xóa liên hệ thành công' });
  } catch (error) {
    console.error('❌ deleteContactMessage error:', error);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' });
  }
};
