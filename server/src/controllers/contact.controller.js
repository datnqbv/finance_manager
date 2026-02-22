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
