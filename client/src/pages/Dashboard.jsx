import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../services/stats.service';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiAlertTriangle, FiTarget, FiSun, FiMoon, FiClock, FiList, FiArrowUpRight, FiArrowDownRight, FiPlus, FiPieChart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCategories } from '../context/CategoryContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Area, AreaChart } from 'recharts';
import PageTransition from '../components/PageTransition';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import OnboardingModal from '../components/OnboardingModal';

const Dashboard = () => {
  const { user } = useAuth();
  const { categories, fetchCategories } = useCategories();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [filteredSummary, setFilteredSummary] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [lastMonthCategoryStats, setLastMonthCategoryStats] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month');
  const [dailyFluctuation, setDailyFluctuation] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [timeFilter]);

  // Hiện onboarding nếu user mới chưa có danh mục
  useEffect(() => {
    if (!loading && categories.length === 0 && !localStorage.getItem('onboardingDone')) {
      setShowOnboarding(true);
    }
  }, [loading, categories.length]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - diff), 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      // Single API call replaces 9+ separate requests
      const response = await statsService.getDashboard(startDate, endDate);
      const data = response.data;

      setSummary(data.summary);
      setFilteredSummary(data.filteredSummary);
      setMonthlyStats(data.monthlyStats || []);
      setCategoryStats(data.categoryStats || []);
      setLastMonthCategoryStats(data.lastMonthCategoryStats || []);
      setDailyFluctuation(data.dailyFluctuation || []);
      setGoals(Array.isArray(data.goals) ? data.goals : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Chào buổi sáng', icon: <FiSun className="text-amber-500" size={22} /> };
    if (hour < 18) return { text: 'Chào buổi chiều', icon: <FiClock className="text-orange-500" size={22} /> };
    return { text: 'Chào buổi tối', icon: <FiMoon className="text-indigo-500" size={22} /> };
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'hôm nay';
      case 'week': return 'tuần này';
      case 'year': return 'năm nay';
      default: return 'tháng này';
    }
  };

  const getAIInsight = () => {
    if (timeFilter !== 'month' || !monthlyStats || monthlyStats.length < 2) return null;
    const thisMonthData = monthlyStats[monthlyStats.length - 1];
    const lastMonthData = monthlyStats[monthlyStats.length - 2];
    if (!thisMonthData || !lastMonthData) return null;
    const thisMonthBalance = (thisMonthData.totalIncome || 0) - (thisMonthData.totalExpense || 0);
    const lastMonthBalance = (lastMonthData.totalIncome || 0) - (lastMonthData.totalExpense || 0);
    const change = thisMonthBalance - lastMonthBalance;
    const percentChange = lastMonthBalance !== 0 ? ((change / Math.abs(lastMonthBalance)) * 100).toFixed(1) : (thisMonthBalance > 0 ? 100 : 0);
    if (change > 0) return { message: `Tiết kiệm tốt hơn ${Math.abs(percentChange)}% so với tháng trước`, type: 'success' };
    if (change < 0) return { message: `Tiết kiệm giảm ${Math.abs(percentChange)}% so với tháng trước`, type: 'warning' };
    return { message: 'Tiết kiệm ổn định so với tháng trước', type: 'info' };
  };

  const getBudgetAlert = () => {
    if (!filteredSummary || !filteredSummary.income) return null;
    const percentage = (filteredSummary.expense / filteredSummary.income) * 100;
    if (percentage >= 90) return { message: `Bạn đã chi ${percentage.toFixed(0)}% thu nhập trong kỳ này — cần kiểm soát ngay!`, level: 'danger' };
    if (percentage >= 80) return { message: `Bạn đã chi ${percentage.toFixed(0)}% thu nhập trong kỳ này — hãy cẩn thận hơn.`, level: 'warning' };
    return null;
  };

  const getSavingsGoal = () => {
    const activeGoals = goals.filter(g => !g.isAchieved);
    if (activeGoals.length === 0) return { target: 0, current: filteredSummary?.balance || 0, percentage: 0, goalName: 'Chưa có mục tiêu', hasGoal: false };
    const sortedGoals = activeGoals.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[b.priority] - priorityOrder[a.priority];
      return new Date(a.deadline) - new Date(b.deadline);
    });
    const primaryGoal = sortedGoals[0];
    const percentage = Math.min((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100, 100);
    return { target: primaryGoal.targetAmount, current: primaryGoal.currentAmount, percentage: percentage.toFixed(1), goalName: primaryGoal.name, icon: primaryGoal.icon || '🎯', deadline: primaryGoal.deadline, daysRemaining: primaryGoal.daysRemaining, hasGoal: true, totalGoals: activeGoals.length };
  };

  const getChartData = () => {
    return monthlyStats.map(stat => ({
      month: `T${stat.month}`,
      'Thu nhập': stat.totalIncome || 0,
      'Chi tiêu': stat.totalExpense || 0,
      'Tiết kiệm': Math.max((stat.totalIncome || 0) - (stat.totalExpense || 0), 0)
    }));
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // ── Custom Tooltip for Charts ──
  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-[#2a2a2a] rounded-xl shadow-xl p-3 min-w-[160px]">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="text-gray-600 dark:text-gray-300">{p.name}</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  const greeting = getGreeting();
  const budgetAlert = getBudgetAlert();
  const savingsGoal = getSavingsGoal();
  const aiInsight = getAIInsight();
  const spendingPct = filteredSummary?.income > 0 ? Math.min((filteredSummary.expense / filteredSummary.income) * 100, 100) : 0;

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>;

  return (
    <PageTransition>
      <div className="space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              {greeting.icon}
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {greeting.text},{' '}
                <span className="text-emerald-600 dark:text-emerald-400">{user?.name}</span>
              </h1>
            </div>
            {aiInsight && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mt-1.5 ${
                aiInsight.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                aiInsight.type === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' :
                'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
              }`}>
                {aiInsight.type === 'success' ? '📈' : aiInsight.type === 'warning' ? '⚠️' : '💡'}
                {aiInsight.message}
              </span>
            )}
          </div>

          {/* Segmented time filter */}
          <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5 self-start sm:self-auto">
            {[
              { label: 'Hôm nay', value: 'today' },
              { label: 'Tuần này', value: 'week' },
              { label: 'Tháng này', value: 'month' },
              { label: 'Năm nay', value: 'year' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setTimeFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  timeFilter === f.value
                    ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Budget Alert ── */}
        {budgetAlert && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            budgetAlert.level === 'danger'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
          }`}>
            <FiAlertTriangle size={16} className="flex-shrink-0" />
            {budgetAlert.message}
          </div>
        )}

        {/* ── Category Insights (so sánh tháng trước) ── */}
        {(() => {
          if (!lastMonthCategoryStats.length || !categoryStats.length) return null;
          const insights = categoryStats
            .filter(c => c.type === 'expense')
            .map(cur => {
              const prev = lastMonthCategoryStats.find(p => p.category === cur.category && p.type === 'expense');
              if (!prev || prev.total === 0) return null;
              const pct = ((cur.total - prev.total) / prev.total) * 100;
              if (Math.abs(pct) < 20) return null;
              return { category: cur.category, pct };
            })
            .filter(Boolean)
            .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
            .slice(0, 3);
          if (!insights.length) return null;
          return (
            <div className="flex flex-wrap gap-2">
              {insights.map(({ category, pct }) => (
                <span
                  key={category}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
                    pct > 0
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400'
                  }`}
                >
                  {pct > 0 ? '📈' : '📉'}
                  {category} {pct > 0 ? 'tăng' : 'giảm'} {Math.abs(pct).toFixed(0)}% so với tháng trước
                </span>
              ))}
            </div>
          );
        })()}

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: `Thu nhập ${getTimeFilterLabel()}`,
              value: filteredSummary?.income || 0,
              icon: <FiArrowUpRight size={18} />,
              color: 'emerald',
              border: 'border-l-emerald-500',
              iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
              valueColor: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: `Chi tiêu ${getTimeFilterLabel()}`,
              value: filteredSummary?.expense || 0,
              icon: <FiArrowDownRight size={18} />,
              color: 'red',
              border: 'border-l-red-500',
              iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
              valueColor: 'text-red-600 dark:text-red-400',
              sub: filteredSummary?.income > 0 ? `${spendingPct.toFixed(0)}% thu nhập` : null,
            },
            {
              label: `Số dư ${getTimeFilterLabel()}`,
              value: filteredSummary?.balance || 0,
              icon: <FiDollarSign size={18} />,
              color: 'blue',
              border: 'border-l-blue-500',
              iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
              valueColor: (filteredSummary?.balance || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400',
            },
            {
              label: `Giao dịch ${getTimeFilterLabel()}`,
              value: null,
              displayValue: filteredSummary?.transactionCount || 0,
              displayUnit: 'giao dịch',
              icon: <FiActivity size={18} />,
              color: 'purple',
              border: 'border-l-purple-500',
              iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400',
              valueColor: 'text-purple-600 dark:text-purple-400',
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${card.border} rounded-2xl p-4 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-snug pr-2">{card.label}</p>
                <div className={`p-2 rounded-xl flex-shrink-0 ${card.iconBg}`}>{card.icon}</div>
              </div>
              <p className={`text-xl font-bold ${card.valueColor}`}>
                {card.displayValue !== undefined
                  ? card.displayValue
                  : formatCurrency(card.value)}
              </p>
              {card.displayUnit && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.displayUnit}</p>
              )}
              {card.sub && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Net Worth ── */}
        {summary?.overall && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 border-l-indigo-500 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng tài sản ròng (Net Worth)</p>
              <p className={`text-xl font-black ${summary.overall.balance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(summary.overall.balance)}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Tích lũy từ trước đến nay</p>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 border-l-emerald-500 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng thu nhập tích lũy</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.overall.totalIncome)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{summary.overall.transactionCount} giao dịch</p>
            </div>
            <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 border-l-red-400 rounded-2xl p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng chi tiêu tích lũy</p>
              <p className="text-xl font-black text-red-500 dark:text-red-400">{formatCurrency(summary.overall.totalExpense)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Tỷ lệ tiết kiệm:{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {summary.overall.totalIncome > 0
                    ? `${(((summary.overall.totalIncome - summary.overall.totalExpense) / summary.overall.totalIncome) * 100).toFixed(1)}%`
                    : '—'}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ── Spending Ratio ── */}
        {filteredSummary?.income > 0 && (
          <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Tỷ lệ chi tiêu {getTimeFilterLabel()}
              </span>
              <span className={`text-sm font-bold ${
                spendingPct >= 90 ? 'text-red-600 dark:text-red-400' :
                spendingPct >= 70 ? 'text-amber-600 dark:text-amber-400' :
                'text-emerald-600 dark:text-emerald-400'
              }`}>
                {spendingPct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  spendingPct >= 90 ? 'bg-red-500' :
                  spendingPct >= 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${spendingPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              <span>Chi: {formatCurrency(filteredSummary.expense)}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Còn lại: {formatCurrency(Math.max(filteredSummary.income - filteredSummary.expense, 0))}
              </span>
              <span>Thu: {formatCurrency(filteredSummary.income)}</span>
            </div>
          </div>
        )}

        {/* ── Goal + Recent Transactions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Savings Goal */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiTarget className="text-purple-600 dark:text-purple-400" size={17} />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Mục tiêu tiết kiệm</h3>
            </div>
            {savingsGoal.hasGoal ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-500/20 dark:to-pink-500/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {savingsGoal.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{savingsGoal.goalName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatCurrency(savingsGoal.current)} / {formatCurrency(savingsGoal.target)}
                    </p>
                  </div>
                  {savingsGoal.daysRemaining !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-black text-purple-600 dark:text-purple-400 leading-none">{savingsGoal.daysRemaining}</p>
                      <p className="text-xs text-gray-400">ngày còn</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Tiến độ</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">{savingsGoal.percentage}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${savingsGoal.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-right">
                    {parseFloat(savingsGoal.percentage) >= 100
                      ? '🎉 Đã hoàn thành!'
                      : `Còn ${formatCurrency(savingsGoal.target - savingsGoal.current)} nữa`}
                  </p>
                </div>
                {savingsGoal.totalGoals > 1 && (
                  <button
                    onClick={() => navigate('/goals')}
                    className="mt-3 w-full text-xs text-purple-600 dark:text-purple-400 font-semibold hover:underline text-center"
                  >
                    +{savingsGoal.totalGoals - 1} mục tiêu khác →
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">🎯</div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Chưa có mục tiêu</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Tạo mục tiêu để theo dõi tiết kiệm</p>
                <button
                  onClick={() => navigate('/goals')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 transition-colors"
                >
                  <FiPlus size={13} /> Tạo mục tiêu
                </button>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-3 bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiList className="text-gray-500 dark:text-gray-400" size={17} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Giao dịch gần đây</h3>
                {filteredSummary?.recentTransactions?.length > 0 && (
                  <span className="text-xs bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                    {filteredSummary.recentTransactions.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Xem tất cả <FiArrowUpRight size={12} />
              </button>
            </div>

            <div className="space-y-2">
              {filteredSummary?.recentTransactions?.length > 0 ? (
                filteredSummary.recentTransactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors group"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-100 dark:bg-emerald-500/15'
                        : 'bg-red-100 dark:bg-red-500/15'
                    }`}>
                      {tx.type === 'income' ? '📈' : '📉'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{tx.category}</p>
                      {tx.note && <p className="text-xs text-gray-400 truncate">{tx.note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${
                        tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3">
                    <FiActivity className="text-gray-300 dark:text-gray-600" size={22} />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có giao dịch nào</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Charts Row 1: 7-day + 6-month ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Daily 7-day chart */}
          <div className="lg:col-span-3 bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiActivity className="text-blue-500" size={16} />
                Thu - Chi 7 ngày gần nhất
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Biến động tài chính hàng ngày</p>
            </div>
            {dailyFluctuation.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={dailyFluctuation} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#2a2a2a]" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v/1e6).toFixed(1)}tr`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="income" fill="#10b981" name="Thu nhập" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#f87171" name="Chi tiêu" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="avgIncome" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="TB Thu" />
                    <Line type="monotone" dataKey="avgExpense" stroke="#f87171" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="TB Chi" />
                  </ComposedChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { label: 'TB Thu/ngày', value: formatCurrency(dailyFluctuation.reduce((s,d)=>s+d.income,0)/dailyFluctuation.length), color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { label: 'TB Chi/ngày', value: formatCurrency(dailyFluctuation.reduce((s,d)=>s+d.expense,0)/dailyFluctuation.length), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
                    { label: 'Ngày dương', value: `${dailyFluctuation.filter(d=>d.balance>0).length}/${dailyFluctuation.length}`, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                  ].map((s, i) => (
                    <div key={i} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
                      <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>

          {/* Category breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiPieChart className="text-purple-500" size={16} />
                Chi tiêu theo danh mục
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Phân bố {getTimeFilterLabel()}</p>
            </div>
            {categoryStats.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={categoryStats.slice(0, 6).map(cat => ({ name: cat.category, value: cat.expense }))}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryStats.slice(0, 6).map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {categoryStats.slice(0, 5).map((cat, idx) => {
                    const total = categoryStats.reduce((s, c) => s + c.expense, 0);
                    const pct = total > 0 ? ((cat.expense / total) * 100).toFixed(0) : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[100px]">{cat.category}</span>
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-200">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* ── 6-month Bar Chart ── */}
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-5">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiTrendingUp className="text-emerald-500" size={16} />
              Xu hướng Thu - Chi 6 tháng gần nhất
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">So sánh thu nhập, chi tiêu và tiết kiệm theo tháng</p>
          </div>
          {monthlyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getChartData()} margin={{ top: 4, right: 4, left: -10, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#2a2a2a]" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${(v/1e6).toFixed(0)}tr`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar dataKey="Thu nhập" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Chi tiêu" fill="#f87171" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Tiết kiệm" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">Chưa có dữ liệu thống kê</div>
          )}
        </div>

      </div>

      {/* ── Onboarding ── */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => {
            setShowOnboarding(false);
            fetchCategories();
          }}
        />
      )}
    </PageTransition>
  );
};

export default Dashboard;
