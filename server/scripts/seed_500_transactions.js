import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sequelize, initModels, User, Wallet, Transaction } from '../src/models/sequelize/index.js';
import { recalculateWalletBalance } from '../src/services/wallet.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load cấu hình môi trường từ file .env ở thư mục server/
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedTransactions() {
  try {
    console.log('🔄 Đang kết nối tới cơ sở dữ liệu...');
    await sequelize.authenticate();
    console.log('✅ Đã kết nối cơ sở dữ liệu thành công.');

    // Khởi tạo các quan hệ (associations) giữa các bảng
    initModels();

    // 1. Tìm người dùng đầu tiên trong cơ sở dữ liệu để gán giao dịch
    console.log('🔍 Đang kiểm tra danh sách người dùng...');
    const user = await User.findOne({ order: [['createdAt', 'ASC']] });
    if (!user) {
      console.log('❌ Lỗi: Không tìm thấy người dùng nào trong hệ thống.');
      console.log('👉 Vui lòng đăng ký một tài khoản trước trên giao diện Web hoặc đăng ký qua API.');
      process.exit(1);
    }

    console.log(`👤 Tìm thấy người dùng: ${user.name} (${user.email}) [ID: ${user.id}]`);

    // 2. Tìm ví chính hoặc ví mặc định của người dùng
    let wallet = await Wallet.findOne({ where: { userId: user.id, isDefault: true } });
    if (!wallet) {
      wallet = await Wallet.findOne({ where: { userId: user.id } });
    }

    // Nếu người dùng chưa có ví nào, tự động tạo mới một Ví chính
    if (!wallet) {
      console.log(`💼 Người dùng chưa có ví. Tiến hành tạo ví mặc định "Ví chính"...`);
      wallet = await Wallet.create({
        userId: user.id,
        name: 'Ví chính',
        isDefault: true,
        icon: '💼',
        color: '#3B82F6',
        balance: 0,
        initialBalance: 0
      });
    }

    console.log(`💼 Sử dụng ví: "${wallet.name}" [ID: ${wallet.id}]`);

    // 3. Tạo danh sách 500 giao dịch ngẫu nhiên
    console.log('🌱 Đang khởi tạo dữ liệu cho 500 giao dịch...');
    const transactionsData = [];
    const incomeCategories = ['Lương', 'Thưởng', 'Kinh doanh', 'Đầu tư', 'Quà tặng', 'Khác'];
    const expenseCategories = ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Nhà cửa', 'Học tập', 'Giải trí', 'Y tế', 'Hóa đơn', 'Du lịch', 'Khác'];

    const now = new Date();

    for (let i = 0; i < 500; i++) {
      // Phân bố ngẫu nhiên: 80% là chi tiêu (expense), 20% là thu nhập (income)
      const isIncome = Math.random() < 0.2;
      const type = isIncome ? 'income' : 'expense';
      const category = isIncome
        ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
        : expenseCategories[Math.floor(Math.random() * expenseCategories.length)];

      // Sinh số tiền ngẫu nhiên phù hợp với thực tế
      let amount = 0;
      if (isIncome) {
        // Thu nhập: từ 1,000,000 ₫ đến 25,000,000 ₫
        amount = Math.floor(Math.random() * 240 + 10) * 100000;
      } else {
        // Chi tiêu: từ 10,000 ₫ đến 3,000,000 ₫
        amount = Math.floor(Math.random() * 299 + 1) * 10000;
      }

      // Thời gian phân bố ngẫu nhiên trong vòng 1 năm trở lại đây
      const randomDaysAgo = Math.floor(Math.random() * 365);
      const date = new Date(now.getTime() - randomDaysAgo * 24 * 60 * 60 * 1000);
      
      // Giờ giấc ngẫu nhiên
      date.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );

      const note = isIncome
        ? `Lấy từ nguồn ${category.toLowerCase()}`
        : `Chi tiêu cho việc ${category.toLowerCase()}`;

      transactionsData.push({
        userId: user.id,
        type,
        category,
        amount,
        note: `${note} (Seed #${i + 1})`,
        walletId: wallet.id,
        date,
        parentId: null
      });
    }

    // 4. Thực hiện chèn hàng loạt (Bulk Insert) vào database
    console.log(`📤 Đang lưu 500 giao dịch vào database...`);
    await Transaction.bulkCreate(transactionsData);
    console.log('✅ Đã lưu thành công 500 giao dịch.');

    // 5. Cập nhật lại số dư ví tương ứng
    console.log('🧮 Đang tính toán và cập nhật lại số dư ví...');
    const updatedBalance = await recalculateWalletBalance(wallet.id);
    console.log(`🎉 Seed thành công!`);
    console.log(`💼 Ví: "${wallet.name}" | Số dư mới: ${updatedBalance.toLocaleString('vi-VN')} ₫`);

  } catch (error) {
    console.error('❌ Có lỗi xảy ra trong quá trình seed dữ liệu:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Đã ngắt kết nối cơ sở dữ liệu.');
  }
}

seedTransactions();
