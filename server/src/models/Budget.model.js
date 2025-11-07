import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null // null = overall budget
  },
  categoryName: {
    type: String,
    default: null // For quick access without population
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền ngân sách'],
    min: [0, 'Ngân sách phải lớn hơn 0']
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  alertThresholds: {
    type: [Number],
    default: [80, 100, 120] // % thresholds
  },
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
budgetSchema.index({ userId: 1, categoryId: 1 });
budgetSchema.index({ userId: 1, isActive: 1 });

// Virtual để tính spending hiện tại
budgetSchema.virtual('currentSpending').get(function() {
  return this._currentSpending || 0;
});

// Method để check alert thresholds
budgetSchema.methods.checkAlerts = function(currentSpending) {
  const percentage = (currentSpending / this.amount) * 100;
  const triggeredAlerts = this.alertThresholds.filter(threshold => 
    percentage >= threshold && this.notificationEnabled
  );
  return {
    percentage: Math.round(percentage),
    triggeredAlerts,
    isOverBudget: percentage > 100
  };
};

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
