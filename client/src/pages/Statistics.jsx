import { useEffect, useState, useCallback, useRef } from 'react';
import { statsService } from '../services/stats.service';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  FiBarChart2, FiTrendingUp, FiTrendingDown, FiActivity,
  FiCalendar, FiTarget, FiAlertCircle, FiCheckCircle,
  FiInfo, FiMinus, FiZap
} from 'react-icons/fi';
import { StatisticsPageSkeleton } from '../components/LoadingSkeleton';

// ── Helpers ─────────────────────────────────────────────────────────────────

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

const ChartTip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {fmt ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const TrendBadge = ({ trend }) => {
  if (trend === 'increasing') return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-500"><FiTrendingUp size={10}/> Tăng</span>;
  if (trend === 'decreasing') return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-500"><FiTrendingDown size={10}/> Giảm</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-400"><FiMinus size={10}/> Ổn định</span>;
};

const ConfidenceBadge = ({ confidence }) => {
  const map = {
    high: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
    low: 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400',
  };
  const labels = { high: 'Tin cậy cao', medium: 'Trung bình', low: 'Thấp' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[confidence] || map.low}`}>{labels[confidence] || confidence}</span>;
};

const KpiCard = ({ label, value, sub, border, icon, valueColor, loading }) => (
  <div className={`bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${border} rounded-2xl px-4 py-3`}>
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

// ── Main Component ───────────────────────────────────────────────────────────

const Statistics = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [dailyRange, setDailyRange]       = useState(30);
  const [loading, setLoading]             = useState(true);

  const [monthly,    setMonthly]    = useState(null);
  const [catStats,   setCatStats]   = useState([]);
  const [compare,    setCompare]    = useState([]);
  const [forecast,   setForecast]   = useState(null);
  const [trends,     setTrends]     = useState(null);
  const [daily,      setDaily]      = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const monthBundleCacheRef = useRef(new Map());

  const fmt = useCallback((n) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(n || 0),
  [user]);

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
    setForecast(bundle.forecast);
    setTrends(bundle.trends);
    setDaily(bundle.daily);
  }, []);

  const fetchMonthBundle = useCallback(async (year, month) => {
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];

    const [m, c, cmp, f, t, d] = await Promise.allSettled([
      statsService.getMonthlyStats(year, month),
      statsService.getCategoryStats(monthStart, monthEnd),
      statsService.compareStats('month', 6, year, month),
      statsService.forecastSpending(6, year, month),
      statsService.analyzeTrends(12, year, month),
      statsService.getDailyStats(monthStart, monthEnd),
    ]);

    const bundle = {
      monthly: null,
      catStats: [],
      compare: [],
      forecast: null,
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
        _id: item.category,
        totalIncome: item.income || 0,
        totalExpense: item.expense || 0,
        count: item.count || 0,
      }));
    }

    if (cmp.status === 'fulfilled') {
      const periods = cmp.value?.data?.periods || [];
      bundle.compare = periods.map(p => {
        const [mon, yr] = (p.period || '').split('/');
        return {
          month: parseInt(mon) || 0,
          year: parseInt(yr) || 0,
          totalIncome: p.income || 0,
          totalExpense: p.expense || 0,
        };
      });
    }

    if (f.status === 'fulfilled') {
      const fd = f.value?.data;
      bundle.forecast = fd ? { ...fd.forecast, byCategory: fd.byCategory } : null;
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
      setForecast(null);
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
  }, [selectedYear, selectedMonth, fetchMonthBundle, getMonthKey, applyMonthBundle, prefetchMonth]);

  useEffect(() => {
    const loadAiInsights = async () => {
      try {
        const ai = await statsService.getAIInsights();
        const aid = ai?.data;
        if (aid) {
          setAiInsights({
            ...aid,
            savingsRate: aid.avgSavingsRate || 0,
            categoryTrends: (aid.categoryTrends || []).map(c => ({
              category: c.category,
              recent: c.recentAvg || 0,
              prior: c.priorAvg || 0,
              change: c.changePercent || 0,
            })),
            bestMonth: aid.bestMonth ? { name: aid.bestMonth.label } : null,
            worstMonth: aid.worstMonth ? { name: aid.worstMonth.label } : null,
          });
        }
      } catch {
        setAiInsights(null);
      }
    };

    loadAiInsights();
  }, []);

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

  const TABS = [
    { key: 'overview',  label: 'Tổng quan',   icon: <FiBarChart2 size={13}/> },
    { key: 'compare',   label: 'So sánh',     icon: <FiActivity size={13}/> },
    { key: 'forecast',  label: 'Dự báo AI',   icon: <FiTarget size={13}/> },
    { key: 'trends',    label: 'Xu hướng',    icon: <FiTrendingUp size={13}/> },
    { key: 'daily',     label: 'Theo ngày',   icon: <FiCalendar size={13}/> },
    { key: 'ai',        label: 'Nhận xét AI', icon: <FiZap size={13}/> },
  ];

  const TAB_ACTIVE = 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm';

  // ── Overview tab ─────────────────────────────────────────────────────────
  const OverviewTab = () => {
    const pieData = catStats.filter(c => c.totalExpense > 0).slice(0, 8).map((c, i) => ({
      name: c._id, value: c.totalExpense, fill: COLORS[i % COLORS.length]
    }));
    const topExpCats = [...catStats].sort((a, b) => b.totalExpense - a.totalExpense).slice(0, 6);
    const maxExp = topExpCats[0]?.totalExpense || 1;
    const overviewIncome = monthly?.totalIncome || 0;
    const overviewExpense = monthly?.totalExpense || 0;
    const overviewSaving = overviewIncome - overviewExpense;
    const overviewSavingRate = overviewIncome > 0 ? (overviewSaving / overviewIncome) * 100 : 0;

    return (
      <div className="space-y-5">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">Tổng quan theo kỳ</h3>
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">Theo dõi hiệu suất tài chính theo tháng và năm</p>
            </div>
            <div className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-semibold text-[#435066] dark:bg-[#2a3341] dark:text-[#c7d1df]">
              Tỷ lệ tiết kiệm: {overviewSavingRate.toFixed(1)}%
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <div className="flex items-center bg-[#f4f7fb] dark:bg-[#222935] p-1 rounded-xl gap-0.5 flex-wrap">
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <button key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`w-9 h-7 rounded-lg text-xs font-semibold transition-all ${
                    selectedMonth === m
                      ? 'bg-white dark:bg-[#303746] text-[#1f2733] dark:text-[#f1f4f8] shadow-sm'
                      : 'text-[#7f8795] dark:text-[#9ba3b2] hover:text-[#2d3645] dark:hover:text-[#e5eaf1]'
                  }`}
                >T{m}</button>
              ))}
            </div>
            <div className="flex items-center bg-[#f4f7fb] dark:bg-[#222935] p-1 rounded-xl gap-0.5">
              {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                <button key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 h-7 rounded-lg text-xs font-semibold transition-all ${
                    selectedYear === y
                      ? 'bg-white dark:bg-[#303746] text-[#1f2733] dark:text-[#f1f4f8] shadow-sm'
                      : 'text-[#7f8795] dark:text-[#9ba3b2] hover:text-[#2d3645] dark:hover:text-[#e5eaf1]'
                  }`}
                >{y}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Thu nhập</p>
            <p className="mt-2 text-2xl font-black text-[#159b63] dark:text-[#58d49f]">{fmt(overviewIncome)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Chi tiêu</p>
            <p className="mt-2 text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f]">{fmt(overviewExpense)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Tiết kiệm ròng</p>
            <p className={`mt-2 text-2xl font-black ${overviewSaving >= 0 ? 'text-[#2e67da] dark:text-[#8eb2ff]' : 'text-[#c0701c] dark:text-[#f2ba76]'}`}>
              {fmt(overviewSaving)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Giao dịch</p>
            <p className="mt-2 text-2xl font-black text-[#7a43db] dark:text-[#bd97ff]">{monthly?.totalTransactions ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-blue-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Tỷ lệ chi tiêu theo danh mục</h3>
            </div>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<ChartTip fmt={fmt}/>}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">Chưa có dữ liệu</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-red-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Top danh mục chi tiêu</h3>
            </div>
            <div className="space-y-2.5">
              {topExpCats.map((c, i) => (
                <div key={c._id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-[#1f2733] dark:text-[#e8edf4] truncate max-w-[60%]">{c._id}</span>
                    <span className="font-bold text-[#df4b4b] dark:text-[#ff8f8f] flex-shrink-0 ml-2">{fmt(c.totalExpense)}</span>
                  </div>
                  <div className="h-1.5 bg-[#e1e7f0] dark:bg-[#2e3542] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(c.totalExpense / maxExp) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}/>
                  </div>
                </div>
              ))}
              {topExpCats.length === 0 && <p className="text-sm text-[#6f7480] dark:text-[#a4acba] py-8 text-center">Chưa có dữ liệu</p>}
            </div>
          </div>
        </div>

        {catStats.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-purple-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Thu/Chi theo danh mục</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={catStats.slice(0,8).map(c => ({ name: c._id, 'Thu nhập': c.totalIncome||0, 'Chi tiêu': c.totalExpense||0 }))} margin={{left: 0, right: 0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
                <XAxis dataKey="name" tick={{fontSize:10}} interval={0} angle={-30} textAnchor="end" height={50}/>
                <YAxis tickFormatter={fmtShort} tick={{fontSize:10}} width={45}/>
                <Tooltip content={<ChartTip fmt={fmt}/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Thu nhập" fill="#10b981" radius={[3,3,0,0]}/>
                <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[3,3,0,0]}/>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Tổng thu (6 tháng)</p>
          <p className="mt-2 text-2xl font-black text-[#159b63] dark:text-[#58d49f]">
            {fmt(compare.reduce((s,m)=>s+(m.totalIncome||0),0))}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Tổng chi (6 tháng)</p>
          <p className="mt-2 text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f]">
            {fmt(compare.reduce((s,m)=>s+(m.totalExpense||0),0))}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">TB thu/tháng</p>
          <p className="mt-2 text-2xl font-black text-[#2e67da] dark:text-[#8eb2ff]">
            {fmt(compare.length ? compare.reduce((s,m)=>s+(m.totalIncome||0),0)/compare.length : 0)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">TB chi/tháng</p>
          <p className="mt-2 text-2xl font-black text-[#c0701c] dark:text-[#f2ba76]">
            {fmt(compare.length ? compare.reduce((s,m)=>s+(m.totalExpense||0),0)/compare.length : 0)}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-blue-500"/>
          <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">So sánh thu/chi 6 tháng gần nhất</h3>
        </div>
        {compare.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compare.map(m=>({ name:`T${m.month}/${String(m.year).slice(2)}`, 'Thu nhập': m.totalIncome||0, 'Chi tiêu': m.totalExpense||0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
              <XAxis dataKey="name" tick={{fontSize:11}}/>
              <YAxis tickFormatter={fmtShort} tick={{fontSize:10}} width={48}/>
              <Tooltip content={<ChartTip fmt={fmt}/>}/>
              <Legend wrapperStyle={{fontSize:11}}/>
              <Bar dataKey="Thu nhập" fill="#10b981" radius={[4,4,0,0]}/>
              <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        ) : <div className="h-[260px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">Chưa có dữ liệu</div>}
      </div>

      {compare.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Chi tiết theo tháng</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#f8f9fb] dark:bg-[#232936]">
                <tr>
                  {['Tháng','Thu nhập','Chi tiêu','Tiết kiệm','Tỷ lệ tiết kiệm','Tăng trưởng chi'].map(h => (
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
                    <tr key={i} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#f7f9fc] dark:hover:bg-[#202632] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">T{m.month}/{m.year}</td>
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
        </div>
      )}
    </div>
  );

  // ── Forecast tab ─────────────────────────────────────────────────────────
  const ForecastTab = () => {
    const f = forecast;
    const histData = compare.map(m => ({
      name: `T${m.month}/${String(m.year).slice(2)}`,
      'Chi tiêu thực': m.totalExpense || 0,
      'Thu nhập thực': m.totalIncome  || 0,
    }));
    const nextLabel = (() => {
      const d = new Date(); d.setMonth(d.getMonth() + 1);
      return `T${d.getMonth()+1}/${String(d.getFullYear()).slice(2)}`;
    })();
    const chartData = [
      ...histData,
      { name: nextLabel, 'Dự báo chi': f?.nextMonthExpense||0, 'Dự báo thu': f?.nextMonthIncome||0, isDashed: true },
    ];

    const catForecastList = f?.byCategory ? Object.entries(f.byCategory).slice(0,8) : [];
    const confidenceMap = {
      high: 'Tin cậy cao',
      medium: 'Trung bình',
      low: 'Thấp',
    };

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Dự báo chi tiêu</p>
            <p className="mt-2 text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f]">{fmt(f?.nextMonthExpense)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Dự báo thu nhập</p>
            <p className="mt-2 text-2xl font-black text-[#159b63] dark:text-[#58d49f]">{fmt(f?.nextMonthIncome)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Dự báo tiết kiệm</p>
            <p className="mt-2 text-2xl font-black text-[#2e67da] dark:text-[#8eb2ff]">{fmt(f?.nextMonthSavings)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Độ tin cậy mô hình</p>
            <p className="mt-2 text-2xl font-black text-[#7a43db] dark:text-[#bd97ff]">{confidenceMap[f?.confidence] || '—'}</p>
          </div>
        </div>

        {f && (
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-purple-500"/>
                <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Mô hình dự báo ML</h3>
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={f.confidence}/>
                <span className="text-xs text-gray-400 dark:text-gray-500">R²: {((f.r2Expense||0)*100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3 flex-wrap">
              <span>Dự báo chi: <span className="font-semibold text-red-500">{fmt(f.nextMonthExpense)}</span></span>
              <span>Khoảng tin cậy: <span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(f.marginLow)} – {fmt(f.marginHigh)}</span></span>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
                <XAxis dataKey="name" tick={{fontSize:11}}/>
                <YAxis tickFormatter={fmtShort} tick={{fontSize:10}} width={48}/>
                <Tooltip content={<ChartTip fmt={fmt}/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <ReferenceLine x={nextLabel} stroke="#8b5cf6" strokeDasharray="4 2" label={{value:'Dự báo', fontSize:10, fill:'#8b5cf6'}}/>
                <Area type="monotone" dataKey="Thu nhập thực" stroke="#10b981" fill="url(#gInc)" strokeWidth={2}/>
                <Area type="monotone" dataKey="Chi tiêu thực" stroke="#ef4444" fill="url(#gExp)" strokeWidth={2}/>
                <Bar dataKey="Dự báo chi" fill="#ef444466" radius={[4,4,0,0]}/>
                <Bar dataKey="Dự báo thu" fill="#10b98166" radius={[4,4,0,0]}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {catForecastList.length > 0 && (
          <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Dự báo chi tiêu theo danh mục</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#f8f9fb] dark:bg-[#232936]">
                  <tr>
                    {['Danh mục','Trung bình/tháng','Dự báo tháng tới','Xu hướng','Độ tin cậy'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#7a808c] dark:text-[#9fa7b4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catForecastList.map(([cat, d]) => (
                    <tr key={cat} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#f7f9fc] dark:hover:bg-[#202632] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">{cat}</td>
                      <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{fmt(d.average)}</td>
                      <td className="px-4 py-2.5 font-bold text-red-600 dark:text-red-400">{fmt(d.forecast)}</td>
                      <td className="px-4 py-2.5"><TrendBadge trend={d.trend}/></td>
                      <td className="px-4 py-2.5"><ConfidenceBadge confidence={d.r2 > 0.7 ? 'high' : d.r2 > 0.4 ? 'medium' : 'low'}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Trends tab ───────────────────────────────────────────────────────────
  const TrendsTab = () => {
    const t = trends;
    const trendData = t?.monthlyData || [];
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">TB Thu/tháng</p>
            <p className="mt-2 text-2xl font-black text-[#159b63] dark:text-[#58d49f]">{fmt(t?.averageIncome)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">TB Chi/tháng</p>
            <p className="mt-2 text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f]">{fmt(t?.averageExpense)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">TB Tiết kiệm</p>
            <p className="mt-2 text-2xl font-black text-[#2e67da] dark:text-[#8eb2ff]">{fmt(t?.averageSavings)}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Xu hướng chi</p>
            <p className="mt-2 text-2xl font-black text-[#7a43db] dark:text-[#bd97ff]">{t?.overallTrend || '—'}</p>
          </div>
        </div>

        {trendData.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-blue-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Xu hướng thu/chi/tiết kiệm 12 tháng</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendData.map(d => ({
                name: `T${d.month}/${String(d.year).slice(2)}`,
                'Thu nhập': d.income||0, 'Chi tiêu': d.expense||0, 'Tiết kiệm': d.savings||0
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
                <Area type="monotone" dataKey="Thu nhập" stroke="#10b981" fill="url(#gI)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="Chi tiêu"  stroke="#ef4444" fill="url(#gE)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="Tiết kiệm" stroke="#3b82f6" fill="url(#gS)" strokeWidth={2} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {trendData.length > 0 && (
          <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Chi tiết theo tháng</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#f8f9fb] dark:bg-[#232936]">
                  <tr>
                    {['Tháng','Thu nhập','Chi tiêu','Tiết kiệm','Tỷ lệ tiết kiệm'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#7a808c] dark:text-[#9fa7b4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((d, i) => {
                    const rate = d.income ? ((d.savings/d.income)*100) : 0;
                    return (
                      <tr key={i} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#f7f9fc] dark:hover:bg-[#202632] transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">T{d.month}/{d.year}</td>
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

    return (
    <div className="space-y-5">
      <div className="flex items-center bg-[#f4f7fb] dark:bg-[#222935] p-1 rounded-xl gap-0.5 w-fit">
        {[7, 14, 30].map(d => (
          <button key={d}
            onClick={() => handleDailyRange(d)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dailyRange === d
                ? 'bg-white dark:bg-[#303746] text-[#1f2733] dark:text-[#f1f4f8] shadow-sm'
                : 'text-[#7f8795] dark:text-[#9ba3b2] hover:text-[#2d3645] dark:hover:text-[#e5eaf1]'
            }`}
          >{d} ngày</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Tổng thu giai đoạn</p>
          <p className="mt-2 text-2xl font-black text-[#159b63] dark:text-[#58d49f]">{fmt(dailyIncomeTotal)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Tổng chi giai đoạn</p>
          <p className="mt-2 text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f]">{fmt(dailyExpenseTotal)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Cân bằng ròng</p>
          <p className={`mt-2 text-2xl font-black ${dailyIncomeTotal - dailyExpenseTotal >= 0 ? 'text-[#2e67da] dark:text-[#8eb2ff]' : 'text-[#c0701c] dark:text-[#f2ba76]'}`}>
            {fmt(dailyIncomeTotal - dailyExpenseTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
          <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Số giao dịch</p>
          <p className="mt-2 text-2xl font-black text-[#7a43db] dark:text-[#bd97ff]">{dailyTxTotal}</p>
        </div>
      </div>

      {daily.length > 0 ? (
        <>
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-emerald-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Thu/chi theo ngày</h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={daily.map(d => ({
                name: new Date(d.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}),
                'Thu nhập': d.income||0, 'Chi tiêu': d.expense||0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-[#222]"/>
                <XAxis dataKey="name" tick={{fontSize:9}} interval={Math.floor(daily.length/7)}/>
                <YAxis tickFormatter={fmtShort} tick={{fontSize:9}} width={45}/>
                <Tooltip content={<ChartTip fmt={fmt}/>}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="Thu nhập" fill="#10b981" radius={[3,3,0,0]}/>
                <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Chi tiết theo ngày</h3>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#f8f9fb] dark:bg-[#232936] sticky top-0">
                  <tr>
                    {['Ngày','Thu nhập','Chi tiêu','Số giao dịch'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#7a808c] dark:text-[#9fa7b4]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...daily].reverse().map((d, i) => (
                    <tr key={i} className="border-t border-[#eef1f6] dark:border-[#2a303b] hover:bg-[#f7f9fc] dark:hover:bg-[#202632] transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
                        {new Date(d.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}
                      </td>
                      <td className="px-4 py-2.5 text-emerald-600 dark:text-emerald-400 font-medium">{fmt(d.income)}</td>
                      <td className="px-4 py-2.5 text-red-600 dark:text-red-400 font-medium">{fmt(d.expense)}</td>
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">{d.count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-sm text-[#6f7480] dark:text-[#a4acba]">Chưa có dữ liệu trong khoảng thời gian này</div>
      )}
    </div>
    );
  };

  // ── AI Insights tab ──────────────────────────────────────────────────────
  const AITab = () => {
    const ai = aiInsights;
    if (!ai) return <div className="text-center py-16 text-sm text-[#6f7480] dark:text-[#a4acba]">Đang tải nhận xét AI...</div>;

    const score = ai.healthScore || 0;
    const scoreColor = score >= 70 ? 'text-emerald-600 dark:text-emerald-400' : score >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
    const scoreBarColor = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
    const recIcons = { success: <FiCheckCircle size={14}/>, warning: <FiAlertCircle size={14}/>, error: <FiAlertCircle size={14}/>, info: <FiInfo size={14}/> };
    const recColors = {
      success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400',
      warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400',
      error:   'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400',
      info:    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400',
    };
    const recommendationsCount = ai.recommendations?.length || 0;
    const anomaliesCount = ai.anomalies?.length || 0;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Điểm sức khỏe</p>
            <p className={`mt-2 text-2xl font-black ${scoreColor}`}>{score}/100</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Tỷ lệ tiết kiệm TB</p>
            <p className="mt-2 text-2xl font-black text-[#2e67da] dark:text-[#8eb2ff]">{ai.savingsRate?.toFixed(1) || 0}%</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Khuyến nghị AI</p>
            <p className="mt-2 text-2xl font-black text-[#7a43db] dark:text-[#bd97ff]">{recommendationsCount}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-[#191d25]">
            <p className="text-xs uppercase tracking-wide text-[#7f8795] dark:text-[#9da6b5]">Bất thường</p>
            <p className="mt-2 text-2xl font-black text-[#df4b4b] dark:text-[#ff8f8f]">{anomaliesCount}</p>
          </div>
        </div>

        {/* Health score */}
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-purple-500"/>
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Điểm sức khỏe tài chính</h3>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-6xl font-black ${scoreColor}`}>{score}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">/ 100</p>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor}`} style={{width:`${score}%`}}/>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {score >= 70 ? 'Tài chính của bạn đang rất tốt! Tiếp tục duy trì nhé.'
                 : score >= 40 ? 'Tài chính ở mức trung bình. Hãy xem các gợi ý bên dưới.'
                 : 'Tài chính cần được cải thiện. Hãy chú ý đến các cảnh báo.'}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center">
                <div className="bg-[#f7f9fc] dark:bg-[#232936] rounded-lg py-2">
                  <p className="text-gray-400 dark:text-gray-500 mb-0.5">Tỷ lệ TK</p>
                  <p className="font-bold text-gray-700 dark:text-gray-200">{ai.savingsRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="bg-[#f7f9fc] dark:bg-[#232936] rounded-lg py-2">
                  <p className="text-gray-400 dark:text-gray-500 mb-0.5">Tháng tốt nhất</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{ai.bestMonth?.name || '—'}</p>
                </div>
                <div className="bg-[#f7f9fc] dark:bg-[#232936] rounded-lg py-2">
                  <p className="text-gray-400 dark:text-gray-500 mb-0.5">Tháng khó nhất</p>
                  <p className="font-bold text-red-600 dark:text-red-400">{ai.worstMonth?.name || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {ai.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5] px-1">Gợi ý từ AI</h3>
            {ai.recommendations.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${recColors[r.type] || recColors.info}`}>
                <span className="flex-shrink-0 mt-0.5">{recIcons[r.type] || recIcons.info}</span>
                <span>{r.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Anomalies */}
        {ai.anomalies?.length > 0 && (
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 rounded-full bg-red-500"/>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Giao dịch bất thường phát hiện</h3>
            </div>
            <div className="space-y-2">
              {ai.anomalies.map((a, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">{a.month || a.period}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Chi vượt TB: +{a.deviation?.toFixed(1) || 0}%</p>
                  </div>
                  <span className="text-sm font-black text-red-600 dark:text-red-400">{fmt(a.expense || a.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category trends */}
        {ai.categoryTrends?.length > 0 && (
          <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eceff4] dark:border-[#2b313d]">
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">Xu hướng danh mục đáng chú ý</h3>
            </div>
            <div className="divide-y divide-[#eef1f6] dark:divide-[#2a303b]">
              {ai.categoryTrends.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-[#f7f9fc] dark:hover:bg-[#202632] transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{c.category}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">3 tháng gần: {fmt(c.recent)} vs trước: {fmt(c.prior)}</p>
                  </div>
                  <span className={`text-sm font-black ${c.change > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {c.change > 0 ? '+' : ''}{c.change?.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
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
  const healthScore = aiInsights?.healthScore || 0;
  const monthTopCategory = [...catStats]
    .sort((a, b) => (b.totalExpense || 0) - (a.totalExpense || 0))[0];
  const periodLabel = `Tháng ${selectedMonth}/${selectedYear}`;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiBarChart2 size={18} className="text-[#b8e4d6]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">Bảng điều khiển thống kê</p>
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{fmt(currentBalance)}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
              <FiZap size={12} />
              {periodLabel} • Tỷ lệ tiết kiệm {savingRate.toFixed(1)}%
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">Tổng thu</p>
                <p className="mt-1 text-2xl font-bold">{fmt(currentIncome)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">Tổng chi</p>
                <p className="mt-1 text-2xl font-bold">{fmt(currentExpense)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">Số giao dịch</p>
                <p className="mt-1 text-2xl font-bold">{monthly?.totalTransactions ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">Chỉ số AI</h3>
              <span className="text-xs font-semibold text-[#3a4a62] dark:text-[#b9c3d0]">ML-powered</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-[#586074] dark:text-[#a9afbb]">
                  <span className="font-semibold">Điểm sức khỏe tài chính</span>
                  <span className="font-bold">{healthScore}/100</span>
                </div>
                <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${healthScore >= 70 ? 'bg-[#2f8e6f]' : healthScore >= 40 ? 'bg-[#d29b2a]' : 'bg-[#c24b4b]'}`}
                    style={{ width: `${Math.max(0, Math.min(healthScore, 100))}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#f1f4f8] p-3 dark:bg-[#222935]">
                <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">Danh mục chi cao nhất</p>
                <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                  {monthTopCategory ? `${monthTopCategory._id}: ${fmt(monthTopCategory.totalExpense)}` : 'Chưa có dữ liệu danh mục'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl bg-white p-1.5 shadow-sm dark:bg-[#191d25]">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(t => (
            <button key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === t.key
                  ? TAB_ACTIVE
                  : 'text-[#6f7480] dark:text-[#a4acba] hover:text-[#1f2733] dark:hover:text-[#e8edf4] hover:bg-[#f3f5f9] dark:hover:bg-[#242c38]'
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
      {activeTab === 'forecast'  && <ForecastTab/>}
      {activeTab === 'trends'    && <TrendsTab/>}
      {activeTab === 'daily'     && <DailyTab/>}
      {activeTab === 'ai'        && <AITab/>}
    </div>
  );
};

export default Statistics;
