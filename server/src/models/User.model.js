import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên'],
    trim: true,
    maxlength: [50, 'Tên không được quá 50 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Email không hợp lệ'
    ]
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false // Không trả về password khi query
  },
  budget: {
    type: Number,
    default: 0,
    min: [0, 'Ngân sách không được âm']
  },
  currency: {
    type: String,
    default: 'VND',
    enum: ['VND', 'USD', 'EUR']
  },
  avatar: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpire: {
    type: Date,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Mã hóa password trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// So sánh password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Tạo reset password token (đơn giản - không cần email)
userSchema.methods.createPasswordResetToken = function() {
  // Tạo token đơn giản (6 số)
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash token và lưu vào DB
  this.resetPasswordToken = bcrypt.hashSync(resetToken, 10);
  
  // Token hết hạn sau 10 phút
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  
  return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
