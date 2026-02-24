// Script seed dữ liệu mẫu cho MongoDB (ES Module)
import 'dotenv/config';
import mongoose from 'mongoose';
import Transaction from './src/models/Transaction.model.js';
import Category from './src/models/Category.model.js';
import Goal from './src/models/Goal.model.js';
import RecurringTransaction from './src/models/RecurringTransaction.model.js';
import User from './src/models/User.model.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quanlychitieu';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomHexColor() {
  return '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase();
}

const categoryNames = [
  'Ăn uống', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Sức khỏe',
  'Giáo dục', 'Hóa đơn điện nước', 'Thuê nhà', 'Lương', 'Thưởng',
  'Đầu tư', 'Du lịch', 'Thể thao', 'Quà tặng', 'Bảo hiểm',
  'Sửa chữa', 'Mỹ phẩm', 'Thú cưng', 'Sách báo', 'Công tác phí',
];

const categoryIcons = ['🍔', '🚗', '🛍️', '🎮', '💊', '📚', '💡', '🏠', '💰', '🎁',
  '📈', '✈️', '🏋️', '🎀', '🛡️', '🔧', '💄', '🐶', '📖', '💼'];

const goalNames = [
  'Mua xe máy', 'Mua điện thoại', 'Du lịch Đà Nẵng', 'Quỹ khẩn cấp',
  'Mua laptop', 'Tiết kiệm nhà ở', 'Học tiếng Anh', 'Đầu tư chứng khoán',
  'Mua tủ lạnh', 'Du lịch nước ngoài', 'Mua máy giặt', 'Tiết kiệm hưu trí',
  'Mua TV', 'Khóa học lập trình', 'Quỹ giáo dục con', 'Sửa nhà',
  'Mua xe ô tô', 'Tiết kiệm cưới', 'Quỹ y tế', 'Đầu tư bất động sản',
];

const priorities = ['high', 'medium', 'low'];
const frequencies = ['daily', 'weekly', 'monthly', 'yearly'];
const types = ['income', 'expense'];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Đã kết nối MongoDB');

  // Xoá user cũ nếu có và tạo lại để đảm bảo password đúng
  const oldUser = await User.findOne({ email: 'seed@demo.com' });
  if (oldUser) {
    await Promise.all([
      Category.deleteMany({ userId: oldUser._id }),
      Transaction.deleteMany({ userId: oldUser._id }),
      Goal.deleteMany({ userId: oldUser._id }),
      RecurringTransaction.deleteMany({ userId: oldUser._id }),
    ]);
    await User.deleteOne({ _id: oldUser._id });
    console.log('🗑️  Đã xoá user và dữ liệu cũ');
  }

  const seedUser = await User.create({
    name: 'Seed User',
    email: 'seed@demo.com',
    password: '123456',
  });
  console.log('✅ Đã tạo seed user:', seedUser.email);

  const userId = seedUser._id;

  // Seed 100 categories
  const categories = Array.from({ length: 100 }, (_, i) => ({
    userId,
    name: `${categoryNames[i % categoryNames.length]} ${Math.floor(i / categoryNames.length) + 1}`,
    icon: categoryIcons[i % categoryIcons.length],
    color: randomHexColor(),
    type: i % 3 === 0 ? 'income' : i % 3 === 1 ? 'expense' : 'both',
    isDefault: false,
    order: i,
  }));
  await Category.insertMany(categories);
  console.log('✅ Đã insert 100 danh mục (categories)');

  // Các tên category để dùng cho transaction và recurring
  const catNames = categories.map(c => c.name);

  // Seed 100 transactions
  const transactions = Array.from({ length: 100 }, (_, i) => ({
    userId,
    type: types[i % 2],
    category: catNames[randomInt(0, 99)],
    amount: randomInt(10000, 5000000),
    note: `Giao dịch mẫu số ${i + 1}`,
    date: randomDate(new Date(2025, 0, 1), new Date(2026, 11, 31)),
  }));
  await Transaction.insertMany(transactions);
  console.log('✅ Đã insert 100 giao dịch (transactions)');

  // Seed 100 goals
  const goals = Array.from({ length: 100 }, (_, i) => {
    const targetAmount = randomInt(1000000, 100000000);
    return {
      userId,
      name: `${goalNames[i % goalNames.length]} ${Math.floor(i / goalNames.length) + 1}`,
      description: `Mục tiêu tiết kiệm số ${i + 1}`,
      targetAmount,
      currentAmount: randomInt(0, targetAmount),
      deadline: randomDate(new Date(2026, 0, 1), new Date(2028, 11, 31)),
      priority: priorities[i % 3],
      icon: categoryIcons[i % categoryIcons.length],
      color: randomHexColor(),
    };
  });
  await Goal.insertMany(goals);
  console.log('✅ Đã insert 100 mục tiêu (goals)');

  // Seed 100 recurring transactions
  const recurring = Array.from({ length: 100 }, (_, i) => ({
    userId,
    templateName: `Giao dịch định kỳ ${i + 1}`,
    type: types[i % 2],
    category: catNames[randomInt(0, 99)],
    amount: randomInt(50000, 2000000),
    note: `Giao dịch định kỳ mẫu số ${i + 1}`,
    frequency: frequencies[i % 4],
    startDate: randomDate(new Date(2026, 0, 1), new Date(2026, 5, 30)),
    endDate: i % 5 === 0 ? randomDate(new Date(2026, 6, 1), new Date(2026, 11, 31)) : null,
    isActive: true,
  }));
  await RecurringTransaction.insertMany(recurring);
  console.log('✅ Đã insert 100 giao dịch định kỳ (recurring transactions)');

  console.log('\n🎉 Seed hoàn tất! Tài khoản demo:');
  console.log('   Email:    seed@demo.com');
  console.log('   Password: 123456');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Lỗi seed:', err);
  process.exit(1);
});
