import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class ContactMessage extends Model {}

ContactMessage.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  subject: { type: DataTypes.STRING(200), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('new','read','replied'), defaultValue: 'new' },
  adminNote: { type: DataTypes.STRING(2000), defaultValue: '' },
  ipAddress: { type: DataTypes.STRING(100), defaultValue: '' },
}, {
  sequelize,
  modelName: 'ContactMessage',
  tableName: 'contact_messages',
  timestamps: true,
  indexes: [ { fields: ['email','createdAt'] }, { fields: ['status'] } ],
});

export default ContactMessage;
