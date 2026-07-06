/**
 * Cố vấn tài chính thông minh (rule-based expert system)
 * Không dùng mô hình dự báo — chỉ áp dụng các quy tắc tài chính cá nhân đã biết
 * (50/30/20, 6 chiếc lọ), phát hiện bất thường bằng thống kê đơn giản, và so sánh
 * tiến độ thực tế với ngân sách/mục tiêu để đưa ra khuyến nghị hành động cụ thể.
 */
import { Transaction, Category, Goal, sequelize } from '../models/sequelize/index.js';
import { Op } from 'sequelize';
import * as budgetService from './budget.service.js';

const SEVERITY_RANK = { danger: 3, warning: 2, info: 1 };

// ── Helpers ──────────────────────────────────────────────────────────────

const monthRange = (year, month) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 0, 23, 59, 59),
});

const dayOfYear = (d) => {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.floor((d - start) / 86400000) + 1;
};

const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// % thời gian đã trôi qua của chu kỳ ngân sách hiện tại (dùng lịch thực, không phụ
// thuộc startDate của budget) để so với % ngân sách đã tiêu.
export const getElapsedTimePct = (period, now = new Date()) => {
  switch (period) {
    case 'weekly':
      return ((now.getDay() + 1) / 7) * 100; // Chủ nhật=0 → đã qua 1/7 tuần
    case 'yearly':
      return (dayOfYear(now) / (isLeapYear(now.getFullYear()) ? 366 : 365)) * 100;
    case 'monthly':
    default: {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return (now.getDate() / daysInMonth) * 100;
    }
  }
};

const monthKey = (y, m) => `${y}-${m}`;

// ── 1+2. Quy tắc 50/30/20 và góc nhìn "6 chiếc lọ" (ước lượng) ────────────

const buildBudgetRuleAnalysis = async (userId, year, month) => {
  const { start, end } = monthRange(year, month);

  const [categories, txRows] = await Promise.all([
    Category.findAll({ where: { userId }, attributes: ['name', 'group'], raw: true }),
    Transaction.findAll({
      where: { userId, parentId: null, date: { [Op.between]: [start, end] } },
      attributes: ['type', 'category', 'amount'],
      raw: true,
    }),
  ]);

  const groupByName = {};
  categories.forEach(c => { groupByName[c.name] = c.group; });

  const income = txRows.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenseRows = txRows.filter(t => t.type === 'expense');

  const totals = { need: 0, want: 0, saving: 0 };
  expenseRows.forEach(t => {
    // Danh mục chưa gán nhóm (vd đã xoá, hoặc tạo trước khi có tính năng này) → coi là "không thiết yếu"
    const group = groupByName[t.category] || 'want';
    totals[group] = (totals[group] || 0) + Number(t.amount);
  });

  const totalExpense = totals.need + totals.want + totals.saving;
  const actualSavings = income - totalExpense;

  const pct = (amount) => (income > 0 ? (amount / income) * 100 : 0);
  const needsPct = pct(totals.need);
  const wantsPct = pct(totals.want);
  const savingsPct = income > 0 ? (actualSavings / income) * 100 : 0;

  const verdict = (actualPct, targetPct, higherIsBetter = false) => {
    const diff = actualPct - targetPct;
    if (higherIsBetter) return diff >= -5 ? 'on_track' : 'under';
    return diff <= 5 ? 'on_track' : 'over';
  };

  const rule502030 = {
    income,
    needs: { amount: totals.need, percentage: +needsPct.toFixed(1), target: 50, verdict: verdict(needsPct, 50) },
    wants: { amount: totals.want, percentage: +wantsPct.toFixed(1), target: 30, verdict: verdict(wantsPct, 30) },
    savings: { amount: actualSavings, percentage: +savingsPct.toFixed(1), target: 20, verdict: verdict(savingsPct, 20, true) },
  };

  // 6 chiếc lọ: dùng lại đúng 3 tổng số ở trên, chỉ đổi mục tiêu % — không phải phân loại
  // chi tiết theo 6 nhãn riêng, nên chỉ mang tính tham khảo/ước lượng.
  const sixJars = {
    approximate: true,
    necessities:      { amount: totals.need, percentage: +needsPct.toFixed(1), target: 55, verdict: verdict(needsPct, 55) },
    playEduGive:      { amount: totals.want, percentage: +wantsPct.toFixed(1), target: 25, verdict: verdict(wantsPct, 25) },
    freedomAndSavings: { amount: actualSavings, percentage: +savingsPct.toFixed(1), target: 20, verdict: verdict(savingsPct, 20, true) },
  };

  return { rule502030, sixJars };
};

