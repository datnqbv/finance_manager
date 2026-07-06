import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsService } from '../services/stats.service';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FiBarChart2, FiTrendingUp, FiActivity,
  FiCalendar, FiTarget, FiZap, FiLock, FiAward,
  FiAlertTriangle, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';
import { StatisticsPageSkeleton } from '../components/LoadingSkeleton';
import { useLanguage } from '../context/LanguageContext';

// ── Helpers ─────────────────────────────────────────────────────────────────

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

const ChartTip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#FFFCF5] dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ label, value, sub, border, icon, valueColor, loading }) => (
  <div className={`bg-[#FFFCF5] dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${border} rounded-2xl px-4 py-3`}>
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
        {loading
          ? <div className="h-6 w-24 bg-gray-100 dark:bg-[#2a2a2a] rounded animate-pulse" />
          : <p className={`text-lg font-black leading-tight truncate ${valueColor}`}>{value}</p>
        }
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <span className="text-2xl ml-2 flex-shrink-0">{icon}</span>
    </div>
  </div>
);

// ── Locked Feature Placeholder component ─────────────────────────────────────
const LockedFeaturePlaceholder = ({ featureName, description }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  return (
    <div className="rounded-xl bg-[#FFFCF5] p-12 shadow-sm dark:bg-[#191d25] relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[350px] border border-gray-100 dark:border-gray-800">
      <div className="absolute inset-0 bg-white/40 dark:bg-[#191d25]/50 backdrop-blur-[1px] z-0" />
      <div className="relative z-10 flex flex-col items-center max-w-md">
        <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-4 shadow-sm animate-bounce">
          <FiLock size={30} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {featureName}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
          {description}
        </p>
        <button
          onClick={() => navigate('/vip')}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-3 text-sm transition-all shadow-lg shadow-amber-500/20 hover:scale-105"
        >
          <FiAward size={16} /> {isEnglish ? 'Upgrade to VIP' : 'Nâng cấp VIP ngay'}
        </button>
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

const Statistics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVipActive = user?.isVip && (!user?.vipExpire || new Date(user.vipExpire) > new Date());
  const { revision: transactionRevision } = useTransactions();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [dailyRange, setDailyRange]       = useState(30);
  const [loading, setLoading]             = useState(true);

  const [monthly,    setMonthly]    = useState(null);
  const [catStats,   setCatStats]   = useState([]);
  const [compare,    setCompare]    = useState([]);
  const [advice,     setAdvice]     = useState(null);
  const [trends,     setTrends]     = useState(null);
  const [daily,      setDaily]      = useState([]);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);
  const monthBundleCacheRef = useRef(new Map());

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fmt = useCallback((n) =>
    new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(n || 0),
  [user, isEnglish]);

  const fmtShort = useCallback((n) => {
    if (Math.abs(n) >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'T';
    if (Math.abs(n) >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)         return (n / 1_000).toFixed(0) + 'K';
    return n;
  }, []);

  const getMonthKey = useCallback((year, month) => `${year}-${month}`, []);

  const applyMonthBundle = useCallback((bundle) => {
    setMonthly(bundle.monthly);
    setCatStats(bundle.catStats);
    setCompare(bundle.compare);
    setAdvice(bundle.advice);
    setTrends(bundle.trends);
    setDaily(bundle.daily);
  }, []);

  const fetchMonthBundle = useCallback(async (year, month) => {
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    const [m, c, cmp, adv, t, d] = await Promise.allSettled([
      statsService.getMonthlyStats(year, month),
      statsService.getCategoryStats(monthStart, monthEnd),
      statsService.compareStats('month', 6, year, month),
      statsService.getFinancialAdvice(year, month),
      statsService.analyzeTrends(12, year, month),
      statsService.getDailyStats(monthStart, monthEnd),
    ]);

    const bundle = {
      monthly: null,
      catStats: [],
      compare: [],
      advice: null,
      trends: null,
      daily: [],
    };

    if (m.status === 'fulfilled') {
      const md = m.value?.data;
      bundle.monthly = {
        totalIncome: md?.summary?.income || 0,
        totalExpense: md?.summary?.expense || 0,
        totalTransactions: md?.transactions || 0,
      };
    }

    if (c.status === 'fulfilled') {
      const raw = c.value?.data || [];
      bundle.catStats = raw.map(item => ({
        category: item.category,
        totalIncome: item.income || 0,
        totalExpense: item.expense || 0,
        count: item.count || 0,
      }));
    }

    if (cmp.status === 'fulfilled') {
      const periods = cmp.value?.data?.periods || [];
      bundle.compare = periods.map(p => {
        const [mon, yr] = (p.label || p.period || '').split('/');
        return {
          month: parseInt(mon) || 0,
          year: parseInt(yr) || 0,
          totalIncome: p.income || 0,
          totalExpense: p.expense || 0,
        };
      });
    }

    if (adv.status === 'fulfilled') {
      bundle.advice = adv.value?.data || null;
    }

    if (t.status === 'fulfilled') {
      const td = t.value?.data;
      const monthlyData = (td?.trends || []).map(item => {
        const [mon, yr] = (item.month || '').split('/');
        return {
          month: parseInt(mon) || 0,
          year: parseInt(yr) || 0,
          income: item.income || 0,
          expense: item.expense || 0,
          savings: item.savings || 0,
          savingsRate: item.savingsRate || 0,
        };
      });
      bundle.trends = {
        monthlyData,
        averageIncome: td?.analysis?.averageIncome || 0,
        averageExpense: td?.analysis?.averageExpense || 0,
        averageSavings: td?.analysis?.averageSavings || 0,
        overallTrend: td?.analysis?.spendingTrend || '—',
      };
    }

    if (d.status === 'fulfilled') {
      const raw = d.value?.data || [];
      bundle.daily = raw.map(item => ({ ...item, count: item.transactions || 0 }));
    }

    return bundle;
  }, []);

  const prefetchMonth = useCallback(async (year, month) => {
    if (month < 1 || month > 12) return;
    const key = getMonthKey(year, month);
    if (monthBundleCacheRef.current.has(key)) return;
    try {
      const bundle = await fetchMonthBundle(year, month);
      monthBundleCacheRef.current.set(key, bundle);
    } catch {
      // Prefetch lỗi thì bỏ qua để không ảnh hưởng luồng chính
    }
  }, [fetchMonthBundle, getMonthKey]);

  useEffect(() => {
    if (!user?.id) return;
    monthBundleCacheRef.current.clear();

    const controller = new AbortController();
    const currentKey = getMonthKey(selectedYear, selectedMonth);
    const cached = monthBundleCacheRef.current.get(currentKey);

    if (cached) {
      applyMonthBundle(cached);
      setLoading(false);
    } else {
      setLoading(true);
      setMonthly(null);
      setCatStats([]);
      setCompare([]);
      setAdvice(null);
      setTrends(null);
      setDaily([]);
    }

    const load = async () => {
      try {
        const bundle = await fetchMonthBundle(selectedYear, selectedMonth);
        if (controller.signal.aborted) return;

        monthBundleCacheRef.current.set(currentKey, bundle);
        applyMonthBundle(bundle);

        // Prefetch tháng liền kề để chuyển tháng gần như tức thì
        const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
        const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
        const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
        const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
        prefetchMonth(prevYear, prevMonth);
        prefetchMonth(nextYear, nextMonth);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [selectedYear, selectedMonth, transactionRevision, user?.id, fetchMonthBundle, getMonthKey, applyMonthBundle, prefetchMonth]);

  const reloadDaily = useCallback(async (days) => {
    const end   = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    try {
      const r = await statsService.getDailyStats(start, end);
      const raw = r?.data || [];
      setDaily(raw.map(item => ({ ...item, count: item.transactions || 0 })));
    } catch {}
  }, []);

  const handleDailyRange = (days) => {
    setDailyRange(days);
    reloadDaily(days);
  };

  // Khi chuyển sang tab daily, tự động load đúng theo dailyRange (mặc định 30 ngày gần nhất)
  // thay vì hiển thị data của tháng đang chọn
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'daily') {
      reloadDaily(dailyRange);
    }
  };

  const TABS = [
    { key: 'overview',  label: isEnglish ? 'Overview' : 'Tổng quan',   icon: <FiBarChart2 size={13}/> },
    { key: 'compare',   label: isEnglish ? 'Compare' : 'So sánh',     icon: <FiActivity size={13}/> },
    {
      key: 'advisor',
      label: (
        <span className="flex items-center gap-1">
          {isEnglish ? 'Financial Advisor' : 'Cố vấn tài chính'}
          {!isVipActive && <span className="text-amber-500 text-[10px]">👑</span>}
        </span>
      ),
      icon: <FiZap size={13}/>
    },
    { 
      key: 'trends',    
      label: (
        <span className="flex items-center gap-1">
          {isEnglish ? 'Trends' : 'Xu hướng'}
          {!isVipActive && <span className="text-amber-500 text-[10px]">👑</span>}
        </span>
      ),    
      icon: <FiTrendingUp size={13}/> 
    },
    { key: 'daily',     label: isEnglish ? 'Daily' : 'Theo ngày',   icon: <FiCalendar size={13}/> },
  ];

  const TAB_ACTIVE = 'bg-gray-900 dark:bg-[#FFFCF5] text-white dark:text-gray-900 shadow-sm';
  useEffect(() => {
    monthBundleCacheRef.current.clear();
  }, [user?.id, transactionRevision]);


  // ── Overview tab ─────────────────────────────────────────────────────────
  const OverviewTab = () => {
    const sortedExpenses = [...catStats]
      .filter(c => c.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense);

    let pieData = [];
    let topExpCats = [];

    if (sortedExpenses.length <= 6) {
      pieData = sortedExpenses.map((c, i) => ({
        name: c.category, value: c.totalExpense, fill: COLORS[i % COLORS.length]
      }));
      topExpCats = sortedExpenses;
    } else {
      const top5 = sortedExpenses.slice(0, 5);
      const othersVal = sortedExpenses.slice(5).reduce((sum, c) => sum + c.totalExpense, 0);
      const othersCount = sortedExpenses.slice(5).reduce((sum, c) => sum + c.count, 0);

      pieData = [
        ...top5.map((c, i) => ({
          name: c.category, value: c.totalExpense, fill: COLORS[i % COLORS.length]
        })),
        {
          name: isEnglish ? 'Others' : 'Khác',
          value: othersVal,
          fill: '#94a3b8'
        }
      ];

      topExpCats = [
        ...top5,
        {
          category: isEnglish ? 'Others' : 'Khác',
          totalExpense: othersVal,
          totalIncome: 0,
          count: othersCount
        }
      ];
    }

    const maxExp = topExpCats[0]?.totalExpense || 1;
    const overviewIncome = monthly?.totalIncome || 0;
    const overviewExpense = monthly?.totalExpense || 0;
    const overviewSaving = overviewIncome - overviewExpense;
    const overviewSavingRate = overviewIncome > 0 ? (overviewSaving / overviewIncome) * 100 : 0;

    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-[#FFFCF5] p-4 shadow-sm dark:bg-[#191d25]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Period Overview' : 'Tổng quan theo kỳ'}</h3>
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'Track your financial performance by month and year' : 'Theo dõi hiệu suất tài chính theo tháng và năm'}</p>
            </div>
            <div className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-semibold text-[#435066] dark:bg-[#2a3341] dark:text-[#c7d1df]">
              {isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm'}: {overviewSavingRate.toFixed(1)}%
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center w-full overflow-hidden">
            <div className="flex items-center bg-[#F3EBD8] dark:bg-[#222935] p-1 rounded-xl gap-0.5 overflow-x-auto max-w-full scrollbar-hide flex-nowrap">
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <button key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`w-9 h-7 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${
                    selectedMonth === m
                      ? 'bg-[#FFFCF5] dark:bg-[#303746] text-[#1f2733] dark:text-[#f1f4f8] shadow-sm'
                      : 'text-[#7f8795] dark:text-[#9ba3b2] hover:text-[#2d3645] dark:hover:text-[#e5eaf1]'
                  }`}
                >{isEnglish ? `M${m}` : `T${m}`}</button>
              ))}
            </div>
            <div className="flex items-center bg-[#F3EBD8] dark:bg-[#222935] p-1 rounded-xl gap-0.5 flex-shrink-0">
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <button key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 h-7 rounded-lg text-xs font-semibold transition-all ${
                    selectedYear === y
                      ? 'bg-[#FFFCF5] dark:bg-[#303746] text-[#1f2733] dark:text-[#f1f4f8] shadow-sm'
                      : 'text-[#7f8795] dark:text-[#9ba3b2] hover:text-[#2d3645] dark:hover:text-[#e5eaf1]'
                  }`}
                >{y}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Income' : 'Thu nhập'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#159b63] dark:text-[#58d49f] truncate">{fmt(overviewIncome)}</p>
          </div>
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Expense' : 'Chi tiêu'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f] truncate">{fmt(overviewExpense)}</p>
          </div>
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Net savings' : 'Tiết kiệm ròng'}</p>
            <p className={`mt-2 text-sm sm:text-xl md:text-2xl font-black truncate ${overviewSaving >= 0 ? 'text-[#2e67da] dark:text-[#8eb2ff]' : 'text-[#c0701c] dark:text-[#f2ba76]'}`}>
              {fmt(overviewSaving)}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Transactions' : 'Giao dịch'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#7a43db] dark:text-[#bd97ff] truncate">{monthly?.totalTransactions ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-blue-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Expense Share by Category' : 'Tỷ lệ chi tiêu theo danh mục'}</h3>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => (!percent || percent < 0.03) ? null : (isMobile ? `${(percent*100).toFixed(0)}%` : `${name} ${(percent*100).toFixed(0)}%`)} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<ChartTip fmt={fmt}/>}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No data yet' : 'Chưa có dữ liệu'}</div>
            )}
          </div>

          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-red-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Top Expense Categories' : 'Top danh mục chi tiêu'}</h3>
            </div>
            <div className="space-y-2.5">
              {topExpCats.map((c, i) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#1f2733] dark:text-[#e8edf4] truncate max-w-[60%]">{c.category}</span>
                    <span className="font-bold text-[#df4b4b] dark:text-[#ff8f8f] flex-shrink-0 ml-2">{fmt(c.totalExpense)}</span>
                  </div>
                  <div className="h-1.5 bg-[#e1e7f0] dark:bg-[#2e3542] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.totalExpense / maxExp) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}/>
                  </div>
                </div>
              ))}
              {topExpCats.length === 0 && <p className="text-sm text-[#6f7480] dark:text-[#a4acba] py-8 text-center">{isEnglish ? 'No data yet' : 'Chưa có dữ liệu'}</p>}
            </div>
          </div>
        </div>

        {catStats.length > 0 && (
          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-purple-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Income/Expense by Category' : 'Thu/Chi theo danh mục'}</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catStats.slice(0,8).map(c => ({ name: c.category, [isEnglish ? 'Income' : 'Thu nhập']: c.totalIncome||0, [isEnglish ? 'Expense' : 'Chi tiêu']: c.totalExpense||0 }))} margin={{left: 0, right: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
                <XAxis dataKey="name" tick={{fontSize:10}} interval={0} angle={-30} textAnchor="end" height={50}/>
                <YAxis tickFormatter={fmtShort} tick={{fontSize:10}} width={45}/>
                <Tooltip content={<ChartTip fmt={fmt}/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey={isEnglish ? 'Income' : 'Thu nhập'} fill="#10b981" radius={[3,3,0,0]}/>
                <Bar dataKey={isEnglish ? 'Expense' : 'Chi tiêu'} fill="#ef4444" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // ── Compare tab ──────────────────────────────────────────────────────────
  const CompareTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Total income (6 months)' : 'Tổng thu (6 tháng)'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#159b63] dark:text-[#58d49f] truncate">
            {fmt(compare.reduce((s,m)=>s+(m.totalIncome||0),0))}
          </p>
        </div>
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Total expense (6 months)' : 'Tổng chi (6 tháng)'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f] truncate">
            {fmt(compare.reduce((s,m)=>s+(m.totalExpense||0),0))}
          </p>
        </div>
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Avg income/month' : 'TB thu/tháng'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#2e67da] dark:text-[#8eb2ff] truncate">
            {fmt(compare.length ? compare.reduce((s,m)=>s+(m.totalIncome||0),0)/compare.length : 0)}
          </p>
        </div>
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Avg expense/month' : 'TB chi/tháng'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#c0701c] dark:text-[#f2ba76] truncate">
            {fmt(compare.length ? compare.reduce((s,m)=>s+(m.totalExpense||0),0)/compare.length : 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-blue-500"/>
          <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Income vs Expense (Last 6 Months)' : 'So sánh thu/chi 6 tháng gần nhất'}</h3>
        </div>
        {compare.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compare.map(m=>({ name:`${isEnglish ? 'M' : 'T'}${m.month}/${String(m.year).slice(2)}`, [isEnglish ? 'Income' : 'Thu nhập']: m.totalIncome||0, [isEnglish ? 'Expense' : 'Chi tiêu']: m.totalExpense||0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tickFormatter={fmtShort} tick={{fontSize:10}} width={48}/>
              <Tooltip content={<ChartTip fmt={fmt}/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey={isEnglish ? 'Income' : 'Thu nhập'} fill="#10b981" radius={[4,4,0,0]}/>
              <Bar dataKey={isEnglish ? 'Expense' : 'Chi tiêu'} fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[260px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No data yet' : 'Chưa có dữ liệu'}</div>}
      </div>

      {compare.length > 0 && (
        <div className="rounded-xl bg-[#FFFCF5] shadow-sm dark:bg-[#191d25] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Monthly Details' : 'Chi tiết theo tháng'}</h3>
          </div>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FFFCF5] dark:bg-[#232936]">
                <tr>
                  {[(isEnglish ? 'Month' : 'Tháng'),(isEnglish ? 'Income' : 'Thu nhập'),(isEnglish ? 'Expense' : 'Chi tiêu'),(isEnglish ? 'Savings' : 'Tiết kiệm'),(isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm'),(isEnglish ? 'Expense growth' : 'Tăng trưởng chi')].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#7a808c] dark:text-[#9fa7b4]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.map((m, i) => {
                  const savings = (m.totalIncome||0) - (m.totalExpense||0);
                  const rate    = m.totalIncome ? ((savings/m.totalIncome)*100).toFixed(1) : '—';
                  const prev    = compare[i-1];
                  const growth  = prev?.totalExpense ? (((m.totalExpense - prev.totalExpense)/prev.totalExpense)*100).toFixed(1) : '—';
                  return (
                    <tr key={i} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#F3EBD8] dark:hover:bg-[#202632] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{isEnglish ? 'M' : 'T'}{m.month}/{m.year}</td>
                      <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-medium">{fmt(m.totalIncome)}</td>
                      <td className="px-4 py-2.5 text-red-600 dark:text-red-400 font-medium">{fmt(m.totalExpense)}</td>
                      <td className={`px-4 py-2.5 font-bold ${savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{fmt(savings)}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{rate !== '—' ? `${rate}%` : '—'}</td>
                      <td className={`px-4 py-2.5 font-semibold ${growth !== '—' ? (parseFloat(growth) > 0 ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`}>
                        {growth !== '—' ? `${parseFloat(growth) > 0 ? '+' : ''}${growth}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-[#eef1f6] dark:divide-[#2a303b]">
            {compare.map((m, i) => {
              const savings = (m.totalIncome||0) - (m.totalExpense||0);
              const rate    = m.totalIncome ? ((savings/m.totalIncome)*100).toFixed(1) : '—';
              const prev    = compare[i-1];
              const growth  = prev?.totalExpense ? (((m.totalExpense - prev.totalExpense)/prev.totalExpense)*100).toFixed(1) : '—';
              return (
                <div key={i} className="p-4 space-y-2 hover:bg-[#F3EBD8] dark:hover:bg-[#202632] transition-colors">
                  <div className="flex items-center justify-between font-bold text-sm text-gray-800 dark:text-gray-200">
                    <span>{isEnglish ? 'Month' : 'Tháng'} {isEnglish ? 'M' : 'T'}{m.month}/{m.year}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${savings >= 0 ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600'}`}>
                      {isEnglish ? 'Savings' : 'Tiết kiệm'}: {fmt(savings)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800/40 pb-1">
                      <span>{isEnglish ? 'Income' : 'Thu nhập'}:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(m.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800/40 pb-1">
                      <span>{isEnglish ? 'Expense' : 'Chi tiêu'}:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{fmt(m.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>{isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm'}:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{rate !== '—' ? `${rate}%` : '—'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span>{isEnglish ? 'Expense growth' : 'Tăng trưởng chi'}:</span>
                      <span className={`font-semibold ${growth !== '—' ? (parseFloat(growth) > 0 ? 'text-red-500' : 'text-emerald-500') : 'text-gray-400'}`}>
                        {growth !== '—' ? `${parseFloat(growth) > 0 ? '+' : ''}${growth}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── Advisor tab ──────────────────────────────────────────────────────────
  const AdvisorTab = () => {
    const a = advice;
    const rule = a?.rule502030;
    const jars = a?.sixJars;
    const anomalies = a?.anomalies || [];
    const budgetWarnings = a?.budgetPaceWarnings || [];
    const goalWarnings = a?.goalPaceWarnings || [];
    const tips = a?.tips || [];

    const VERDICT_STYLE = {
      on_track: { color: '#10b981', label: isEnglish ? 'On track' : 'Đạt mục tiêu', icon: <FiCheckCircle size={12}/> },
      over:     { color: '#ef4444', label: isEnglish ? 'Over target' : 'Vượt mức',   icon: <FiAlertTriangle size={12}/> },
      under:    { color: '#f59e0b', label: isEnglish ? 'Below target' : 'Dưới mức',  icon: <FiAlertTriangle size={12}/> },
    };

    const SEVERITY_STYLE = {
      danger:  { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', icon: <FiAlertTriangle size={14}/> },
      warning: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: <FiAlertCircle size={14}/> },
      info:    { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: <FiAlertCircle size={14}/> },
    };

    const RuleBar = ({ label, data, colorHex }) => {
      if (!data) return null;
      const v = VERDICT_STYLE[data.verdict] || VERDICT_STYLE.on_track;
      const width = Math.min(Math.max(data.percentage, 0), 100);
      return (
        <div className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#232936]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-[#1f2733] dark:text-[#e8edf4]">{label}</span>
            <span className="inline-flex items-center gap-1 font-bold" style={{ color: v.color }}>{v.icon} {v.label}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#6f7480] dark:text-[#a4acba] mb-1">
            <span>{fmt(data.amount)} ({data.percentage}%)</span>
            <span>{isEnglish ? 'Target' : 'Mục tiêu'}: {data.target}%</span>
          </div>
          <div className="h-1.5 bg-[#e1e7f0] dark:bg-[#2e3542] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${width}%`, backgroundColor: colorHex }}/>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5">
        {/* Tips ưu tiên */}
        <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-purple-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'What to do now' : 'Việc cần làm ngay'}</h3>
          </div>
          {tips.length > 0 ? (
            <div className="space-y-2">
              {tips.map((tip, i) => {
                const s = SEVERITY_STYLE[tip.severity] || SEVERITY_STYLE.info;
                return (
                  <div key={i} className={`flex items-start gap-2 rounded-xl p-3 text-xs font-medium ${s.bg} ${s.color}`}>
                    <span className="mt-0.5 flex-shrink-0">{s.icon}</span>
                    <span>{tip.message}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[#6f7480] dark:text-[#a4acba] py-4 text-center">{isEnglish ? 'Everything looks healthy this month. Keep it up!' : 'Mọi thứ đang ổn trong tháng này. Tiếp tục phát huy nhé!'}</p>
          )}
        </div>

        {/* Quy tắc 50/30/20 */}
        <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-blue-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Budget rule 50/30/20' : 'Quy tắc ngân sách 50/30/20'}</h3>
          </div>
          <p className="text-xs text-[#6f7480] dark:text-[#a4acba] mb-3">
            {isEnglish ? 'Needs / Wants / Savings compared to your income this period.' : 'Thiết yếu / Không thiết yếu / Tiết kiệm so với thu nhập trong kỳ.'}
          </p>
          <div className="space-y-2.5">
            <RuleBar label={isEnglish ? 'Needs' : 'Thiết yếu'} data={rule?.needs} colorHex="#3b82f6"/>
            <RuleBar label={isEnglish ? 'Wants' : 'Không thiết yếu'} data={rule?.wants} colorHex="#f59e0b"/>
            <RuleBar label={isEnglish ? 'Savings' : 'Tiết kiệm'} data={rule?.savings} colorHex="#10b981"/>
          </div>
        </div>

        {/* 6 chiếc lọ (ước lượng) */}
        <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-4 rounded-full bg-teal-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? '6 Jars (estimate)' : '6 Chiếc lọ (ước lượng)'}</h3>
          </div>
          <p className="text-xs text-[#6f7480] dark:text-[#a4acba] mb-3">
            {isEnglish ? 'Approximated from the 3 groups above (Necessities / Play+Education+Give / Financial Freedom+Long-term Savings) — not a full 6-label breakdown.' : 'Ước lượng dựa trên 3 nhóm ở trên (Thiết yếu / Hưởng thụ+Giáo dục+Cho đi / Tự do tài chính+Tiết kiệm dài hạn) — không phải phân loại đầy đủ 6 nhãn riêng.'}
          </p>
          <div className="space-y-2.5">
            <RuleBar label={isEnglish ? 'Necessities (NEC)' : 'Thiết yếu (NEC)'} data={jars?.necessities} colorHex="#3b82f6"/>
            <RuleBar label={isEnglish ? 'Play + Education + Give' : 'Hưởng thụ + Giáo dục + Cho đi'} data={jars?.playEduGive} colorHex="#f59e0b"/>
            <RuleBar label={isEnglish ? 'Financial Freedom + Long-term Savings' : 'Tự do tài chính + Tiết kiệm dài hạn'} data={jars?.freedomAndSavings} colorHex="#10b981"/>
          </div>
        </div>

        {/* Bất thường chi tiêu */}
        <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-red-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Spending anomalies' : 'Bất thường chi tiêu'}</h3>
          </div>
          {anomalies.length > 0 ? (
            <div className="space-y-2">
              {anomalies.map((an, i) => (
                <div key={i} className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#232936]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#1f2733] dark:text-[#e8edf4]">{an.category}</span>
                    <span className={`font-black ${an.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>+{an.changePct}%</span>
                  </div>
                  <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{an.message}</p>
                  <p className="mt-1 text-[11px] text-[#8b93a3] dark:text-[#8a93a4]">{fmt(an.currentAmount)} {isEnglish ? 'vs avg' : 'so với TB'} {fmt(an.averageAmount)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6f7480] dark:text-[#a4acba] py-4 text-center">{isEnglish ? 'No unusual spending detected.' : 'Không phát hiện chi tiêu bất thường.'}</p>
          )}
        </div>

        {/* Cảnh báo tiến độ ngân sách */}
        <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-amber-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Budget pace warnings' : 'Cảnh báo tiến độ ngân sách'}</h3>
          </div>
          {budgetWarnings.length > 0 ? (
            <div className="space-y-2">
              {budgetWarnings.map((w, i) => (
                <div key={i} className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#232936]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#1f2733] dark:text-[#e8edf4]">{w.categoryName}</span>
                    <span className={`font-black ${w.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>{w.spentPct}% {isEnglish ? 'spent' : 'đã chi'}</span>
                  </div>
                  <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{w.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6f7480] dark:text-[#a4acba] py-4 text-center">{isEnglish ? 'All budgets are on a healthy pace.' : 'Các ngân sách đều đang đúng tiến độ.'}</p>
          )}
        </div>

        {/* Cảnh báo tiến độ mục tiêu */}
        <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-emerald-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Savings goal pace' : 'Tiến độ mục tiêu tiết kiệm'}</h3>
          </div>
          {goalWarnings.length > 0 ? (
            <div className="space-y-2">
              {goalWarnings.map((w, i) => (
                <div key={i} className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#232936]">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <FiTarget size={12} className={w.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}/>
                    <span className="font-bold text-[#1f2733] dark:text-[#e8edf4]">{w.name}</span>
                    {w.delayMonths !== undefined && (
                      <span className={`ml-auto font-black ${w.severity === 'danger' ? 'text-red-500' : 'text-amber-500'}`}>
                        +{w.delayMonths} {isEnglish ? 'mo delay' : 'tháng chậm'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{w.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#6f7480] dark:text-[#a4acba] py-4 text-center">{isEnglish ? 'All active goals are on track.' : 'Các mục tiêu đang hoạt động đều đúng tiến độ.'}</p>
          )}
        </div>
      </div>
    );
  };

  // ── Trends tab ───────────────────────────────────────────────────────────
  const TrendsTab = () => {
    const t = trends;
    const trendData = t?.monthlyData || [];
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Avg income/month' : 'TB Thu/tháng'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#159b63] dark:text-[#58d49f] truncate">{fmt(t?.averageIncome)}</p>
          </div>
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Avg expense/month' : 'TB Chi/tháng'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f] truncate">{fmt(t?.averageExpense)}</p>
          </div>
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Avg savings' : 'TB Tiết kiệm'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#2e67da] dark:text-[#8eb2ff] truncate">{fmt(t?.averageSavings)}</p>
          </div>
          <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Expense trend' : 'Xu hướng chi'}</p>
            <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#7a43db] dark:text-[#bd97ff] truncate">{t?.overallTrend || '—'}</p>
          </div>
        </div>

        {trendData.length > 0 && (
          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-blue-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? '12-Month Income/Expense/Savings Trend' : 'Xu hướng thu/chi/tiết kiệm 12 tháng'}</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData.map(d => ({
                name: `${isEnglish ? 'M' : 'T'}${d.month}/${String(d.year).slice(2)}`,
                [isEnglish ? 'Income' : 'Thu nhập']: d.income||0, [isEnglish ? 'Expense' : 'Chi tiêu']: d.expense||0, [isEnglish ? 'Savings' : 'Tiết kiệm']: d.savings||0
              }))}>
                <defs>
                  <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
                <XAxis dataKey="name" tick={{fontSize:10}} interval={1}/>
                <YAxis tickFormatter={fmtShort} tick={{fontSize:9}} width={45}/>
                <Tooltip content={<ChartTip fmt={fmt}/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Area type="monotone" dataKey={isEnglish ? 'Income' : 'Thu nhập'} stroke="#10b981" fill="url(#gI)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey={isEnglish ? 'Expense' : 'Chi tiêu'}  stroke="#ef4444" fill="url(#gE)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey={isEnglish ? 'Savings' : 'Tiết kiệm'} stroke="#3b82f6" fill="url(#gS)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {trendData.length > 0 && (
          <div className="rounded-xl bg-[#FFFCF5] shadow-sm dark:bg-[#191d25] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Monthly Details' : 'Chi tiết theo tháng'}</h3>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#FFFCF5] dark:bg-[#232936]">
                  <tr>
                    {[(isEnglish ? 'Month' : 'Tháng'),(isEnglish ? 'Income' : 'Thu nhập'),(isEnglish ? 'Expense' : 'Chi tiêu'),(isEnglish ? 'Savings' : 'Tiết kiệm'),(isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm')].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#7a808c] dark:text-[#9fa7b4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((d, i) => {
                    const rate = d.income ? ((d.savings/d.income)*100) : 0;
                    return (
                      <tr key={i} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#F3EBD8] dark:hover:bg-[#202632] transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{isEnglish ? 'M' : 'T'}{d.month}/{d.year}</td>
                        <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-medium">{fmt(d.income)}</td>
                        <td className="px-4 py-2.5 text-red-600 dark:text-red-400 font-medium">{fmt(d.expense)}</td>
                        <td className={`px-4 py-2.5 font-bold ${d.savings >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>{fmt(d.savings)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500 transition-all" style={{width:`${Math.max(0,Math.min(100,rate))}%`}}/>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">{rate.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden divide-y divide-[#eef1f6] dark:divide-[#2a303b]">
              {trendData.map((d, i) => {
                const rate = d.income ? ((d.savings/d.income)*100) : 0;
                return (
                  <div key={i} className="p-4 space-y-2 hover:bg-[#F3EBD8] dark:hover:bg-[#202632] transition-colors">
                    <div className="flex items-center justify-between font-bold text-sm text-gray-800 dark:text-gray-200">
                      <span>{isEnglish ? 'Month' : 'Tháng'} {isEnglish ? 'M' : 'T'}{d.month}/{d.year}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.savings >= 0 ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'bg-orange-50 dark:bg-orange-950/20 text-orange-600'}`}>
                        {isEnglish ? 'Savings' : 'Tiết kiệm'}: {fmt(d.savings)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex justify-between border-b border-gray-100 dark:border-gray-800/40 pb-1">
                        <span>{isEnglish ? 'Income' : 'Thu nhập'}:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(d.income)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 dark:border-gray-800/40 pb-1">
                        <span>{isEnglish ? 'Expense' : 'Chi tiêu'}:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">{fmt(d.expense)}</span>
                      </div>
                      <div className="col-span-2 flex justify-between items-center pb-0.5 pt-1">
                        <span>{isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm'}:</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all" style={{width:`${Math.max(0,Math.min(100,rate))}%`}}/>
                          </div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">{rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Daily tab ─────────────────────────────────────────────────────────────
  const DailyTab = () => {
    const dailyIncomeTotal = daily.reduce((sum, item) => sum + (item.income || 0), 0);
    const dailyExpenseTotal = daily.reduce((sum, item) => sum + (item.expense || 0), 0);
    const dailyTxTotal = daily.reduce((sum, item) => sum + (item.count || 0), 0);

    // Tính ngày bắt đầu và kết thúc để hiển thị
    const endDate = new Date();
    const startDate = new Date(Date.now() - dailyRange * 86400000);
    const fmtDay = (d) => d.toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center bg-[#F3EBD8] dark:bg-[#222935] p-1 rounded-xl gap-0.5">
          {[7, 14, 30].map(d => (
            <button key={d}
              onClick={() => handleDailyRange(d)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dailyRange === d
                  ? 'bg-[#FFFCF5] dark:bg-[#303746] text-[#1f2733] dark:text-[#f1f4f8] shadow-sm'
                  : 'text-[#7f8795] dark:text-[#9ba3b2] hover:text-[#2d3645] dark:hover:text-[#e5eaf1]'
              }`}
            >{d} {isEnglish ? 'days' : 'ngày'}</button>
          ))}
        </div>
        <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">
          {isEnglish ? 'Period' : 'Giai đoạn'}: <span className="font-semibold text-[#1f2733] dark:text-[#e8edf4]">{fmtDay(startDate)} – {fmtDay(endDate)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Total income in period' : 'Tổng thu giai đoạn'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#159b63] dark:text-[#58d49f] truncate">{fmt(dailyIncomeTotal)}</p>
        </div>
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Total expense in period' : 'Tổng chi giai đoạn'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f] truncate">{fmt(dailyExpenseTotal)}</p>
        </div>
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Net balance' : 'Cân bằng ròng'}</p>
          <p className={`mt-2 text-sm sm:text-xl md:text-2xl font-black truncate ${dailyIncomeTotal - dailyExpenseTotal >= 0 ? 'text-[#2e67da] dark:text-[#8eb2ff]' : 'text-[#c0701c] dark:text-[#f2ba76]'}`}>
            {fmt(dailyIncomeTotal - dailyExpenseTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-[#FFFCF5] p-3 sm:p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">{isEnglish ? 'Transactions count' : 'Số giao dịch'}</p>
          <p className="mt-2 text-sm sm:text-xl md:text-2xl font-black text-[#7a43db] dark:text-[#bd97ff] truncate">{dailyTxTotal}</p>
        </div>
      </div>

      {daily.length > 0 ? (
        <>
          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-emerald-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Daily Income/Expense' : 'Thu/chi theo ngày'}</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={daily.map(d => ({
                name: new Date(d.date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN',{day:'2-digit',month:'2-digit'}),
                [isEnglish ? 'Income' : 'Thu nhập']: d.income||0, [isEnglish ? 'Expense' : 'Chi tiêu']: d.expense||0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
                <XAxis dataKey="name" tick={{fontSize:9}} interval={Math.floor(daily.length/7)}/>
                <YAxis tickFormatter={fmtShort} tick={{fontSize:9}} width={45}/>
                <Tooltip content={<ChartTip fmt={fmt}/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey={isEnglish ? 'Income' : 'Thu nhập'} fill="#10b981" radius={[3,3,0,0]}/>
                <Bar dataKey={isEnglish ? 'Expense' : 'Chi tiêu'} fill="#ef4444" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-[#FFFCF5] shadow-sm dark:bg-[#191d25] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Daily Details' : 'Chi tiết theo ngày'}</h3>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#FFFCF5] dark:bg-[#232936] sticky top-0">
                  <tr>
                    {[(isEnglish ? 'Date' : 'Ngày'),(isEnglish ? 'Income' : 'Thu nhập'),(isEnglish ? 'Expense' : 'Chi tiêu'),(isEnglish ? 'Transactions' : 'Số giao dịch')].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#7a808c] dark:text-[#9fa7b4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map((d, i) => (
                    <tr key={i} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#F3EBD8] dark:hover:bg-[#202632] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
                        {new Date(d.date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}
                      </td>
                      <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-medium">{fmt(d.income)}</td>
                      <td className="px-4 py-2.5 text-red-600 dark:text-red-400 font-medium">{fmt(d.expense)}</td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{d.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden max-h-80 overflow-y-auto divide-y divide-[#eef1f6] dark:divide-[#2a303b]">
              {[...daily].reverse().map((d, i) => (
                <div key={i} className="p-4 space-y-2 hover:bg-[#F3EBD8] dark:hover:bg-[#202632] transition-colors">
                  <div className="flex items-center justify-between font-bold text-sm text-gray-800 dark:text-gray-200">
                    <span>{new Date(d.date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-[#be9cff]">
                      {d.count || 0} {isEnglish ? 'Txs' : 'giao dịch'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800/40 pb-1">
                      <span>{isEnglish ? 'Income' : 'Thu nhập'}:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(d.income)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-800/40 pb-1">
                      <span>{isEnglish ? 'Expense' : 'Chi tiêu'}:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{fmt(d.expense)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No data in this time range' : 'Chưa có dữ liệu trong khoảng thời gian này'}</div>
      )}
    </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading && !monthly) return <StatisticsPageSkeleton />;

  const currentIncome = monthly?.totalIncome || 0;
  const currentExpense = monthly?.totalExpense || 0;
  const currentBalance = currentIncome - currentExpense;
  const savingRate = currentIncome > 0 ? Math.max(((currentBalance / currentIncome) * 100), 0) : 0;
  const monthTopCategory = [...catStats]
    .sort((a, b) => (b.totalExpense || 0) - (a.totalExpense || 0))[0];
  const periodLabel = isEnglish ? `Month ${selectedMonth}/${selectedYear}` : `Tháng ${selectedMonth}/${selectedYear}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-[#0a5c48] p-5 sm:p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiBarChart2 size={18} className="text-[#b8e4d6]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Statistics Dashboard' : 'Bảng điều khiển thống kê'}</p>
            </div>
            <h1 className="mt-3 text-3xl sm:text-5xl font-black tracking-tight">{fmt(currentBalance)}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
              <FiZap size={12} />
              {periodLabel} • {isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm'} {savingRate.toFixed(1)}%
            </div>

            <div className="mt-6 md:mt-8 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[#1e6b57] pt-5">
              <div>
                <p className="text-[10px] md:text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Total income' : 'Tổng thu'}</p>
                <p className="mt-1 text-sm sm:text-base md:text-2xl font-bold truncate">{fmt(currentIncome)}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Total expense' : 'Tổng chi'}</p>
                <p className="mt-1 text-sm sm:text-base md:text-2xl font-bold truncate">{fmt(currentExpense)}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Transactions' : 'Số giao dịch'}</p>
                <p className="mt-1 text-sm sm:text-base md:text-2xl font-bold truncate">{monthly?.totalTransactions ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Key Metrics' : 'Chỉ số nổi bật'}</h3>
              <span className="text-xs font-semibold text-[#3a4a62] dark:text-[#b9c3d0]">{periodLabel}</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#222935]">
                <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{isEnglish ? 'Savings rate' : 'Tỷ lệ tiết kiệm'}</p>
                <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">{savingRate.toFixed(1)}%</p>
              </div>

              <div className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#222935]">
                <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{isEnglish ? 'Income - Expense' : 'Thu nhập - Chi tiêu'}</p>
                <p className={`mt-1 text-sm font-semibold ${currentBalance >= 0 ? 'text-[#2f8e6f] dark:text-[#8dd5bd]' : 'text-[#b54747] dark:text-[#f3a5a5]'}`}>
                  {fmt(currentBalance)}
                </p>
              </div>

              <div className="rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#222935]">
                <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{isEnglish ? 'Top expense category' : 'Danh mục chi cao nhất'}</p>
                <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                  {monthTopCategory ? `${monthTopCategory.category}: ${fmt(monthTopCategory.totalExpense)}` : (isEnglish ? 'No category data yet' : 'Chưa có dữ liệu danh mục')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-[#FFFCF5] p-1.5 shadow-sm dark:bg-[#191d25]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key}
            onClick={() => handleTabChange(t.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === t.key
                  ? TAB_ACTIVE
                  : 'text-[#6f7480] dark:text-[#a4acba] hover:text-[#1f2733] dark:hover:text-[#e8edf4] hover:bg-[#F3EBD8] dark:hover:bg-[#242c38]'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview'  && <OverviewTab/>}
      {activeTab === 'compare'   && <CompareTab/>}
      {activeTab === 'advisor'   && (
        isVipActive ? <AdvisorTab/> : <LockedFeaturePlaceholder featureName={isEnglish ? 'Smart Financial Advisor' : 'Cố vấn tài chính thông minh'} description={isEnglish ? 'Upgrade to VIP to get 50/30/20 budget analysis, anomaly detection, and budget/goal pace warnings' : 'Nâng cấp tài khoản VIP để nhận phân tích ngân sách 50/30/20, phát hiện bất thường và cảnh báo tiến độ ngân sách/mục tiêu'} />
      )}
      {activeTab === 'trends'    && (
        isVipActive ? <TrendsTab/> : <LockedFeaturePlaceholder featureName={isEnglish ? 'Financial Trends Analysis' : 'Phân tích xu hướng tài chính'} description={isEnglish ? 'Upgrade to VIP to analyze long-term trends and savings rate' : 'Nâng cấp tài khoản VIP để xem phân tích xu hướng chi tiêu dài hạn'} />
      )}
      {activeTab === 'daily'     && <DailyTab/>}
    </div>
  );
};

export default Statistics;
