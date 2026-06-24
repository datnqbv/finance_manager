import dotenv from 'dotenv';
import path from 'path';
import { 
  sequelize, 
  User, 
  Wallet, 
  Transaction, 
  Category 
} from '../src/models/sequelize/index.js';
import { splitTransaction, unsplitTransaction } from '../src/services/transaction.service.js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve('.env') });

async function runTest() {
  console.log('🔄 Starting Split Transaction Integration Test on local SQL Server...');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to local SQL Server');

    // 1. Tạo user test tạm thời
    const email = `test_split_${Date.now()}@example.com`;
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Split Tester',
      email,
      password: passwordHash
    });
    console.log(`✅ Created test user: ${email}`);

    // 2. Tạo ví tạm thời cho user
    const wallet = await Wallet.create({
      userId: user.id,
      name: 'Ví Test Tách',
      balance: 1000000,
      icon: '👛',
      color: '#4caf50',
      isDefault: true
    });
    console.log(`✅ Created test wallet: ${wallet.name} (ID: ${wallet.id})`);

    // 3. Tạo một giao dịch chi tiêu gốc trị giá 500,000₫
    const originalTx = await Transaction.create({
      userId: user.id,
      type: 'expense',
      category: 'Ăn uống',
      amount: 500000,
      note: 'Đi siêu thị cuối tuần',
      date: new Date(),
      walletId: wallet.id
    });
    console.log(`✅ Created original transaction: ${originalTx.category} - ${originalTx.amount}₫ (ID: ${originalTx.id})`);

    // 4. Thực hiện tách giao dịch thành 2 phần:
    // - 200,000₫ Thực phẩm
    // - 300,000₫ Đồ gia dụng
    console.log('🔄 Splitting transaction...');
    const splits = [
      { category: 'Thực phẩm', amount: 200000, note: 'Mua thịt bò rau củ' },
      { category: 'Đồ gia dụng', amount: 300000, note: 'Mua xà phòng lau nhà' }
    ];

    const result = await splitTransaction(user.id, originalTx.id, splits);
    console.log('🎉 SPLIT SUCCESSFUL! Response contains:');
    console.log(`- Parent ID: ${result.parent.id}`);
    console.log(`- Child 1: Category: ${result.children[0].category}, Amount: ${result.children[0].amount}₫, ParentId: ${result.children[0].parentId}`);
    console.log(`- Child 2: Category: ${result.children[1].category}, Amount: ${result.children[1].amount}₫, ParentId: ${result.children[1].parentId}`);

    // 5. Kiểm tra DB xem các dòng con đã được lưu đúng kiểu uniqueidentifier chưa
    const dbChildren = await Transaction.findAll({
      where: { parentId: originalTx.id }
    });
    
    if (dbChildren.length === 2) {
      console.log('✅ DB Verification: Found exactly 2 child transactions referencing parentId.');
    } else {
      throw new Error(`❌ DB Verification Failed: Expected 2 child transactions, found ${dbChildren.length}`);
    }

    // 6. Thử nghiệm hủy tách (unsplit)
    console.log('🔄 Testing unsplit transaction...');
    await unsplitTransaction(user.id, originalTx.id);
    
    const countAfterUnsplit = await Transaction.count({
      where: { parentId: originalTx.id }
    });
    
    if (countAfterUnsplit === 0) {
      console.log('✅ DB Verification: All child transactions were successfully deleted after unsplit.');
    } else {
      throw new Error(`❌ DB Verification Failed: Expected 0 child transactions after unsplit, but found ${countAfterUnsplit}`);
    }

    // 7. Dọn dẹp dữ liệu test
    console.log('🔄 Cleaning up test data...');
    await Transaction.destroy({ where: { userId: user.id } });
    await Wallet.destroy({ where: { userId: user.id } });
    await User.destroy({ where: { id: user.id } });
    console.log('✅ Clean up complete.');
    console.log('🚀 ALL TESTS PASSED SUCCESSFULLY ON SQL SERVER!');

  } catch (err) {
    console.error('❌ Integration Test Failed:', err.message || err);
  } finally {
    await sequelize.close();
  }
}

runTest();
