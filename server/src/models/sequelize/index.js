import User from './User.js';
import Transaction from './Transaction.js';
import Category from './Category.js';
import Budget from './Budget.js';
import Goal from './Goal.js';
import Debt from './Debt.js';
import Notification from './Notification.js';
import ContactMessage from './ContactMessage.js';
import { sequelize } from '../../config/sqlserver.js';
import { syncDocument, removeDocument } from '../../services/meilisearch.service.js';

function initModels() {
  // Associations
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

  // MeiliSearch Sync Hooks
  const createHook = (indexName) => ({
    afterCreate: async (instance) => await syncDocument(indexName, instance.toJSON()),
    afterUpdate: async (instance) => await syncDocument(indexName, instance.toJSON()),
    afterDestroy: async (instance) => await removeDocument(indexName, instance.id),
  });

  const transactionHooks = createHook('transactions');
  Transaction.addHook('afterCreate', transactionHooks.afterCreate);
  Transaction.addHook('afterUpdate', transactionHooks.afterUpdate);
  Transaction.addHook('afterDestroy', transactionHooks.afterDestroy);

  const categoryHooks = createHook('categories');
  Category.addHook('afterCreate', categoryHooks.afterCreate);
  Category.addHook('afterUpdate', categoryHooks.afterUpdate);
  Category.addHook('afterDestroy', categoryHooks.afterDestroy);
}

async function syncModels({ force = false } = {}) {
  initModels();
  await sequelize.sync({ force });
}

export { sequelize, initModels, syncModels, User, Transaction, Category, Budget, Goal, Debt, Notification, ContactMessage };
