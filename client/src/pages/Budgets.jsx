import { useEffect, useState } from 'react';
import { useBudgets } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import BudgetModal from '../components/BudgetModal';

const Budgets = () => {
  const { user } = useAuth();
  const {
    budgets,
    budgetStatus,
    alerts,
    loading,
    fetchBudgets,
    fetchBudgetStatus,
    fetchAlerts,
    createBudget,
    updateBudget,
    deleteBudget
  } = useBudgets();

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    fetchBudgets();
    fetchBudgetStatus();
    fetchAlerts();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleDelete = async (budget) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ngân sách "${budget.categoryName || 'Tổng'}"?`)) {
      try {
        await deleteBudget(budget._id);
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const handleSave = async (formData) => {
    if (editingBudget) {
      await updateBudget(editingBudget._id, formData);
    } else {
      await createBudget(formData);
    }
  };

  // Progress Ring Component
  const ProgressRing = ({ percentage, size = 120, strokeWidth = 10, color }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    const getColor = () => {
      if (color) return color;
      if (percentage < 80) return '#10B981'; // green
      if (percentage < 100) return '#F59E0B'; // orange
      return '#EF4444'; // red
    };

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
    );
  };

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="text-4xl">💰</span>
            Ngân sách
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Theo dõi và quản lý ngân sách của bạn
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-all hover:scale-105 shadow-lg shadow-primary-500/30"
        >
          <FiPlus />
          <span>Thêm Ngân Sách</span>
        </button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`card flex items-center gap-3 ${
                alert.isOverBudget
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
              }`}
            >
              <FiAlertCircle
                size={24}
                className={alert.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {alert.message}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatCurrency(alert.currentSpending)} / {formatCurrency(alert.amount)}
                </p>
              </div>
              <div className={`text-2xl font-bold ${
                alert.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {alert.percentage}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {budgetStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tổng ngân sách</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(budgetStatus.summary.totalBudget)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                💰
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Đã chi tiêu</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(budgetStatus.summary.totalSpending)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center transition-transform group-hover:scale-110">
                <FiTrendingUp className="text-2xl text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Còn lại</p>
                <p className={`text-2xl font-bold ${
                  budgetStatus.summary.totalRemaining >= 0
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {formatCurrency(budgetStatus.summary.totalRemaining)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                budgetStatus.summary.totalRemaining >= 0
                  ? 'bg-gradient-to-br from-green-400 to-emerald-600'
                  : 'bg-gradient-to-br from-red-400 to-red-600'
              }`}>
                {budgetStatus.summary.totalRemaining >= 0 ? (
                  <FiCheckCircle className="text-2xl text-white" />
                ) : (
                  <FiAlertCircle className="text-2xl text-white" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Vượt ngân sách</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {budgetStatus.summary.overBudgetCount}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                ⚠️
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length > 0 ? (
          budgets.map((budget) => (
            <div
              key={budget._id}
              className="card hover:shadow-lg dark:hover:shadow-2xl transition-all"
            >
              {/* Category Name */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {budget.categoryName || 'Tổng chi tiêu'}
                </h3>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {budget.period === 'monthly' ? 'Tháng' : budget.period === 'weekly' ? 'Tuần' : 'Năm'}
                </span>
              </div>

              {/* Progress Ring */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative">
                  <ProgressRing percentage={budget.percentage} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold ${
                      budget.percentage < 80
                        ? 'text-green-600 dark:text-green-400'
                        : budget.percentage < 100
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {budget.percentage}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">đã dùng</span>
                  </div>
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Đã chi:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(budget.currentSpending)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Ngân sách:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(budget.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Còn lại:</span>
                  <span className={`font-semibold ${
                    budget.amount - budget.currentSpending >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(budget.amount - budget.currentSpending)}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              {budget.isOverBudget && (
                <div className="mb-4 px-3 py-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                    ⚠️ Vượt ngân sách {budget.percentage - 100}%
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                <button
                  onClick={() => handleEdit(budget)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <FiEdit2 size={14} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(budget)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                >
                  <FiTrash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <span className="text-6xl">💰</span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có ngân sách nào</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              Tạo ngân sách đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Budget Modal */}
      {showModal && (
        <BudgetModal
          budget={editingBudget}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Budgets;
