import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  amount:  { type: Number, required: true },
  note:    { type: String, trim: true, default: '' },
  date:    { type: Date, default: Date.now }
});

const debtSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // 'lend'   = mình cho người khác vay (họ nợ mình)
  // 'borrow' = mình vay người khác (mình nợ họ)
  type: {
    type: String,
    enum: ['lend', 'borrow'],
    required: true
  },
  personName: {
    type: String,
    required: [true, 'Vui lòng nhập tên người liên quan'],
    trim: true,
    maxlength: 100
  },
  amount: {
    type: Number,
    required: [true, 'Vui lòng nhập số tiền'],
    min: [1, 'Số tiền phải lớn hơn 0']
  },
  remainingAmount: {
    type: Number,
    min: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'settled'],
    default: 'active'
  },
  paymentHistory: [paymentSchema]
}, { timestamps: true });

// Set remainingAmount = amount on create if not provided
debtSchema.pre('save', function (next) {
  if (this.isNew && this.remainingAmount === undefined) {
    this.remainingAmount = this.amount;
  }
  next();
});

debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, type: 1 });

const Debt = mongoose.model('Debt', debtSchema);
export default Debt;
