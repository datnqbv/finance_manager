import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class VipOrder extends Model {}

VipOrder.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
  },
  durationMonths: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  paymentCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  isPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'VipOrder',
  tableName: 'vip_orders',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['paymentCode'] },
    { fields: ['status'] },
  ],
});

export default VipOrder;
