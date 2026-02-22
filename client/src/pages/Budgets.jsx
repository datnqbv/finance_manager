import { useEffect, useState } from 'react';
import { useBudgets } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle, FiTrendingDown, FiShield } from 'react-icons/fi';
import BudgetModal from '../components/BudgetModal';

const Budgets = () => {
  const { user } = useAuth();
  const { budgets, budgetStatus, alerts, loading, fetchBudgets, fetchBudgetStatus, fetchAlerts, createBudget, updateBudget, deleteBudget } = useBudgets();

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);

  useEffect(() => {
    fetchBudgets();
    fetchBudgetStatus();
    fetchAlerts();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(amount);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleDelete = async (budget) => {
    if (window.confirm(`Xóa ngân sách "${budget.categoryName || 'Tổng'}"?`)) {
      try { await deleteBudget(budget._id); } catch {}
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  const handleSave = async (formData) => {
    if (editingBudget) await updateBudget(editingBudget._id, formData);
    else await createBudget(formData);
  };

  // Determine status level from percentage
  const getStatus = (pct) => {
    if (pct >= 100) return { level: 'over',    bar: 'bg-red-500',   text: 'text-red-600 dark:text-red-400',   border: 'border-l-red-500',   bg: 'bg-red-50 dark:bg-red-500/10',   label: 'Vượt ngân sách' };
    if (pct >= 80)  return { level: 'warning',  bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: 'Sắp vượt' };
    return              { level: 'safe',    bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Ổn' };
  };

  const periodLabel = (p) => p === 'monthly' ? 'Tháng' : p === 'weekly' ? 'Tuần' : 'Năm';

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const overCount = budgetStatus?.summary?.overBudgetCount || 0;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FiShield className="text-gray-500 dark:text-gray-400" size={20} />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ngân sách</h1>
            <span className="text-xs bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
              {budgets.length} ngân sách
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 ml-7">Kiểm soát chi tiêu theo giới hạn đã đặt</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <FiPlus size={16} /> Thêm ngân sách
        </button>
      </div>

      {/* ── Alerts ── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              alert.isOverBudget
                ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
                : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
            }`}>
              <FiAlertCircle size={15} className="flex-shrink-0" />
              <span className="flex-1">{alert.message}</span>
              <span className="font-bold text-base">{alert.percentage}%</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Summary stats ── */}
      {budgetStatus && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Tổng ngân sách',
              value: formatCurrency(budgetStatus.summary.totalBudget),
              border: 'border-l-blue-500',
              icon: '💰',
              valueColor: 'text-blue-600 dark:text-blue-400',
            },
            {
              label: 'Đã chi tiêu',
              value: formatCurrency(budgetStatus.summary.totalSpending),
              border: 'border-l-red-500',
              icon: '📉',
              valueColor: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Còn lại',
              value: formatCurrency(budgetStatus.summary.totalRemaining),
              border: budgetStatus.summary.totalRemaining >= 0 ? 'border-l-emerald-500' : 'border-l-red-500',
              icon: budgetStatus.summary.totalRemaining >= 0 ? '✅' : '⚠️',
              valueColor: budgetStatus.summary.totalRemaining >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Vượt ngân sách',
              value: overCount,
              isCount: true,
              unit: 'mục',
              border: overCount > 0 ? 'border-l-red-500' : 'border-l-gray-300',
              icon: '⚠️',
              valueColor: overCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
            },
          ].map((s, i) => (
            <div key={i} className={`bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${s.border} rounded-2xl px-4 py-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-lg font-black leading-tight ${s.valueColor}`}>{s.value}</p>
                  {s.unit && <p className="text-xs text-gray-400 mt-0.5">{s.unit}</p>}
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Budget Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length > 0 ? (
          <>
            {budgets.map((budget) => {
              const pct = Math.min(budget.percentage, 100);
              const status = getStatus(budget.percentage);
              const remaining = budget.amount - budget.currentSpending;

              return (
                <div
                  key={budget._id}
                  className={`group bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${status.border} rounded-2xl p-5 hover:shadow-md transition-all duration-200`}
                >
                  {/* Top: name + period + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {budget.categoryName || 'Tổng chi tiêu'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                          {periodLabel(budget.period)}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons (show on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(budget)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                        title="Xóa"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar + percentage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">Tiến độ chi tiêu</span>
                      <span className={`text-sm font-black ${status.text}`}>
                        {budget.percentage}%
                      </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${status.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {budget.isOverBudget && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1.5">
                        Đã vượt {formatCurrency(Math.abs(remaining))}
                      </p>
                    )}
                  </div>

                  {/* 3 stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Đã chi</p>
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 leading-tight">
                        {formatCurrency(budget.currentSpending)}
                      </p>
                    </div>
                    <div className="text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Ngân sách</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">
                        {formatCurrency(budget.amount)}
                      </p>
                    </div>
                    <div className="text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-1">
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Còn lại</p>
                      <p className={`text-xs font-bold leading-tight ${
                        remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(remaining)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add new budget card */}
            <button
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-500/50 dark:hover:text-emerald-500 transition-colors group min-h-[180px]"
            >
              <FiPlus size={22} className="transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">Thêm ngân sách</span>
            </button>
          </>
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              💰
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Chưa có ngân sách nào</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Tạo ngân sách để kiểm soát chi tiêu theo từng danh mục</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <FiPlus size={15} /> Tạo ngân sách đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
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
