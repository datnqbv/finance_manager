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
  
  Wallet.hasMany(Transaction, { foreignKey: 'walletId', as: 'transactions' });
  Transaction.belongsTo(Wallet, { foreignKey: 'walletId', as: 'wallet' });
  
  Wallet.hasMany(Transaction, { foreignKey: 'toWalletId', as: 'incomingTransfers' });
  Transaction.belongsTo(Wallet, { foreignKey: 'toWalletId', as: 'toWallet' });

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
  // ContactMessage is independent (no user relation currently)

  // Search sync hooks removed (previously used external FTS engine).
  // If you add a different FTS engine, attach model hooks here to sync documents.
}

async function syncModels({ force = false } = {}) {
  initModels();
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
  }
}

export { sequelize, initModels, syncModels, User, Wallet, Transaction, Category, Budget, Goal, Debt, Notification, ContactMessage, VipOrder, UserVisit, RecurringTransaction };
