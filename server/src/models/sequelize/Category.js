import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Category extends Model {
  static async createDefaultCategories(userId) {
    const defaultCategories = [
      { name: 'Lương', icon: '💰', color: '#10B981', type: 'income', order: 1 },
      { name: 'Thưởng', icon: '🎁', color: '#34D399', type: 'income', order: 2 },
      { name: 'Đầu tư', icon: '📈', color: '#059669', type: 'income', order: 3 },
      { name: 'Thu nhập khác', icon: '💵', color: '#6EE7B7', type: 'income', order: 4 },
      // group: dùng cho quy tắc ngân sách 50/30/20 (need = thiết yếu, want = không thiết yếu)
      { name: 'Ăn uống', icon: '🍜', color: '#EF4444', type: 'expense', order: 1, group: 'need' },
      { name: 'Di chuyển', icon: '🚗', color: '#F59E0B', type: 'expense', order: 2, group: 'need' },
      { name: 'Mua sắm', icon: '🛒', color: '#EC4899', type: 'expense', order: 3, group: 'want' },
      { name: 'Giải trí', icon: '🎮', color: '#8B5CF6', type: 'expense', order: 4, group: 'want' },
      { name: 'Học tập', icon: '📚', color: '#3B82F6', type: 'expense', order: 5, group: 'need' },
      { name: 'Y tế', icon: '🏥', color: '#06B6D4', type: 'expense', order: 6, group: 'need' },
      { name: 'Nhà ở', icon: '🏠', color: '#6366F1', type: 'expense', order: 7, group: 'need' },
      { name: 'Hóa đơn', icon: '📄', color: '#F97316', type: 'expense', order: 8, group: 'need' },
      { name: 'Chi tiêu khác', icon: '💸', color: '#64748B', type: 'expense', order: 9, group: 'want' },
    ];

    const rows = defaultCategories.map(c => ({ ...c, userId }));
    return await Category.bulkCreate(rows);
  }
}

Category.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '📁',
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('income','expense','both'),
    defaultValue: 'expense',
    allowNull: false,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Nhóm ngân sách cho quy tắc 50/30/20: thiết yếu (need), không thiết yếu (want), tiết kiệm (saving).
  // Chỉ có ý nghĩa với danh mục chi tiêu (expense/both); danh mục thu nhập bỏ trống.
  group: {
    type: DataTypes.ENUM('need', 'want', 'saving'),
    allowNull: true,
    defaultValue: 'need',
  },
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'type'] },
    { unique: true, fields: ['userId','name'] },
  ],
});

export default Category;
