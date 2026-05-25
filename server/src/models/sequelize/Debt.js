import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Debt extends Model {}

Debt.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('lend','borrow'), allowNull: false },
  personName: { type: DataTypes.STRING(100), allowNull: false },
  amount: { type: DataTypes.DECIMAL(18,2), allowNull: false },
  remainingAmount: { type: DataTypes.DECIMAL(18,2), allowNull: true },
  description: { type: DataTypes.STRING(500), allowNull: true, defaultValue: '' },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('active','settled'), defaultValue: 'active' },
  paymentHistory: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '[]',
    get() { const raw = this.getDataValue('paymentHistory'); try { return JSON.parse(raw || '[]'); } catch(e){ return []; } },
    set(val) { this.setDataValue('paymentHistory', JSON.stringify(val || [])); }
  },
}, {
  sequelize,
  modelName: 'Debt',
  tableName: 'debts',
  timestamps: true,
  indexes: [ { fields: ['userId','status'] }, { fields: ['userId','type'] } ],
});

// Set remainingAmount = amount on create if not provided
Debt.beforeCreate((debt, options) => {
  if (debt.remainingAmount === undefined || debt.remainingAmount === null) {
    debt.remainingAmount = debt.amount;
  }
});

export default Debt;
