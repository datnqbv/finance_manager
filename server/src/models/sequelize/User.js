import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../../config/sqlserver.js';

class User extends Model {
  async comparePassword(enteredPassword) {
    if (!this.password) return false;
    return bcrypt.compare(enteredPassword, this.password);
  }

  createPasswordResetToken() {
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetPasswordToken = bcrypt.hashSync(resetToken, 10);
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: false,
  },
  lastLoginDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  budget: {
    type: DataTypes.DECIMAL(18,2),
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.ENUM('VND','USD','EUR'),
    defaultValue: 'VND',
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isVip: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  vipExpire: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpire: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['googleId'] },
  ],
});

User.beforeSave(async (user, options) => {
  if (user.changed('password') && user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

export default User;
