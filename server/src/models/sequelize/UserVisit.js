import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class UserVisit extends Model {}

UserVisit.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  visitedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'UserVisit',
  tableName: 'user_visits',
  timestamps: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['visitedAt'] },
  ],
});

export default UserVisit;
