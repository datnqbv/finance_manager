import { useEffect, useState } from 'react';
import { statsService } from '../services/stats.service';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Statistics = () => {
  const { user } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStats();
  }, [selectedMonth, selectedYear]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [monthlyData, categoryData] = await Promise.all([
        statsService.getMonthlyStats(selectedYear, selectedMonth),
        statsService.getCategoryStats(),
      ]);
      setMonthlyStats(monthlyData.data);
      setCategoryStats(categoryData.data);
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
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Thống kê</h1>
        <p className="text-gray-600 mt-1">Phân tích chi tiết thu chi của bạn</p>
      </div>

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
        <div className="card bg-green-50 border-green-200">
          <p className="text-gray-700 text-sm mb-1">Thu nhập</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(monthlyStats?.summary?.income || 0)}
          </p>
        </div>
        <div className="card bg-red-50 border-red-200">
          <p className="text-gray-700 text-sm mb-1">Chi tiêu</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(monthlyStats?.summary?.expense || 0)}
          </p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <p className="text-gray-700 text-sm mb-1">Số dư</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(monthlyStats?.summary?.balance || 0)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Thu Chi Tháng {selectedMonth}/{selectedYear}</h3>
          <div className="flex justify-center">
            <div className="w-64 h-64">
              <Pie data={pieChartData} options={chartOptions} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Theo Danh Mục</h3>
          {categoryStats.length > 0 ? (
            <Bar data={barChartData} options={chartOptions} />
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu</p>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Chi tiết theo danh mục</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Danh mục</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Thu nhập</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Chi tiêu</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">Số giao dịch</th>
              </tr>
            </thead>
            <tbody>
              {categoryStats.map((cat) => (
                <tr key={cat.category} className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700 font-medium">{cat.category}</td>
                  <td className="py-3 px-4 text-right text-green-600">
                    {formatCurrency(cat.income)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-600">
                    {formatCurrency(cat.expense)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{cat.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
