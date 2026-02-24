import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên mục tiêu'],
    trim: true,
    maxlength: [100, 'Tên mục tiêu không được quá 100 ký tự']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Mô tả không được quá 500 ký tự']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền mục tiêu'],
    min: [0, 'Số tiền phải lớn hơn 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Số tiền hiện tại không được âm']
  },
  deadline: {
    type: Date,
    required: [true, 'Vui lòng chọn hạn chót']
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  icon: {
    type: String,
    default: '🎯'
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Màu sắc không hợp lệ']
  },
  isAchieved: {
    type: Boolean,
    default: false
  },
  achievedDate: {
    type: Date,
    default: null
  },
  depositHistory: [
    {
      amount: { type: Number, required: true },
      note:   { type: String, trim: true, default: '' },
      date:   { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index
goalSchema.index({ userId: 1, isAchieved: 1 });
goalSchema.index({ userId: 1, deadline: 1 });

// Virtual để tính progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount === 0) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Virtual để tính số tiền còn thiếu
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(this.targetAmount - this.currentAmount, 0);
});

// Virtual để tính số ngày còn lại
goalSchema.virtual('daysRemaining').get(function() {
  if (this.isAchieved) return 0;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diff = deadline - now;
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

// Method để add money to goal
goalSchema.methods.addAmount = async function(amount, note = '') {
  this.currentAmount += amount;
  this.depositHistory.push({ amount, note, date: new Date() });

  // Check if goal is achieved
  if (this.currentAmount >= this.targetAmount && !this.isAchieved) {
    this.isAchieved = true;
    this.achievedDate = new Date();
  }

  await this.save();
  return this;
};

// Method để calculate suggested monthly saving
goalSchema.methods.calculateMonthlySaving = function() {
  if (this.isAchieved) return 0;
  
  const remaining = this.targetAmount - this.currentAmount;
  const daysLeft = this.daysRemaining;
  
  if (daysLeft <= 0) return remaining;
  
  const monthsLeft = daysLeft / 30;
  return Math.ceil(remaining / monthsLeft);
};

// Ensure virtuals are included in JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

const Goal = mongoose.model('Goal', goalSchema);

export default Goal;
