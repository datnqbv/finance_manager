import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Transaction extends Model {}

Transaction.init({
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
    type: DataTypes.ENUM('income','expense','transfer'),
    allowNull: false,
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: true,
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
    type: DataTypes.DECIMAL(18,2),
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'Transaction',
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId','date'] },
    { fields: ['userId','type'] },
    { fields: ['walletId'] },
    { fields: ['toWalletId'] },
  ],
});

export default Transaction;
