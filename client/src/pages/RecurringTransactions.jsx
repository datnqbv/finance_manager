import { useEffect, useState } from 'react';
import { useRecurring } from '../context/RecurringContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiPlay, FiPause, FiCalendar, FiRepeat } from 'react-icons/fi';
import RecurringModal from '../components/RecurringModal';
import { RecurringSkeleton } from '../components/LoadingSkeleton';

const RecurringTransactions = () => {
  const { user } = useAuth();
  const {
    recurringList,
    upcomingList,
    loading,
    fetchAll,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringTransaction
  } = useRecurring();

  const [showModal, setShowModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchAll();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleEdit = (recurring) => {
    setEditingRecurring(recurring);
    setShowModal(true);
  };

  const handleDelete = async (recurring) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${recurring.templateName}"?`)) {
      try {
        await deleteRecurringTransaction(recurring._id);
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const handleExecute = async (recurring) => {
    if (window.confirm(`Thực hiện giao dịch "${recurring.templateName}" ngay bây giờ?`)) {
      try {
        await executeRecurringTransaction(recurring._id);
      } catch (error) {
        // Error handled in context
      }
    }
  };

  const handleToggleActive = async (recurring) => {
    try {
      await updateRecurringTransaction(recurring._id, {
        isActive: !recurring.isActive
      });
    } catch (error) {
      // Error handled in context
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingRecurring(null);
  };

  const handleSave = async (formData) => {
    if (editingRecurring) {
      await updateRecurringTransaction(editingRecurring._id, formData);
    } else {
      await createRecurringTransaction(formData);
    }
  };

  const filteredList = recurringList.filter(item => {
    if (filterActive === 'active') return item.isActive;
    if (filterActive === 'inactive') return !item.isActive;
    return true;
  });

  const frequencyIcons = {
    daily: '📅',
    weekly: '📆',
    monthly: '🗓️',
    yearly: '📋'
  };

  const frequencyLabels = {
    daily: 'Hàng ngày',
    weekly: 'Hàng tuần',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm'
  };

  if (loading && recurringList.length === 0) {
    return <RecurringSkeleton />;
  }

  const activeCount = recurringList.filter(r => r.isActive).length;
  const inactiveCount = recurringList.filter(r => !r.isActive).length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FiRepeat className="text-gray-500 dark:text-gray-400" size={20} />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Giao dịch định kỳ</h1>
            <span className="text-xs bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
              {recurringList.length} mục
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 ml-7">Tự động hóa các giao dịch lặp lại</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <FiPlus size={16} /> Thêm định kỳ
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng số', value: recurringList.length, border: 'border-l-blue-500', icon: '🔄', valueColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Đang hoạt động', value: activeCount, border: 'border-l-emerald-500', icon: '▶️', valueColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Sắp tới (30 ngày)', value: upcomingList.length, border: 'border-l-amber-500', icon: '📅', valueColor: 'text-amber-600 dark:text-amber-400' },
        ].map((s, i) => (
          <div key={i} className={`bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${s.border} rounded-2xl px-4 py-3`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.valueColor}`}>{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Upcoming Transactions ── */}
      {upcomingList.length > 0 && (
        <div className="bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Giao dịch sắp tới</h2>
            <span className="text-xs bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              {upcomingList.length}
            </span>
          </div>
          <div className="space-y-2">
            {upcomingList.slice(0, 5).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-[#2a2a2a]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                    item.type === 'income'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10'
                      : 'bg-red-50 dark:bg-red-500/10'
                  }`}>
                    {frequencyIcons[item.frequency]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                      {item.templateName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {item.category} · {formatDate(item.nextExecution)}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className={`text-sm font-bold ${
                    item.type === 'income'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{frequencyLabels[item.frequency]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5 w-fit">
        {[
          { label: `Tất cả (${recurringList.length})`, value: 'all' },
          { label: `Hoạt động (${activeCount})`, value: 'active' },
          { label: `Tạm dừng (${inactiveCount})`, value: 'inactive' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterActive(f.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filterActive === f.value
                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Recurring Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredList.length > 0 ? (
          <>
            {filteredList.map((recurring) => (
              <div
                key={recurring._id}
                className={`group bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${
                  recurring.type === 'income' ? 'border-l-emerald-500' : 'border-l-red-500'
                } rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${
                  !recurring.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      recurring.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10'
                        : 'bg-red-50 dark:bg-red-500/10'
                    }`}>
                      {frequencyIcons[recurring.frequency]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {recurring.templateName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                          {frequencyLabels[recurring.frequency]}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          recurring.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-400 dark:text-gray-500'
                        }`}>
                          {recurring.isActive ? 'Đang chạy' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover-reveal action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleToggleActive(recurring)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                        recurring.isActive
                          ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                      }`}
                      title={recurring.isActive ? 'Tạm dừng' : 'Kích hoạt'}
                    >
                      {recurring.isActive ? <FiPause size={12} /> : <FiPlay size={12} />}
                    </button>
                    <button
                      onClick={() => handleEdit(recurring)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(recurring)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                      title="Xóa"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Số tiền</p>
                    <p className={`text-sm font-bold leading-tight ${
                      recurring.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {recurring.type === 'income' ? '+' : '-'}{formatCurrency(recurring.amount)}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Lần tiếp theo</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight">
                      {recurring.nextExecution ? formatDate(recurring.nextExecution) : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Danh mục</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight truncate">
                      {recurring.category || '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Đã thực hiện</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 leading-tight">
                      {recurring.executedCount} lần
                    </p>
                  </div>
                </div>

                {recurring.note && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-3 line-clamp-1">
                    "{recurring.note}"
                  </p>
                )}

                {/* Execute button */}
                <button
                  onClick={() => handleExecute(recurring)}
                  disabled={!recurring.isActive}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors border border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-gray-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/30 dark:hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-gray-200 disabled:hover:text-gray-400"
                >
                  <FiPlay size={12} /> Thực hiện ngay
                </button>
              </div>
            ))}

            {/* Add new card */}
            <button
              onClick={() => setShowModal(true)}
              className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-500/50 dark:hover:text-emerald-500 transition-colors group min-h-[180px]"
            >
              <FiPlus size={22} className="transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">Thêm định kỳ</span>
            </button>
          </>
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔄
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Chưa có giao dịch định kỳ nào</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Tạo giao dịch định kỳ để tự động hóa thu chi hàng tháng</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <FiPlus size={15} /> Tạo giao dịch đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <RecurringModal
          recurring={editingRecurring}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default RecurringTransactions;
