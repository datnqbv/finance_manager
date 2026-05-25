import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Notification extends Model {}

Notification.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('transaction','budget','goal','info','warning','error','success'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  relatedId: { type: DataTypes.STRING, allowNull: true },
  relatedModel: { type: DataTypes.ENUM('Transaction','Budget','Goal'), allowNull: true },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  metadata: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '{}',
    get() { const raw = this.getDataValue('metadata'); try { return JSON.parse(raw || '{}'); } catch(e){ return {}; } },
    set(val) { this.setDataValue('metadata', JSON.stringify(val || {})); }
  },
}, {
  sequelize,
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true,
  indexes: [ { fields: ['userId','createdAt'] }, { fields: ['userId','read'] } ],
});

export default Notification;
