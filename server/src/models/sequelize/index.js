import User from './User.js';
import Wallet from './Wallet.js';
import Transaction from './Transaction.js';
import Category from './Category.js';
import Budget from './Budget.js';
import Goal from './Goal.js';
import Debt from './Debt.js';
import Notification from './Notification.js';
import ContactMessage from './ContactMessage.js';
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
  // ContactMessage is independent (no user relation currently)

  // Search sync hooks removed (previously used external FTS engine).
  // If you add a different FTS engine, attach model hooks here to sync documents.
}

async function syncModels({ force = false } = {}) {
  initModels();
  await sequelize.sync({ force });
}

export { sequelize, initModels, syncModels, User, Wallet, Transaction, Category, Budget, Goal, Debt, Notification, ContactMessage };