// ── 3. Phát hiện bất thường theo danh mục ─────────────────────────────────

const ANOMALY_INCREASE_THRESHOLD = 0.5; // tăng ≥ 50% so với trung bình
const ANOMALY_MIN_ABSOLUTE_CHANGE = 100000; // và mức tăng tuyệt đối ≥ 100,000đ để tránh nhiễu số nhỏ

const detectAnomalies = async (userId, year, month) => {
  const now = new Date(year, month - 1, 1);
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const yearFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%Y', sequelize.col('date')) : sequelize.fn('YEAR', sequelize.col('date'));
  const monthFn = sequelize.getDialect && sequelize.getDialect() === 'sqlite' ? sequelize.fn('strftime', '%m', sequelize.col('date')) : sequelize.fn('MONTH', sequelize.col('date'));

  const rows = await Transaction.findAll({
    where: { userId, type: 'expense', parentId: null, date: { [Op.between]: [rangeStart, rangeEnd] } },
    attributes: [[yearFn, 'year'], [monthFn, 'month'], 'category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    group: [yearFn, monthFn, 'category'],
    raw: true,
  });

  const byCategory = {};
  rows.forEach(r => {
    const y = parseInt(r.year, 10);
    const m = parseInt(r.month, 10);
    const cat = r.category;
    (byCategory[cat] ??= {})[monthKey(y, m)] = parseFloat(r.total || 0);
  });

  const currentKey = monthKey(year, month);
  const prevKeys = [1, 2, 3].map(i => {
    const d = new Date(year, month - 1 - i, 1);
    return monthKey(d.getFullYear(), d.getMonth() + 1);
  });

  const anomalies = [];
  Object.entries(byCategory).forEach(([category, monthData]) => {
    const current = monthData[currentKey] || 0;
    if (current <= 0) return;
    const history = prevKeys.map(k => monthData[k]).filter(v => v !== undefined);
    if (history.length === 0) return;
    const avg = history.reduce((s, v) => s + v, 0) / history.length;
    if (avg <= 0) return;
    const changePct = (current - avg) / avg;
    const absoluteChange = current - avg;
    if (changePct >= ANOMALY_INCREASE_THRESHOLD && absoluteChange >= ANOMALY_MIN_ABSOLUTE_CHANGE) {
      anomalies.push({
        category,
        currentAmount: current,
        averageAmount: Math.round(avg),
        changePct: Math.round(changePct * 100),
        severity: changePct >= 1 ? 'danger' : 'warning',
        message: `Chi tiêu mục "${category}" tháng này tăng ${Math.round(changePct * 100)}% so với trung bình ${history.length} tháng gần nhất`,
      });
    }
  });

  return anomalies.sort((a, b) => b.changePct - a.changePct);
};

// ── 4. Cảnh báo tiến độ ngân sách ──────────────────────────────────────────

const BUDGET_PACE_GAP_THRESHOLD = 15; // điểm phần trăm

const detectBudgetPaceWarnings = async (userId) => {
  const budgets = await budgetService.getBudgets(userId);
  const now = new Date();
  const warnings = [];

  budgets.forEach(b => {
    if (!b.effectiveAmount || b.effectiveAmount <= 0) return;
    const spentPct = (b.currentSpending / b.effectiveAmount) * 100;
    const elapsedPct = getElapsedTimePct(b.period, now);
    const gap = spentPct - elapsedPct;

    if (b.isOverBudget) {
      warnings.push({
        budgetId: b.id,
        categoryName: b.categoryName || 'Tổng',
        spentPct: Math.round(spentPct),
        elapsedPct: Math.round(elapsedPct),
        severity: 'danger',
        message: `Đã vượt ngân sách "${b.categoryName || 'Tổng'}" ${Math.round(spentPct - 100)}%`,
      });
    } else if (gap >= BUDGET_PACE_GAP_THRESHOLD) {
      warnings.push({
        budgetId: b.id,
        categoryName: b.categoryName || 'Tổng',
        spentPct: Math.round(spentPct),
        elapsedPct: Math.round(elapsedPct),
        severity: gap >= 30 ? 'danger' : 'warning',
        message: `Bạn đã tiêu ${Math.round(spentPct)}% ngân sách "${b.categoryName || 'Tổng'}" nhưng kỳ này mới trôi qua ${Math.round(elapsedPct)}% thời gian. Hãy hạn chế chi tiêu để không bị thâm hụt.`,
      });
    }
  });

  return warnings.sort((a, b) => (b.spentPct - b.elapsedPct) - (a.spentPct - a.elapsedPct));
};

// ── 5. Cảnh báo tiến độ mục tiêu tiết kiệm ─────────────────────────────────

const detectGoalPaceWarnings = async (userId) => {
  const goals = await Goal.findAll({ where: { userId, isAchieved: false } });
  const now = new Date();
  const warnings = [];

  goals.forEach(goal => {
    const createdAt = new Date(goal.createdAt);
    const deadline = new Date(goal.deadline);
    const target = Number(goal.targetAmount) || 0;
    const current = Number(goal.currentAmount) || 0;
    const remaining = Math.max(target - current, 0);
    if (remaining <= 0) return;

    const totalPlannedMonths = Math.max((deadline - createdAt) / (1000 * 60 * 60 * 24 * 30), 0.1);
    const monthsElapsed = Math.max((now - createdAt) / (1000 * 60 * 60 * 24 * 30), 0.1);
    const plannedMonthsRemaining = Math.max((deadline - now) / (1000 * 60 * 60 * 24 * 30), 0);

    const actualMonthlyRate = current / monthsElapsed;
    if (actualMonthlyRate <= 0) {
      warnings.push({
        goalId: goal.id,
        name: goal.name,
        severity: plannedMonthsRemaining < totalPlannedMonths * 0.5 ? 'danger' : 'warning',
        message: `Mục tiêu "${goal.name}" chưa ghi nhận khoản tiết kiệm nào. Hãy bắt đầu nạp tiền để kịp hạn ${deadline.toLocaleDateString('vi-VN')}.`,
      });
      return;
    }

    const projectedMonthsRemaining = remaining / actualMonthlyRate;
    const delayMonths = Math.round(projectedMonthsRemaining - plannedMonthsRemaining);

    if (delayMonths >= 1) {
      warnings.push({
        goalId: goal.id,
        name: goal.name,
        projectedMonthsRemaining: Math.round(projectedMonthsRemaining),
        plannedMonthsRemaining: Math.round(plannedMonthsRemaining),
        delayMonths,
        severity: delayMonths >= 3 ? 'danger' : 'warning',
        message: `Với tốc độ tiết kiệm hiện tại, bạn cần thêm ${Math.round(projectedMonthsRemaining)} tháng nữa mới đạt mục tiêu "${goal.name}", chậm ${delayMonths} tháng so với kế hoạch ban đầu.`,
      });
    }
  });

  return warnings.sort((a, b) => (b.delayMonths || 0) - (a.delayMonths || 0));
};

// ── Tổng hợp ────────────────────────────────────────────────────────────

export const getFinancialAdvice = async (userId, query = {}) => {
  const now = new Date();
  const year = parseInt(query.year, 10) || now.getFullYear();
  const month = parseInt(query.month, 10) || now.getMonth() + 1;

  const [{ rule502030, sixJars }, anomalies, budgetPaceWarnings, goalPaceWarnings] = await Promise.all([
    buildBudgetRuleAnalysis(userId, year, month),
    detectAnomalies(userId, year, month),
    detectBudgetPaceWarnings(userId),
    detectGoalPaceWarnings(userId),
  ]);

  const tips = [
    ...(rule502030.needs.verdict === 'over' ? [{ severity: rule502030.needs.percentage - 50 >= 15 ? 'danger' : 'warning', message: `Chi tiêu thiết yếu đang chiếm ${rule502030.needs.percentage}% thu nhập, cao hơn mức khuyến nghị 50%.` }] : []),
    ...(rule502030.wants.verdict === 'over' ? [{ severity: rule502030.wants.percentage - 30 >= 15 ? 'danger' : 'warning', message: `Chi tiêu không thiết yếu đang chiếm ${rule502030.wants.percentage}% thu nhập, cao hơn mức khuyến nghị 30%.` }] : []),
    ...(rule502030.savings.verdict === 'under' ? [{ severity: rule502030.savings.percentage < 10 ? 'danger' : 'warning', message: `Tỷ lệ tiết kiệm chỉ đạt ${rule502030.savings.percentage}% thu nhập, thấp hơn mức khuyến nghị 20%.` }] : []),
    ...anomalies.map(a => ({ severity: a.severity, message: a.message })),
    ...budgetPaceWarnings.map(w => ({ severity: w.severity, message: w.message })),
    ...goalPaceWarnings.map(w => ({ severity: w.severity, message: w.message })),
  ].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);

  return {
    period: { year, month },
    rule502030,
    sixJars,
    anomalies,
    budgetPaceWarnings,
    goalPaceWarnings,
    tips,
  };
};
