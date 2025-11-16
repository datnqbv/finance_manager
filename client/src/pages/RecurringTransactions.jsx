import { useEffect, useState } from 'react';
import { useRecurring } from '../context/RecurringContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiPlay, FiPause, FiCalendar, FiRepeat } from 'react-icons/fi';
import RecurringModal from '../components/RecurringModal';

const RecurringTransactions = () => {
  const { user } = useAuth();
  const {
    recurringList,
    upcomingList,
    loading,
    fetchRecurringTransactions,
    fetchUpcoming,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringTransaction
  } = useRecurring();

  const [showModal, setShowModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive

  useEffect(() => {
    fetchRecurringTransactions();
    fetchUpcoming();
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
            <FiRepeat className="text-primary-500" />
            Giao dịch định kỳ
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tự động hóa các giao dịch lặp lại
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-all hover:scale-105 shadow-lg shadow-primary-500/30"
        >
          <FiPlus />
          <span>Thêm Định Kỳ</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tổng số</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {recurringList.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiRepeat className="text-2xl text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Đang hoạt động</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {recurringList.filter(r => r.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiPlay className="text-2xl text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Sắp tới (30 ngày)</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {upcomingList.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center transition-transform group-hover:scale-110">
              <FiCalendar className="text-2xl text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Transactions */}
      {upcomingList.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiCalendar /> Giao dịch sắp tới
          </h2>
          <div className="space-y-2">
            {upcomingList.slice(0, 5).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                  }`}>
                    {frequencyIcons[item.frequency]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {item.templateName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.category} • {formatDate(item.nextExecution)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    item.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {frequencyLabels[item.frequency]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 bg-white dark:bg-[#111111] rounded-xl p-2 border border-gray-200 dark:border-[#2a2a2a]">
        <button
          onClick={() => setFilterActive('all')}
          className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
            filterActive === 'all'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
          }`}
        >
          Tất cả ({recurringList.length})
        </button>
        <button
          onClick={() => setFilterActive('active')}
          className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
            filterActive === 'active'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
          }`}
        >
          Đang hoạt động ({recurringList.filter(r => r.isActive).length})
        </button>
        <button
          onClick={() => setFilterActive('inactive')}
          className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
            filterActive === 'inactive'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
          }`}
        >
          Tạm dừng ({recurringList.filter(r => !r.isActive).length})
        </button>
      </div>

      {/* Recurring List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredList.length > 0 ? (
          filteredList.map((recurring) => (
            <div
              key={recurring._id}
              className={`card hover:shadow-lg dark:hover:shadow-2xl transition-all ${
                !recurring.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    recurring.type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {frequencyIcons[recurring.frequency]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {recurring.templateName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {recurring.category}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(recurring)}
                  className={`p-2 rounded-lg transition ${
                    recurring.isActive
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {recurring.isActive ? <FiPlay size={18} /> : <FiPause size={18} />}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Số tiền:</span>
                  <span className={`font-bold ${
                    recurring.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {recurring.type === 'income' ? '+' : '-'}{formatCurrency(recurring.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tần suất:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {frequencyLabels[recurring.frequency]}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Lần tiếp theo:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {recurring.nextExecution ? formatDate(recurring.nextExecution) : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Đã thực hiện:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {recurring.executedCount} lần
                  </span>
                </div>
              </div>

              {recurring.note && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 italic">
                  "{recurring.note}"
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                <button
                  onClick={() => handleExecute(recurring)}
                  disabled={!recurring.isActive}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlay size={14} /> Thực hiện
                </button>
                <button
                  onClick={() => handleEdit(recurring)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <FiEdit2 size={14} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(recurring)}
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
              <FiRepeat size={48} className="text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có giao dịch định kỳ nào</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              Tạo giao dịch định kỳ đầu tiên
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
