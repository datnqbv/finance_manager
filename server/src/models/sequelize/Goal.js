import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Goal extends Model {
  get progressPercentage() {
    if (!this.targetAmount || Number(this.targetAmount) === 0) return 0;
    return Math.min((Number(this.currentAmount) / Number(this.targetAmount)) * 100, 100);
  }

  get remainingAmount() {
    const target = Number(this.targetAmount) || 0;
    const current = Number(this.currentAmount) || 0;
    return Math.max(target - current, 0);
  }

  get daysRemaining() {
    if (this.isAchieved) return 0;
    if (!this.deadline) return 0;
    const now = new Date();
    const deadline = new Date(this.deadline);
    if (isNaN(deadline.getTime())) return 0;
    const diff = deadline - now;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  }


  async addAmount(amount, note = '') {
    this.currentAmount = Number(this.currentAmount) + Number(amount);
    const history = Array.isArray(this.depositHistory) ? this.depositHistory : [];
    history.push({ amount: Number(amount), note, date: new Date() });
    this.depositHistory = history;

    if (Number(this.currentAmount) >= Number(this.targetAmount) && !this.isAchieved) {
      this.isAchieved = true;
      this.achievedDate = new Date();
    }

    await this.save();
    return this;
  }

  get dailySaving() {
    if (this.isAchieved) return 0;
    const remaining = this.remainingAmount;
    const daysLeft = this.daysRemaining;
    if (daysLeft <= 0) return remaining;
    return Math.ceil(remaining / daysLeft);
  }

  get weeklySaving() {
    if (this.isAchieved) return 0;
    const remaining = this.remainingAmount;
    const daysLeft = this.daysRemaining;
    if (daysLeft <= 0) return remaining;
    const weeksLeft = daysLeft / 7;
    return Math.ceil(remaining / weeksLeft);
  }

  calculateMonthlySaving() {
    if (this.isAchieved) return 0;
    const remaining = this.remainingAmount;
    const daysLeft = this.daysRemaining;
    if (daysLeft <= 0) return remaining;
    const monthsLeft = daysLeft / 30;
    return Math.ceil(remaining / monthsLeft);
  }
}

Goal.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(500), allowNull: true },
  targetAmount: { type: DataTypes.DECIMAL(18,2), allowNull: false },
  currentAmount: { type: DataTypes.DECIMAL(18,2), defaultValue: 0 },
  deadline: { type: DataTypes.DATE, allowNull: false },
  priority: { type: DataTypes.ENUM('high','medium','low'), defaultValue: 'medium' },
  icon: { type: DataTypes.STRING, defaultValue: '🎯' },
  color: { type: DataTypes.STRING(7), defaultValue: '#3B82F6' },
  isAchieved: { type: DataTypes.BOOLEAN, defaultValue: false },
  achievedDate: { type: DataTypes.DATE, allowNull: true },
  depositHistory: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() { const raw = this.getDataValue('depositHistory'); try { return JSON.parse(raw || '[]'); } catch(e){ return []; } },
    set(val) { this.setDataValue('depositHistory', JSON.stringify(val || [])); }
  },
}, {
  sequelize,
  modelName: 'Goal',
  tableName: 'goals',
  timestamps: true,
  indexes: [ { fields: ['userId','isAchieved'] }, { fields: ['userId','deadline'] } ],
});

export default Goal;
