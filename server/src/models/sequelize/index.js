import User from './User.js';
import Wallet from './Wallet.js';
import Transaction from './Transaction.js';
import Category from './Category.js';
import Budget from './Budget.js';
import Goal from './Goal.js';
import Debt from './Debt.js';
import Notification from './Notification.js';
import ContactMessage from './ContactMessage.js';
import VipOrder from './VipOrder.js';
import UserVisit from './UserVisit.js';
import RecurringTransaction from './RecurringTransaction.js';
import { sequelize } from '../../config/sqlserver.js';

function initModels() {
  // Associations
  User.hasMany(Wallet, { foreignKey: 'userId', as: 'wallets' });
  Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  // onDelete: 'NO ACTION' — tránh SQL Server báo "multiple cascade paths" vì users->wallets
  // đã CASCADE và users->transactions cũng CASCADE; wallet.service.js tự tay chuyển
  // walletId/toWalletId sang ví dự phòng trước khi xóa ví nên không cần DB cascade ở đây.
  Wallet.hasMany(Transaction, { foreignKey: 'walletId', as: 'transactions', onDelete: 'NO ACTION' });
  Transaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet', onDelete: 'NO ACTION' });

  Wallet.hasMany(Transaction, { foreignKey: 'toWalletId', as: 'incomingTransfers', onDelete: 'NO ACTION' });
  Transaction.belongsTo(Wallet, { foreignKey: 'toWalletId', as: 'toWallet', onDelete: 'NO ACTION' });

  User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
  Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Category, { foreignKey: 'userId', as: 'categories' });
  Category.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
  Budget.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Goal, { foreignKey: 'userId', as: 'goals' });
  Goal.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Debt, { foreignKey: 'userId', as: 'debts' });
  Debt.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  User.hasMany(VipOrder, { foreignKey: 'userId', as: 'vipOrders' });
  VipOrder.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  
  User.hasMany(UserVisit, { foreignKey: 'userId', as: 'visits' });
  UserVisit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  User.hasMany(RecurringTransaction, { foreignKey: 'userId', as: 'recurringTransactions', onDelete: 'CASCADE' });
  RecurringTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
  Wallet.hasMany(RecurringTransaction, { foreignKey: 'walletId', as: 'recurringTransactions', onDelete: 'NO ACTION' });
  RecurringTransaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet', onDelete: 'NO ACTION' });
  Wallet.hasMany(RecurringTransaction, { foreignKey: 'toWalletId', as: 'incomingRecurringTransfers', onDelete: 'NO ACTION' });
  RecurringTransaction.belongsTo(Wallet, { foreignKey: 'toWalletId', as: 'toWallet', onDelete: 'NO ACTION' });
  // Tách giao dịch: quan hệ cha-con (self-referencing)
  Transaction.hasMany(Transaction, { foreignKey: 'parentId', as: 'splitChildren' });
  Transaction.belongsTo(Transaction, { foreignKey: 'parentId', as: 'parentTransaction' });

  // ContactMessage is independent (no user relation currently)

  // Search sync hooks removed (previously used external FTS engine).
  // If you add a different FTS engine, attach model hooks here to sync documents.
}

async function syncModels({ force = false } = {}) {
  initModels();

  // Run pre-sync migrations (adding parentId to transactions if table exists but column doesn't)
  if (process.env.FORCE_SQLITE_IN_TESTS !== 'true') {
    try {
      await sequelize.query(`
        IF EXISTS (
          SELECT * FROM sys.objects 
          WHERE object_id = OBJECT_ID('transactions') AND type = 'U'
        )
        BEGIN
          IF NOT EXISTS (
            SELECT * FROM sys.columns 
            WHERE object_id = OBJECT_ID('transactions') AND name = 'parentId'
          )
          BEGIN
            ALTER TABLE transactions ADD parentId UNIQUEIDENTIFIER NULL;
          END
        END
      `);
      console.log('✅ Checked transactions table: parentId column exists or has been added.');
    } catch (err) {
      console.warn('⚠️ Could not run transactions table pre-sync migration for parentId:', err.message);
    }

    try {
      await sequelize.query(`
        IF EXISTS (
          SELECT * FROM sys.objects 
          WHERE object_id = OBJECT_ID('transactions') AND type = 'U'
        )
        BEGIN
          IF NOT EXISTS (
            SELECT * FROM sys.columns 
            WHERE object_id = OBJECT_ID('transactions') AND name = 'receiptUrl'
          )
          BEGIN
            ALTER TABLE transactions ADD receiptUrl NVARCHAR(500) NULL;
          END
        END
      `);
      console.log('✅ Checked transactions table: receiptUrl column exists or has been added.');
    } catch (err) {
      console.warn('⚠️ Could not run transactions table pre-sync migration for receiptUrl:', err.message);
    }

    try {
      await sequelize.query(`
        IF EXISTS (
          SELECT * FROM sys.objects 
          WHERE object_id = OBJECT_ID('transactions') AND type = 'U'
        )
        BEGIN
          IF NOT EXISTS (
            SELECT * FROM sys.columns 
            WHERE object_id = OBJECT_ID('transactions') AND name = 'tags'
          )
          BEGIN
            ALTER TABLE transactions ADD tags NVARCHAR(500) NULL;
          END
        END
      `);
      console.log('✅ Checked transactions table: tags column exists or has been added.');
    } catch (err) {
      console.warn('⚠️ Could not run transactions table pre-sync migration for tags:', err.message);
    }
  }

  await sequelize.sync({ force });
  
  // Custom schema migrations for existing database tables
  if (process.env.FORCE_SQLITE_IN_TESTS !== 'true') {
    try {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('users') AND name = 'isBanned'
        )
        BEGIN
          ALTER TABLE users ADD isBanned BIT DEFAULT 0;
        END
      `);
      console.log('✅ Checked users table: isBanned column exists or has been added.');
    } catch (err) {
      console.warn('⚠️ Could not run users table migration for isBanned:', err.message);
    }

    try {
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('vip_orders') AND name = 'isPaid'
        )
        BEGIN
          ALTER TABLE vip_orders ADD isPaid BIT DEFAULT 0;
        END
      `);
      console.log('✅ Checked vip_orders table: isPaid column exists or has been added.');
    } catch (err) {
      console.warn('⚠️ Could not run vip_orders table migration for isPaid:', err.message);
    }

    try {
      // ALTER TABLE và câu lệnh dùng cột mới phải tách riêng batch, nếu không SQL Server
      // sẽ biên dịch UPDATE với schema cũ (chưa thấy cột) và báo "Invalid column name".
      await sequelize.query(`
        IF NOT EXISTS (
          SELECT * FROM sys.columns
          WHERE object_id = OBJECT_ID('categories') AND name = 'group'
        )
        BEGIN
          ALTER TABLE categories ADD [group] NVARCHAR(20) NULL;
        END
      `);
      await sequelize.query(`
        UPDATE categories SET [group] = 'need' WHERE [group] IS NULL AND type IN ('expense','both');
      `);
      console.log('✅ Checked categories table: group column exists or has been added.');
    } catch (err) {
      console.warn('⚠️ Could not run categories table migration for group:', err.message);
    }
  }
}

export { sequelize, initModels, syncModels, User, Wallet, Transaction, Category, Budget, Goal, Debt, Notification, ContactMessage, VipOrder, UserVisit, RecurringTransaction };
