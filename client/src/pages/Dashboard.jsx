import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../services/stats.service';
import { FiTrendingUp, FiDollarSign, FiActivity, FiAlertTriangle, FiTarget, FiSun, FiMoon, FiClock, FiList, FiArrowUpRight, FiArrowDownRight, FiPlus, FiPieChart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line } from 'recharts';
import PageTransition from '../components/PageTransition';
import { DashboardSkeleton } from '../components/LoadingSkeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const { revision: transactionRevision } = useTransactions();
  const { categories, fetchCategories } = useCategories();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
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
  const [txFilter, setTxFilter] = useState('all');
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [timeFilter, user?.id, transactionRevision]);

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

  const getPeriodScopeLabel = () => {
    switch (timeFilter) {
      case 'today':
        return isEnglish ? 'Today only' : 'Chỉ hôm nay';
      case 'week':
        return isEnglish ? 'This week' : 'Tuần này';
      case 'year':
        return isEnglish ? 'This year' : 'Năm nay';
      case 'month':
      default:
        return isEnglish ? 'This month' : 'Tháng này';
    }
  };

  const getRangeText = () => {
    const { startDate, endDate } = getDateRange();
    const start = new Date(startDate).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const end = new Date(endDate).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setSummary(null);
    setFilteredSummary(null);
    setMonthlyStats([]);
    setCategoryStats([]);
    setLastMonthCategoryStats([]);
    setDailyFluctuation([]);
    setGoals([]);
    setForecastData(null);
    try {
      const { startDate, endDate } = getDateRange();

      const [dashboardResult, forecastResult] = await Promise.allSettled([
        statsService.getDashboard(startDate, endDate),
        statsService.forecastSpending(6),
      ]);

      if (dashboardResult.status !== 'fulfilled') {
        throw dashboardResult.reason;
      }

      const data = dashboardResult.value.data;

      setSummary(data.summary);
      setFilteredSummary(data.filteredSummary);
      setMonthlyStats(data.monthlyStats || []);
      setCategoryStats(data.categoryStats || []);
      setLastMonthCategoryStats(data.lastMonthCategoryStats || []);
      setDailyFluctuation(data.dailyFluctuation || []);
      setGoals(Array.isArray(data.goals) ? data.goals : []);

      if (forecastResult.status === 'fulfilled') {
        setForecastData(forecastResult.value?.data || null);
      } else {
        setForecastData(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: t('goodMorning'), icon: <FiSun className="text-amber-500" size={22} /> };
    if (hour < 18) return { text: t('goodAfternoon'), icon: <FiClock className="text-orange-500" size={22} /> };
    return { text: t('goodEvening'), icon: <FiMoon className="text-indigo-500" size={22} /> };
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return t('today');
      case 'week': return t('thisWeek');
      case 'year': return t('thisYear');
      default: return t('thisMonth');
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
    if (change > 0) return { message: isEnglish ? `Savings improved by ${Math.abs(percentChange)}% compared to last month` : `Tiết kiệm tốt hơn ${Math.abs(percentChange)}% so với tháng trước`, type: 'success' };
    if (change < 0) return { message: isEnglish ? `Savings decreased by ${Math.abs(percentChange)}% compared to last month` : `Tiết kiệm giảm ${Math.abs(percentChange)}% so với tháng trước`, type: 'warning' };
    return { message: isEnglish ? 'Savings are stable compared to last month' : 'Tiết kiệm ổn định so với tháng trước', type: 'info' };
  };

  const getBudgetAlert = () => {
    if (!filteredSummary || !filteredSummary.income) return null;
    const percentage = (filteredSummary.expense / filteredSummary.income) * 100;
    if (percentage >= 90) return { message: isEnglish ? `You spent ${percentage.toFixed(0)}% of your income this period - immediate control is needed!` : `Bạn đã chi ${percentage.toFixed(0)}% thu nhập trong kỳ này — cần kiểm soát ngay!`, level: 'danger' };
    if (percentage >= 80) return { message: isEnglish ? `You spent ${percentage.toFixed(0)}% of your income this period - be more careful.` : `Bạn đã chi ${percentage.toFixed(0)}% thu nhập trong kỳ này — hãy cẩn thận hơn.`, level: 'warning' };
    return null;
  };

  const getSavingsGoal = () => {
    const activeGoals = goals.filter(g => !g.isAchieved);
    if (activeGoals.length === 0) return { target: 0, current: filteredSummary?.balance || 0, percentage: 0, goalName: isEnglish ? 'No goals yet' : 'Chưa có mục tiêu', hasGoal: false };
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
      [t('monthlyIncome')]: stat.totalIncome || 0,
      [t('monthlyExpense')]: stat.totalExpense || 0,
      [isEnglish ? 'Savings' : 'Tiết kiệm']: Math.max((stat.totalIncome || 0) - (stat.totalExpense || 0), 0)
    }));
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit' });
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
  const topGoals = goals
    .filter((goal) => !goal.isAchieved)
    .slice(0, 3)
    .map((goal) => ({
      ...goal,
      progress: goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0,
    }));

  const monthChange = (() => {
    if (!monthlyStats || monthlyStats.length < 2) return 0;
    const thisMonth = monthlyStats[monthlyStats.length - 1];
    const prevMonth = monthlyStats[monthlyStats.length - 2];
    const thisBalance = (thisMonth.totalIncome || 0) - (thisMonth.totalExpense || 0);
    const prevBalance = (prevMonth.totalIncome || 0) - (prevMonth.totalExpense || 0);
    if (!prevBalance) return thisBalance > 0 ? 100 : 0;
    return ((thisBalance - prevBalance) / Math.abs(prevBalance)) * 100;
  })();

  const recentTransactions = (filteredSummary?.recentTransactions || []).filter((tx) => {
    if (txFilter === 'income') return tx.type === 'income';
    if (txFilter === 'expense') return tx.type === 'expense';
    return true;
  });

  const currentExpense = filteredSummary?.expense || monthlyStats[monthlyStats.length - 1]?.totalExpense || 0;
  const forecastExpense = forecastData?.forecast?.nextMonthExpense || 0;
  const forecastLow = forecastData?.forecast?.marginLow ?? (forecastExpense * 0.9);
  const forecastHigh = forecastData?.forecast?.marginHigh ?? (forecastExpense * 1.1);
  const forecastDelta = forecastExpense - currentExpense;
  const forecastDeltaPct = currentExpense > 0 ? (forecastDelta / currentExpense) * 100 : 0;
  const topForecastCategories = Object.entries(forecastData?.byCategory || {})
    .map(([name, item]) => ({
      name,
      amount: item?.forecast || 0,
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
  const topForecastTotal = topForecastCategories.reduce((sum, item) => sum + item.amount, 0);

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>;

  return (
    <PageTransition>
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
            <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{greeting.text}</p>
              <h1 className="mt-3 text-5xl font-black tracking-tight">{formatCurrency(filteredSummary?.balance || 0)}</h1>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
                <FiTrendingUp size={12} />
                {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(1)}% {t('monthlyComparison')}
              </div>
              <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#d8fff2]">
                <span className="font-semibold uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Data scope' : 'Phạm vi dữ liệu'}</span>
                <span>{getPeriodScopeLabel()}</span>
                <span className="opacity-70">|</span>
                <span>{getRangeText()}</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d4efe7]">
                {isEnglish
                  ? 'The dashboard summary only changes when new transactions fall inside the selected time filter.'
                  : 'Tổng quan chỉ thay đổi khi giao dịch mới nằm trong đúng khoảng thời gian đang chọn.'}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{t('monthlyIncome')}</p>
                  <p className="mt-1 text-2xl font-bold">{formatCurrency(filteredSummary?.income || 0)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{t('monthlyExpense')}</p>
                  <p className="mt-1 text-2xl font-bold">{formatCurrency(filteredSummary?.expense || 0)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{t('savingsRate')}</p>
                  <p className="mt-1 text-2xl font-bold">{Math.max(100 - spendingPct, 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">{t('goalProgress')}</h3>
                <button onClick={() => navigate('/goals')} className="text-xs font-semibold text-[#3a4a62] hover:underline dark:text-[#b9c3d0]">
                  {t('viewAll')}
                </button>
              </div>

              <div className="space-y-3">
                {topGoals.length > 0 ? topGoals.map((goal) => (
                  <div key={goal._id || goal.name}>
                    <div className="mb-1 flex items-center justify-between text-xs text-[#586074] dark:text-[#a9afbb]">
                      <span className="font-semibold">{goal.name}</span>
                      <span className="font-bold">{goal.progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                      <div className="h-full rounded-full bg-[#003d2d] dark:bg-[#2f8e6f]" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{t('noGoals')}</p>
                )}
              </div>

              <div className="mt-4 rounded-xl bg-[#f1f4f8] p-3 dark:bg-[#222935]">
                <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{t('intelligentSuggestion')}</p>
                <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                  {aiInsight?.message || t('defaultSuggestion')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {budgetAlert && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            budgetAlert.level === 'danger'
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300'
              : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300'
          }`}>
            <FiAlertTriangle size={16} /> {budgetAlert.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Financial Trend' : 'Biến động tài chính'}</h3>
                <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? `${t('monthlyIncome')} ${t('and')} ${t('monthlyExpense')} over the last 6 months` : `${t('monthlyIncome')} ${t('and')} ${t('monthlyExpense')} trong 6 tháng qua`}</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-[#5e6573] dark:text-[#a7afbc]">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#003d2d]" /> {t('monthlyIncome')}</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#a8b6cf]" /> {t('monthlyExpense')}</span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={255}>
              <BarChart data={getChartData()} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="2 4" stroke="#edf1f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6e7380' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey={t('monthlyIncome')} fill="#003d2d" radius={[8, 8, 0, 0]} maxBarSize={34} />
                <Bar dataKey={t('monthlyExpense')} fill="#b9c5db" radius={[8, 8, 0, 0]} maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="xl:col-span-4 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{t('expenseForecast')}</h3>
              <span className="text-xs font-semibold text-[#3a4a62] dark:text-[#b9c3d0]">{isEnglish ? `${t('currentExpense')} onward` : `${t('currentExpense')} tới`}</span>
            </div>

            <div className="mb-3 rounded-xl bg-[#f1f4f8] p-3 dark:bg-[#222935]">
              <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{t('forecastedExpense')}</p>
              <p className="mt-1 text-lg font-black text-[#1f2733] dark:text-[#e8edf4]">{formatCurrency(forecastExpense)}</p>
              <p className={`mt-1 text-xs font-semibold ${forecastDelta > 0 ? 'text-[#b54747] dark:text-[#f3a5a5]' : 'text-[#2f8e6f] dark:text-[#8dd5bd]'}`}>
                {forecastDelta > 0 ? '+' : ''}{forecastDeltaPct.toFixed(1)}% {t('monthlyComparison')}
              </p>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#f7f9fc] p-2.5 dark:bg-[#232936]">
                <p className="text-[11px] font-semibold text-[#667084] dark:text-[#a8b0be]">{isEnglish ? 'Low scenario' : 'Kịch bản thấp'}</p>
                <p className="mt-1 text-sm font-black text-[#1f2733] dark:text-[#e8edf4]">{formatCurrency(forecastLow)}</p>
              </div>
              <div className="rounded-xl bg-[#f7f9fc] p-2.5 dark:bg-[#232936]">
                <p className="text-[11px] font-semibold text-[#667084] dark:text-[#a8b0be]">{isEnglish ? 'High scenario' : 'Kịch bản cao'}</p>
                <p className="mt-1 text-sm font-black text-[#1f2733] dark:text-[#e8edf4]">{formatCurrency(forecastHigh)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {topForecastCategories.length > 0 ? topForecastCategories.map((item, idx) => (
                <div key={`${item.name}-${idx}`} className="rounded-xl bg-[#f4f6f9] p-3 dark:bg-[#232936]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold bg-[#dce7f7] text-[#31557e] dark:bg-[#2a3a4f] dark:text-[#9fc4ef]">{idx + 1}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1f2733] dark:text-[#e8edf4]">{item.name || (isEnglish ? 'Other expense' : 'Chi tiêu khác')}</p>
                        <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'High-risk category' : 'Danh mục có rủi ro cao'}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-[#1a1f29] dark:text-[#eff2f6]">{formatCurrency(item.amount)}</p>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#e8effa] px-2 py-0.5 text-[11px] font-semibold text-[#365e8b] dark:bg-[#2a3f59] dark:text-[#a6caf3]">
                      {t('topCategories')}
                    </span>
                    <span className="text-[11px] font-semibold text-[#667084] dark:text-[#a4acba]">
                      {topForecastTotal > 0 ? `${Math.round((item.amount / topForecastTotal) * 100)}%` : '0%'}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-[#dfe5ee] dark:bg-[#2e3542] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#003d2d] dark:bg-[#2f8e6f]"
                      style={{ width: `${topForecastTotal > 0 ? Math.max((item.amount / topForecastTotal) * 100, 6) : 0}%` }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'Not enough data for expense forecast.' : 'Chưa đủ dữ liệu để dự báo chi tiêu.'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4 dark:border-[#2b313d]">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Recent Transactions' : 'Giao dịch gần đây'}</h3>
            <div className="flex items-center gap-2">
              {[
                { key: 'all', label: t('all') },
                { key: 'expense', label: t('expense') },
                { key: 'income', label: t('income') },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTxFilter(filter.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    txFilter === filter.key
                      ? 'bg-[#eceff4] text-[#1f2733] dark:bg-[#303746] dark:text-[#f1f4f8]'
                      : 'bg-[#f8f9fb] text-[#6f7480] hover:bg-[#edf1f6] dark:bg-[#232936] dark:text-[#a4acba] dark:hover:bg-[#2d3442]'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#eceff4] text-left text-xs font-bold uppercase tracking-wider text-[#7a808c] dark:border-[#2b313d] dark:text-[#9fa7b4]">
                  <th className="px-5 py-3">{isEnglish ? 'Description' : 'Mô tả'}</th>
                  <th className="px-5 py-3">{t('category')}</th>
                  <th className="px-5 py-3">{t('date')}</th>
                  <th className="px-5 py-3 text-right">{t('amount')}</th>
                  <th className="px-5 py-3 text-right">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.length > 0 ? recentTransactions.map((tx, idx) => {
                  const status = idx % 3 === 2 ? (isEnglish ? 'Processing' : 'Đang xử lý') : (isEnglish ? 'Completed' : 'Hoàn tất');
                  return (
                    <tr key={tx._id || idx} className="border-b border-[#eef1f6] dark:border-[#2a303b]">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#1d2430] dark:text-[#eef1f5]">{tx.note || tx.category}</p>
                        <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{tx.type === 'income' ? (isEnglish ? 'Income transaction' : 'Giao dịch thu') : (isEnglish ? 'Expense transaction' : 'Giao dịch chi')}</p>
                      </td>
                      <td className="px-5 py-4 font-medium text-[#303846] dark:text-[#c9d1db]">{tx.category}</td>
                      <td className="px-5 py-4 text-[#6f7480] dark:text-[#a4acba]">{formatDate(tx.date)}</td>
                      <td className={`px-5 py-4 text-right font-black ${tx.type === 'income' ? 'text-[#0c7a58] dark:text-[#54d5aa]' : 'text-[#1a1f29] dark:text-[#f0f3f7]'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${(isEnglish ? status === 'Completed' : status === 'Hoàn tất') ? 'bg-[#e6ecfa] text-[#6177a6] dark:bg-[#313b54] dark:text-[#a9bcdf]' : 'bg-[#f4ddd7] text-[#9a5f54] dark:bg-[#4a3330] dark:text-[#d7a59b]'}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#6f7480] dark:text-[#a4acba]">
                      {isEnglish ? 'No matching transactions.' : 'Không có giao dịch phù hợp.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
