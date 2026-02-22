import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true, maxlength: 100 },
    email:   { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    // Trạng thái xử lý
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
    },
    // Ghi chú nội bộ của admin (nếu muốn ghi lại)
    adminNote: { type: String, default: '' },
    // IP người gửi (để chống spam)
    ipAddress: { type: String, default: '' },
  },
  { timestamps: true }
);

// Index để tìm kiếm nhanh
contactMessageSchema.index({ email: 1, createdAt: -1 });
contactMessageSchema.index({ status: 1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
export default ContactMessage;
