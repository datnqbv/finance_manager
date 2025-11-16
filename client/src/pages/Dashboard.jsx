import { useEffect, useState } from 'react';
import { statsService } from '../services/stats.service';
import { transactionService } from '../services/transaction.service';
import goalService from '../services/goal.service';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity, FiCalendar, FiAlertTriangle, FiTarget, FiSun, FiMoon, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ComposedChart, Area } from 'recharts';
import PageTransition from '../components/PageTransition';
import { DashboardSkeleton } from '../components/LoadingSkeleton';
import CustomTooltip from '../components/Tooltip';

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null); // để dùng cho dashboard tổng quát , chứa các thông tin như thu nhập, chi tiêu, số dư
  const [filteredSummary, setFilteredSummary] = useState(null); // Summary theo time filter
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('month'); // today, week, month, year
  const [dailyFluctuation, setDailyFluctuation] = useState([]); // Dữ liệu dao động hàng ngày cho candlestick

  useEffect(() => {
    fetchData();
  }, [timeFilter]);

  // Tính toán startDate và endDate dựa trên timeFilter
  // Dùng cho phần fetchData của dashboard, để lấy dữ liệu giao dịch theo khoảng thời gian
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
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Thứ 2 là đầu tuần
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

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };
  
  // Fetch tất cả dữ liệu cần thiết cho Dashboard
  // DÙng cho phần hiển thị tổng quan dashboard , để cho người dùng thấy được cái nhìn tổng quan về tài chính của họ
  const fetchData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      
      // Chuẩn bị 6 tháng cho monthly stats
      const now = new Date();
      const monthlyPromises = [];
      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        monthlyPromises.push(
          statsService.getMonthlyStats(year, month)
            .then(response => {
              if (response.data && response.data.summary) {
                return {
                  year,
                  month,
                  totalIncome: response.data.summary.income || 0,
                  totalExpense: response.data.summary.expense || 0
                };
              }
              return null;
            })
            .catch(error => {
              console.error(`Error fetching month ${month}/${year}:`, error);
              return null;
            })
        );
      }
      
      // GỌI TẤT CẢ API SONG SONG (4 + 6 = 10 requests cùng lúc)
      // để tiết kiệm thời gian chờ đợi
      const [summaryData, goalsData, transactionsData, categoryData, ...monthlyResults] = await Promise.all([
        statsService.getSummary(),
        goalService.getGoals(),
        transactionService.getTransactions({ 
          startDate, 
          endDate,
          limit: 1000
        }),
        statsService.getCategoryStats(startDate, endDate),
        ...monthlyPromises
      ]);
      // Xử lý dữ liệu nhận được 
      setSummary(summaryData.data);
      setGoals(Array.isArray(goalsData.data) ? goalsData.data : []);
      setCategoryStats(Array.isArray(categoryData.data) ? categoryData.data : []);
      setMonthlyStats(monthlyResults.filter(item => item !== null));
      
      // Tính toán summary từ transactions theo time filter
      const transactions = transactionsData.data || [];
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setFilteredSummary({
        income,
        expense,
        balance: income - expense,
        transactionCount: transactions.length,
        recentTransactions: transactions.slice(0, 5)
      });

      // Tính toán dao động hàng ngày cho Candlestick Chart (7 ngày gần nhất)
      calculateDailyFluctuation(transactions);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tính toán dao động thu/chi hàng ngày cho biểu đồ Candlestick (7 ngày gần nhất)
  const calculateDailyFluctuation = (transactions) => {
    const dailyData = {};
    const now = new Date();
    
    // Tạo 7 ngày gần nhất
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dailyData[dateKey] = {
        date: dateKey,
        dateLabel: `${date.getDate()}/${date.getMonth() + 1}`,
        income: 0,
        expense: 0,
        balance: 0,
        count: 0
      };
    }

    // Nhóm transactions theo ngày để tính tổng các giá trị cho từng ngày
    // như là thu nhập, chi tiêu, số giao dịch
    transactions.forEach(t => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (dailyData[dateKey]) {
        if (t.type === 'income') {
          dailyData[dateKey].income += t.amount;
        } else {
          dailyData[dateKey].expense += t.amount;
        }
        dailyData[dateKey].count += 1;
      }
    });

    // Tính balance và trung bình cho phần dao động của cái biểu đồ Candlestick (7 ngày gần nhất)
    const dailyArray = Object.values(dailyData);
    const avgIncome = dailyArray.reduce((sum, d) => sum + d.income, 0) / dailyArray.length;
    const avgExpense = dailyArray.reduce((sum, d) => sum + d.expense, 0) / dailyArray.length;

    dailyArray.forEach(day => {
      day.balance = day.income - day.expense;
      day.avgIncome = avgIncome;
      day.avgExpense = avgExpense;
      // Tính độ lệch so với trung bình
      day.incomeDeviation = ((day.income - avgIncome) / (avgIncome || 1)) * 100;
      day.expenseDeviation = ((day.expense - avgExpense) / (avgExpense || 1)) * 100;
    });

    setDailyFluctuation(dailyArray);
  };

  // Tính toán greeting (greeting là dùng để chào hỏi người dùng) theo thời gian
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Chào buổi sáng', icon: <FiSun className="text-yellow-500" /> };
    if (hour < 18) return { text: 'Chào buổi chiều', icon: <FiClock className="text-orange-500" /> };
    return { text: 'Chào buổi tối', icon: <FiMoon className="text-blue-500" /> };
  };

  // Lấy label cho time filter (time filter là bộ lọc thời gian) để có thể hiển thị đúng thời gian được chọn
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'hôm nay';
      case 'week': return 'tuần này';
      case 'year': return 'năm nay';
      case 'month':
      default: return 'tháng này';
    }
  };

  // Tính toán AI insight - CHỈ cho filter "Tháng này"
  // giúp người dùng hiểu rõ hơn về tình hình tài chính của họ qua các gợi ý thông minh
  // nó bao gồm các so sánh với tháng trước để đưa ra nhận xét
  // để báo cho người dùng biết họ đang quản lý tài chính như thế nào 
  const getAIInsight = () => {
    // Chỉ hiển thị khi filter = month và có đủ dữ liệu 2 tháng
    if (timeFilter !== 'month' || !monthlyStats || monthlyStats.length < 2) return null;
    
    // Lấy dữ liệu tháng hiện tại (tháng cuối trong monthlyStats)
    const thisMonthData = monthlyStats[monthlyStats.length - 1];
    const lastMonthData = monthlyStats[monthlyStats.length - 2];
    
    if (!thisMonthData || !lastMonthData) return null;
    
    const thisMonthBalance = (thisMonthData.totalIncome || 0) - (thisMonthData.totalExpense || 0);
    const lastMonthBalance = (lastMonthData.totalIncome || 0) - (lastMonthData.totalExpense || 0);
    
    const change = thisMonthBalance - lastMonthBalance;
    
    // Tránh chia cho 0, dùng lastMonthBalance làm base
    const percentChange = lastMonthBalance !== 0 
      ? ((change / Math.abs(lastMonthBalance)) * 100).toFixed(1) 
      : (thisMonthBalance > 0 ? 100 : 0);
    
    if (change > 0) {
      return {
        message: `Tháng này bạn tiết kiệm tốt hơn ${Math.abs(percentChange)}% so với tháng trước 🎉`,
        type: 'success'
      };
    } else if (change < 0) {
      return {
        message: `Tiết kiệm tháng này giảm ${Math.abs(percentChange)}% so với tháng trước ⚠️`,
        type: 'warning'
      };
    }
    return { message: 'Tiết kiệm ổn định so với tháng trước 👍', type: 'info' };
  };

  // Kiểm tra cảnh báo chi tiêu - Sử dụng filteredSummary
  // dùng để thông báo cho người dùng khi họ chi tiêu vượt mức so với thu nhập trong kỳ đã chọn
  const getBudgetAlert = () => {
    if (!filteredSummary) return null;
    
    const income = filteredSummary.income || 0; // thu nhập trong kỳ - tháng
    const expense = filteredSummary.expense || 0; // chi tiêu trong kỳ - tháng
    
    if (income === 0) return null; // Không có thu nhập thì không cảnh báo gì
    
    const percentage = (expense / income) * 100; // tỷ lệ chi tiêu trên thu nhập
    
    if (percentage >= 90) {
      return {
        message: `⚠️ NGUY HIỂM! Bạn đã chi ${percentage.toFixed(0)}% sô tiền trong kỳ này!`, // tính phần trăm của thu nhập và làm tròn
        color: 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-800 dark:text-red-400'
      };
    } else if (percentage >= 80) {
      return {
        message: `⚠️ Bạn đã chi ${percentage.toFixed(0)}% số tiền trong kỳ này, cần kiểm soát lại!`,
        color: 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-500 text-yellow-800 dark:text-yellow-400'
      };
    }
    return null;
  };

  // Tính toán mục tiêu tiết kiệm từ Goals thực tế
  // để hiển thị trên dashboard cho người dùng biết họ đang tiến triển đến mục tiêu tiết kiệm như thế nào
  const getSavingsGoal = () => {
    // Lấy goal đang active (chưa đạt được) và ưu tiên cao nhất
    const activeGoals = goals.filter(g => !g.isAchieved);
    
    if (activeGoals.length === 0) {
      // Nếu không có goal nào, hiển thị số dư theo filter hiện tại
      const currentSavings = filteredSummary?.balance || 0;
      return {
        target: 0,
        current: currentSavings,
        percentage: 0,
        goalName: 'Chưa có mục tiêu',
        hasGoal: false
      };
    }
    
    // Ưu tiên: high > medium > low, và gần deadline nhất
    // mức độ ưu tiên được xác định bởi thuộc tính 'priority' của goal
    // priorityOrder là một đối tượng ánh xạ mức độ ưu tiên thành số để dễ so sánh
    // sau đó sắp xếp theo deadline để lấy goal cần ưu tiên nhất
    const sortedGoals = activeGoals.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });
    
    const primaryGoal = sortedGoals[0];
    const percentage = Math.min((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100, 100);
    
    return {
      target: primaryGoal.targetAmount,
      current: primaryGoal.currentAmount,
      percentage: percentage.toFixed(1),
      goalName: primaryGoal.name,
      icon: primaryGoal.icon || '🎯',
      deadline: primaryGoal.deadline,
      daysRemaining: primaryGoal.daysRemaining,
      hasGoal: true
    };
  };

  // Format data cho biểu đồ Bar Chart 
  const getChartData = () => {
    return monthlyStats.map(stat => ({
      month: `T${stat.month}/${stat.year}`,
      'Thu nhập': stat.totalIncome || 0,
      'Chi tiêu': stat.totalExpense || 0,
      'Tiết kiệm': (stat.totalIncome || 0) - (stat.totalExpense || 0)
    }));
  };

  // Màu cho Pie Chart
  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  // Fetch summary chung
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await statsService.getSummary();
      setSummary(data.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };
  // Format currency theo locale người dùng
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };
  // Format date theo locale người dùng
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  // Kết xuất giao diện Dashboard
  // Hiển thị các thông tin tài chính quan trọng một cách trực quan và dễ hiểu
  const greeting = getGreeting();
  const budgetAlert = getBudgetAlert();
  const savingsGoal = getSavingsGoal();
  const aiInsight = getAIInsight(); // Tính toán sau khi có monthlyStats

  if (loading) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
      {/* Header với Greeting thông minh + Time Filter */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-blue-500/10 
                      dark:from-primary-500/5 dark:to-blue-500/5 rounded-2xl blur-3xl" />
        <div className="relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-clip-text flex items-center gap-2">
                {greeting.icon}
                {greeting.text}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Xin chào <span className="font-semibold text-primary-600 dark:text-primary-400">{user?.name}</span> 👋
              </p>
              {aiInsight && (
                <p className={`text-sm mt-2 font-medium ${
                  aiInsight.type === 'success' ? 'text-green-600 dark:text-green-400' : 
                  aiInsight.type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  💡 {aiInsight.message}
                </p>
              )}
            </div>

            {/* Time Filter */}
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Hôm nay', value: 'today', tooltip: 'Xem thống kê hôm nay' },
                { label: 'Tuần này', value: 'week', tooltip: 'Xem thống kê tuần này (Thứ 2 - CN)' },
                { label: 'Tháng này', value: 'month', tooltip: 'Xem thống kê tháng hiện tại' },
                { label: 'Năm nay', value: 'year', tooltip: 'Xem thống kê cả năm' }
              ].map(filter => (
                <CustomTooltip key={filter.value} content={filter.tooltip} position="bottom">
                  <button
                    onClick={() => setTimeFilter(filter.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      timeFilter === filter.value
                        ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'bg-white dark:bg-[#111111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2a2a2a] hover:border-primary-500'
                    }`}
                  >
                    <FiCalendar className="inline mr-2" size={16} />
                    {filter.label}
                  </button>
                </CustomTooltip>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cảnh báo chi tiêu vượt ngưỡng */}
      {budgetAlert && (
        <div className={`${budgetAlert.color} border-2 rounded-xl p-4 flex items-center gap-3 animate-pulse`}>
          <FiAlertTriangle size={24} />
          <p className="font-semibold">{budgetAlert.message}</p>
        </div>
      )}

      {/* Mục tiêu tiết kiệm */}
      {savingsGoal.hasGoal ? (
        <div className="card bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 border-2 border-purple-200 dark:border-purple-500/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <span className="text-2xl">{savingsGoal.icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {savingsGoal.goalName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hiện đạt: {formatCurrency(savingsGoal.current)} / {formatCurrency(savingsGoal.target)} ({savingsGoal.percentage}%)
              </p>
            </div>
            {savingsGoal.daysRemaining !== undefined && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Còn lại</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {savingsGoal.daysRemaining}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">ngày</p>
              </div>
            )}
          </div>
          <div className="relative">
            <div className="h-6 bg-gray-200 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{ width: `${savingsGoal.percentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
              {parseFloat(savingsGoal.percentage) >= 100 
                ? '🎉 Đã hoàn thành mục tiêu!' 
                : `Còn ${formatCurrency(savingsGoal.target - savingsGoal.current)} nữa là đạt mục tiêu!`
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center py-6">
            <div className="text-6xl mb-3">🎯</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Chưa có mục tiêu tài chính
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Hãy tạo mục tiêu để theo dõi tiến độ tiết kiệm của bạn
            </p>
            <button 
              onClick={() => window.location.href = '/goals'}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Tạo mục tiêu ngay
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards là thẻ để hiển thị các thông tin thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Income Card là thẻ để hiển thị thu nhập */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl 
                        blur opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative card bg-gradient-to-br from-green-500 to-emerald-600 text-white 
                        border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-green-100 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
                  Thu nhập {getTimeFilterLabel()}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(filteredSummary?.income || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FiTrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Expense Card là thẻ chi tiêu */}
        
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl 
                        blur opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative card bg-gradient-to-br from-red-500 to-rose-600 text-white 
                        border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-red-100 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-200 rounded-full animate-pulse" />
                  Chi tiêu {getTimeFilterLabel()}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(filteredSummary?.expense || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FiTrendingDown size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card  là thẻ để hiển thị số dư */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl 
                        blur opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative card bg-gradient-to-br from-blue-500 to-indigo-600 text-white 
                        border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-200 rounded-full animate-pulse" />
                  Số dư {getTimeFilterLabel()}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {formatCurrency(filteredSummary?.balance || 0)}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FiDollarSign size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Count Card là thẻ để hiển thị số lượng giao dịch */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl 
                        blur opacity-25 group-hover:opacity-40 transition-opacity" />
          <div className="relative card bg-gradient-to-br from-purple-500 to-violet-600 text-white 
                        border-0 hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-purple-100 text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-200 rounded-full animate-pulse" />
                  Giao dịch {getTimeFilterLabel()}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {filteredSummary?.transactionCount || 0}
                </p>
              </div>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FiActivity size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Stats - Candlestick Style Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiActivity className="text-primary-600" />
                Dao động Thu - Chi 7 ngày
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Biến động tài chính hàng ngày so với trung bình
              </p>
            </div>
          </div>
          
          {dailyFluctuation.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={dailyFluctuation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="dateLabel" 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}tr`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  
                  {/* Bar cho Income và Expense */}
                  <Bar dataKey="income" fill="#10b981" name="💰 Thu nhập" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="💸 Chi tiêu" radius={[4, 4, 0, 0]} />
                  
                  {/* Line cho trung bình */}
                  <Line 
                    type="monotone" 
                    dataKey="avgIncome" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="📊 TB Thu"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgExpense" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="📊 TB Chi"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Summary Stats là dùng để hiển thị các thông tin tóm tắt */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-green-50 dark:bg-green-500/10 rounded-lg border border-green-100 dark:border-green-500/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">TB Thu/ngày</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(dailyFluctuation.reduce((sum, d) => sum + d.income, 0) / dailyFluctuation.length)}
                  </p>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">TB Chi/ngày</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(dailyFluctuation.reduce((sum, d) => sum + d.expense, 0) / dailyFluctuation.length)}
                  </p>
                </div>
                <div className="text-center p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-100 dark:border-blue-500/20">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Biến động</p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {dailyFluctuation.filter(d => d.balance > 0).length}/{dailyFluctuation.length} ngày dương
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu dao động
            </div>
          )}
        </div>

        {/* Recent Transactions là danh sách các giao dịch gần đây  */}
        <div className="card hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Giao dịch gần đây
            </h3>
            <div className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 rounded-full">
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                Latest 5
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {filteredSummary?.recentTransactions?.length > 0 ? (
              filteredSummary.recentTransactions.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex justify-between items-center p-4 
                           border border-gray-100 dark:border-[#2a2a2a] rounded-xl 
                           hover:bg-gray-50 dark:hover:bg-[#1a1a1a] 
                           hover:scale-[1.02] transition-all duration-200
                           hover:shadow-md"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {transaction.category}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        transaction.type === 'income' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <span
                      className={
                        transaction.type === 'income' ? 'badge-income' : 'badge-expense'
                      }
                    >
                      {transaction.type === 'income' ? '📈 Thu' : '📉 Chi'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full 
                              flex items-center justify-center mx-auto mb-3">
                  <FiActivity className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  Chưa có giao dịch nào
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biểu đồ trực quan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart - Thu Chi theo tháng */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FiTrendingUp className="text-primary-600" />
                Xu hướng Thu - Chi 6 tháng
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Biểu đồ so sánh thu nhập và chi tiêu
              </p>
            </div>
          </div>
          
          {monthlyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280" 
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="Thu nhập" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Chi tiêu" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Tiết kiệm" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu thống kê
            </div>
          )}
        </div>

        {/* Pie Chart - Chi tiêu theo danh mục */}
        <div className="card">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiActivity className="text-purple-600" />
              Chi tiêu theo danh mục
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Phân bố chi tiêu
            </p>
          </div>
          
          {categoryStats.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryStats.slice(0, 6).map(cat => ({
                      name: cat.category,
                      value: cat.expense
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryStats.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Category Legend là phần chú giải màu sắc cho biểu đồ Pie Chart */}
              <div className="mt-4 space-y-2">
                {categoryStats.slice(0, 6).map((cat, index) => {
                  const total = categoryStats.reduce((sum, c) => sum + c.expense, 0);
                  const percentage = total > 0 ? ((cat.expense / total) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={cat.category} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {cat.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatCurrency(cat.expense)}
                        </p>
                        <p className="text-xs text-gray-500">{percentage}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400">
              Chưa có dữ liệu danh mục
            </div>
          )}
        </div>
      </div>

    </div>
    </PageTransition>
  );
};

export default Dashboard;
