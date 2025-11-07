import mongoose from 'mongoose'; 

// Schema cho giao dịch định kỳ
const recurringTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateName: {
    type: String,
    required: [true, 'Vui lòng nhập tên mẫu'],
    trim: true,
    maxlength: [100, 'Tên mẫu không được quá 100 ký tự']
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
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: [true, 'Vui lòng chọn tần suất'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Vui lòng chọn ngày bắt đầu'],
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null // null = không giới hạn
  },
  occurrences: {
    type: Number,
    default: null, // null = unlimited
    min: [0, 'Số lần lặp phải lớn hơn 0']
  },
  executedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastExecuted: {
    type: Date,
    default: null
  },
  nextExecution: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notifyBeforeExecution: {
    type: Boolean,
    default: false
  },
  notifyDays: {
    type: Number,
    default: 1,
    min: 0,
    max: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes để tối ưu truy vấn
recurringTransactionSchema.index({ userId: 1, isActive: 1 }); // Tối ưu truy vấn giao dịch định kỳ theo user và trạng thái
recurringTransactionSchema.index({ nextExecution: 1, isActive: 1 }); // Tối ưu truy vấn giao dịch định kỳ theo ngày thực hiện tiếp theo

// Method để tính ngày execution tiếp theo
recurringTransactionSchema.methods.calculateNextExecution = function() {
  const now = new Date();
  const start = new Date(this.lastExecuted || this.startDate);
  let next = new Date(start);
  // Tính ngày tiếp theo dựa trên tần suất
  switch (this.frequency) { 
    case 'daily': // hàng ngày
      next.setDate(next.getDate() + 1); 
      break;
    case 'weekly': // hàng tuần
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly': // hàng tháng
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly': // hàng năm
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  // Nếu ngày tính được vẫn trong quá khứ, set về now
  if (next < now) {
    next = now;
  }

  return next;
};

// Method để check xem có nên execute không
recurringTransactionSchema.methods.shouldExecute = function() {
  if (!this.isActive) return false;

  const now = new Date();

  // Check end date
  if (this.endDate && now > new Date(this.endDate)) {
    return false;
  }

  // Check occurrences
  if (this.occurrences !== null && this.executedCount >= this.occurrences) {
    return false;
  }

  // Check next execution date
  if (this.nextExecution && now >= new Date(this.nextExecution)) {
    return true;
  }

  return false;
};

const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema);

export default RecurringTransaction;
