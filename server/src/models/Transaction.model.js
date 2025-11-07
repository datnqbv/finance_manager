import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Vui lòng chọn loại giao dịch']
  },
  category: {
    type: String,
    required: [true, 'Vui lòng chọn danh mục'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền'],
    min: [0, 'Số tiền phải lớn hơn 0']
  },
  note: {
    type: String,
    trim: true,
    maxlength: [200, 'Ghi chú không được quá 200 ký tự']
  },
  date: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày'],
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
