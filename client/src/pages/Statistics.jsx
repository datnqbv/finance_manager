import { useEffect, useState } from 'react';
import { statsService } from '../services/stats.service';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { FiTrendingUp, FiTrendingDown, FiActivity, FiCalendar, FiTarget } from 'react-icons/fi';
import PageTransition from '../components/PageTransition';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const Statistics = () => {
  const { user } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [topCategories, setTopCategories] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('overview'); // overview, compare, forecast, trends, daily
  const [dailyPeriod, setDailyPeriod] = useState(7); // 7, 14, 30 days

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        monthlyData, 
        categoryData,
        compareResult,
        forecastResult,
        trendsResult,
        topCategoriesResult,
        dailyResult
      ] = await Promise.all([
        statsService.getMonthlyStats(selectedYear, selectedMonth),
        statsService.getCategoryStats(),
        statsService.compareStats('month', 6),
        statsService.forecastSpending(6),
        statsService.analyzeTrends(12),
        statsService.getTopCategories(10),
        statsService.getDailyStats()
      ]);
      
      setMonthlyStats(monthlyData.data);
      setCategoryStats(categoryData.data);
      setCompareData(compareResult.data);
      setForecastData(forecastResult.data);
      setTrendsData(trendsResult.data);
      setTopCategories(topCategoriesResult.data);
      setDailyStats(dailyResult.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };

  // Pie chart data for monthly income vs expense
  const pieChartData = {
    labels: ['Thu nhập', 'Chi tiêu'],
    datasets: [
      {
        data: [
          monthlyStats?.summary?.income || 0,
          monthlyStats?.summary?.expense || 0,
        ],
        backgroundColor: ['#10b981', '#ef4444'],
        borderColor: ['#059669', '#dc2626'],
        borderWidth: 2,
      },
    ],
  };

  // Bar chart data for categories
  const barChartData = {
    labels: categoryStats.map((cat) => cat.category),
    datasets: [
      {
        label: 'Thu nhập',
        data: categoryStats.map((cat) => cat.income),
        backgroundColor: '#10b981',
      },
      {
        label: 'Chi tiêu',
        data: categoryStats.map((cat) => cat.expense),
        backgroundColor: '#ef4444',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  // Compare chart data
  const compareChartData = compareData ? {
    labels: compareData.periods.map(p => p.period),
    datasets: [
      {
        label: 'Thu nhập',
        data: compareData.periods.map(p => p.income),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 2,
      },
      {
        label: 'Chi tiêu',
        data: compareData.periods.map(p => p.expense),
        backgroundColor: '#ef4444',
        borderColor: '#dc2626',
        borderWidth: 2,
      },
    ],
  } : null;

  // Trends chart data
  const trendsChartData = trendsData ? {
    labels: trendsData.trends.map(t => t.month),
    datasets: [
      {
        label: 'Thu nhập',
        data: trendsData.trends.map(t => t.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Chi tiêu',
        data: trendsData.trends.map(t => t.expense),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Tiết kiệm',
        data: trendsData.trends.map(t => t.savings),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  } : null;

  // Daily stats chart - chỉ lấy số ngày theo lựa chọn
  const filteredDailyStats = dailyStats.slice(-dailyPeriod);
  const dailyChartData = filteredDailyStats.length > 0 ? {
    labels: filteredDailyStats.map(d => new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Thu nhập',
        data: filteredDailyStats.map(d => d.income),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
      },
      {
        label: 'Chi tiêu',
        data: filteredDailyStats.map(d => d.expense),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
      },
    ],
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thống kê nâng cao</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Phân tích chi tiết và dự báo tài chính của bạn</p>
        </div>

        {/* Tabs */}
        <div className="card p-0 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'overview', label: 'Tổng quan', icon: FiActivity },
              { id: 'compare', label: 'So sánh', icon: FiTrendingUp },
              { id: 'forecast', label: 'Dự báo', icon: FiTarget },
              { id: 'trends', label: 'Xu hướng', icon: FiTrendingDown },
              { id: 'daily', label: 'Theo ngày', icon: FiCalendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Month/Year Selector */}
            <div className="card">
              <div className="flex gap-4">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="input"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      Tháng {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="input"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      Năm {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Thu nhập</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(monthlyStats?.summary?.income || 0)}
                </p>
              </div>
              <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Chi tiêu</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(monthlyStats?.summary?.expense || 0)}
                </p>
              </div>
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Số dư</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(monthlyStats?.summary?.balance || 0)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Thu Chi Tháng {selectedMonth}/{selectedYear}</h3>
                <div className="flex justify-center">
                  <div className="w-64 h-64">
                    <Pie data={pieChartData} options={chartOptions} />
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Theo Danh Mục</h3>
                {categoryStats.length > 0 ? (
                  <Bar data={barChartData} options={chartOptions} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">Chưa có dữ liệu</p>
                )}
              </div>
            </div>

            {/* Top Categories */}
            {topCategories && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Top 10 Danh Mục Chi Tiêu Nhiều Nhất</h3>
                <div className="space-y-3">
                  {topCategories.categories.map((cat, index) => (
                    <div key={cat.category} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium dark:text-white">{cat.category}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {cat.count} giao dịch
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(cat.total)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          TB: {formatCurrency(cat.average)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && compareData && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">So sánh 6 tháng gần đây</h3>
              <Bar data={compareChartData} options={chartOptions} />
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Chi tiết tăng trưởng</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Tháng</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Thu nhập</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Tăng trưởng</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Chi tiêu</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Tăng trưởng</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Số dư</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.periods.map((period) => (
                      <tr key={period.period} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 font-medium dark:text-white">{period.period}</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(period.income)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`flex items-center justify-end gap-1 ${
                            period.incomeGrowth > 0 ? 'text-green-600 dark:text-green-400' : 
                            period.incomeGrowth < 0 ? 'text-red-600 dark:text-red-400' : 
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {period.incomeGrowth > 0 ? <FiTrendingUp /> : period.incomeGrowth < 0 ? <FiTrendingDown /> : null}
                            {period.incomeGrowth}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(period.expense)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`flex items-center justify-end gap-1 ${
                            period.expenseGrowth > 0 ? 'text-red-600 dark:text-red-400' : 
                            period.expenseGrowth < 0 ? 'text-green-600 dark:text-green-400' : 
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {period.expenseGrowth > 0 ? <FiTrendingUp /> : period.expenseGrowth < 0 ? <FiTrendingDown /> : null}
                            {period.expenseGrowth}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-medium dark:text-white">
                          {formatCurrency(period.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && forecastData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Dự báo tháng tới</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(forecastData.forecast.nextMonth)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Xu hướng: <span className={`font-medium ${
                    forecastData.forecast.trend === 'increasing' ? 'text-red-600 dark:text-red-400' :
                    forecastData.forecast.trend === 'decreasing' ? 'text-green-600 dark:text-green-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {forecastData.forecast.trend === 'increasing' ? '📈 Tăng' :
                     forecastData.forecast.trend === 'decreasing' ? '📉 Giảm' : '➡️ Ổn định'}
                  </span>
                </p>
              </div>
              <div className="card bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Trung bình {forecastData.basedOnMonths} tháng</p>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                  {formatCurrency(forecastData.forecast.average)}
                </p>
              </div>
              <div className="card bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">Độ tin cậy</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 capitalize">
                  {forecastData.forecast.confidence === 'high' ? 'Cao' :
                   forecastData.forecast.confidence === 'medium' ? 'Trung bình' : 'Thấp'}
                </p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Dự báo theo danh mục</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(forecastData.byCategory).map(([category, amount]) => (
                  <div key={category} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{category}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && trendsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card bg-green-50 dark:bg-green-900/20">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Thu nhập TB</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(trendsData.analysis.averageIncome)}
                </p>
              </div>
              <div className="card bg-red-50 dark:bg-red-900/20">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chi tiêu TB</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(trendsData.analysis.averageExpense)}
                </p>
              </div>
              <div className="card bg-blue-50 dark:bg-blue-900/20">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tiết kiệm TB</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(trendsData.analysis.averageSavings)}
                </p>
              </div>
              <div className="card bg-purple-50 dark:bg-purple-900/20">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Xu hướng chi tiêu</p>
                <p className={`text-xl font-bold flex items-center gap-2 ${
                  trendsData.analysis.spendingTrend === 'increasing' ? 'text-red-600 dark:text-red-400' :
                  trendsData.analysis.spendingTrend === 'decreasing' ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {trendsData.analysis.spendingTrend === 'increasing' && <FiTrendingUp />}
                  {trendsData.analysis.spendingTrend === 'decreasing' && <FiTrendingDown />}
                  {trendsData.analysis.recentExpenseChange > 0 ? '+' : ''}
                  {trendsData.analysis.recentExpenseChange}%
                </p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Xu hướng 12 tháng</h3>
              <Line data={trendsChartData} options={chartOptions} />
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Chi tiết từng tháng</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Tháng</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Thu nhập</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Chi tiêu</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Tiết kiệm</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Tỷ lệ tiết kiệm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendsData.trends.map((trend) => (
                      <tr key={trend.month} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 font-medium dark:text-white">{trend.month}</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(trend.income)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(trend.expense)}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                          {formatCurrency(trend.savings)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium dark:text-white">
                          {trend.savingsRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Daily Tab */}
        {activeTab === 'daily' && dailyChartData && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="card">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold dark:text-white">Chọn khoảng thời gian</h3>
                <div className="flex gap-2">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => setDailyPeriod(days)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        dailyPeriod === days
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Thu chi {dailyPeriod} ngày gần đây</h3>
              <div style={{ height: '400px', position: 'relative' }}>
                <Bar 
                  data={dailyChartData} 
                  options={{
                    ...chartOptions, 
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return value.toLocaleString('vi-VN');
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">Chi tiết theo ngày</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Ngày</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Thu nhập</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Chi tiêu</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Số dư</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Giao dịch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDailyStats.slice().reverse().map((day) => (
                      <tr key={day.date} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 font-medium dark:text-white">
                          {new Date(day.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(day.income)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(day.expense)}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          day.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(day.balance)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700 dark:text-gray-300">
                          {day.transactions}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  );
};

export default Statistics;
