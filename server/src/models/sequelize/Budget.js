import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../config/sqlserver.js';

class Budget extends Model {
  get currentSpending() {
    return this._currentSpending || 0;
  }

  checkAlerts(currentSpending, effectiveAmount) {
    const base = effectiveAmount ?? this.amount;
    const percentage = base ? (currentSpending / base) * 100 : 0;
    const triggeredAlerts = (this.alertThresholds || []).filter(threshold =>
      percentage >= threshold && this.notificationEnabled
    );
    return {
      percentage: Math.round(percentage),
      triggeredAlerts,
      isOverBudget: percentage > 100,
    };
  }
}

Budget.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: { type: DataTypes.UUID, allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: true },
  categoryName: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.DECIMAL(18,2), allowNull: false },
  period: { type: DataTypes.ENUM('monthly','weekly','yearly'), defaultValue: 'monthly' },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  alertThresholds: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('alertThresholds');
      try { return JSON.parse(raw || '[]'); } catch(e) { return []; }
    },
    set(val) { this.setDataValue('alertThresholds', JSON.stringify(val || [])); }
  },
  notificationEnabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  rolloverEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  rolloverAmount: { type: DataTypes.DECIMAL(18,2), defaultValue: 0 },
  lastRolloverMonth: { type: DataTypes.STRING, defaultValue: '' },
}, {
  sequelize,
  modelName: 'Budget',
  tableName: 'budgets',
  timestamps: true,
  indexes: [
    { fields: ['userId','categoryId'] },
    { fields: ['userId','isActive'] },
  ],
});

export default Budget;
