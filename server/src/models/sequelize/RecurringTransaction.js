import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class RecurringTransaction extends Model {}

RecurringTransaction.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('income', 'expense', 'transfer'),
    allowNull: false,
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  toWalletId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  nextExecutionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'RecurringTransaction',
  tableName: 'recurring_transactions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['isActive'] },
    { fields: ['nextExecutionDate'] },
  ],
});

export default RecurringTransaction;
