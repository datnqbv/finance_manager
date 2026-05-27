import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Wallet extends Model {}

Wallet.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  balance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  initialBalance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  icon: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: '💼',
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#3B82F6',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'Wallet',
  tableName: 'wallets',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'isDefault'] },
  ],
});

export default Wallet;
