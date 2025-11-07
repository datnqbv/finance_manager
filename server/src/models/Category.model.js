import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên danh mục'],
    trim: true,
    maxlength: [50, 'Tên danh mục không được quá 50 ký tự']
  },
  icon: {
    type: String,
    default: '📁',
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#[0-9A-F]{6}$/i, 'Màu sắc không hợp lệ']
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'expense',
    required: [true, 'Vui lòng chọn loại danh mục']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index để tìm kiếm nhanh
categorySchema.index({ userId: 1, type: 1 });
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

// Method để khởi tạo categories mặc định cho user mới
categorySchema.statics.createDefaultCategories = async function(userId) {
  const defaultCategories = [
    // Income categories
    { name: 'Lương', icon: '💰', color: '#10B981', type: 'income', order: 1 },
    { name: 'Thưởng', icon: '🎁', color: '#34D399', type: 'income', order: 2 },
    { name: 'Đầu tư', icon: '📈', color: '#059669', type: 'income', order: 3 },
    { name: 'Thu nhập khác', icon: '💵', color: '#6EE7B7', type: 'income', order: 4 },
    
    // Expense categories
    { name: 'Ăn uống', icon: '🍜', color: '#EF4444', type: 'expense', order: 1 },
    { name: 'Di chuyển', icon: '🚗', color: '#F59E0B', type: 'expense', order: 2 },
    { name: 'Mua sắm', icon: '🛒', color: '#EC4899', type: 'expense', order: 3 },
    { name: 'Giải trí', icon: '🎮', color: '#8B5CF6', type: 'expense', order: 4 },
    { name: 'Học tập', icon: '📚', color: '#3B82F6', type: 'expense', order: 5 },
    { name: 'Y tế', icon: '🏥', color: '#06B6D4', type: 'expense', order: 6 },
    { name: 'Nhà ở', icon: '🏠', color: '#6366F1', type: 'expense', order: 7 },
    { name: 'Hóa đơn', icon: '📄', color: '#F97316', type: 'expense', order: 8 },
    { name: 'Chi tiêu khác', icon: '💸', color: '#64748B', type: 'expense', order: 9 },
  ];

  const categories = defaultCategories.map(cat => ({
    ...cat,
    userId,
    isDefault: true
  }));

  await this.insertMany(categories);
  return categories;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
