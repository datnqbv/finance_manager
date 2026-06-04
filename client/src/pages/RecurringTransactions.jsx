import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { recurringService } from '../services/recurring.service';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiPlay, FiPause, FiCalendar, FiClock } from 'react-icons/fi';
import RecurringModal from '../components/RecurringModal';
import Pagination from '../components/Pagination';

const RecurringTransactions = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const loadRules = async (page = currentPage, limit = itemsPerPage) => {
    setLoading(true);
    try {
      const response = await recurringService.getRecurring(page, limit);
      if (response.success) {
        setItems(response.data || []);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.total || 0);
        setCurrentPage(response.page || 1);
      }
    } catch (error) {
      toast.error(isEnglish ? 'Failed to load schedules' : 'Không thể tải danh sách giao dịch định kỳ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules(currentPage, itemsPerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage]);

  const handleSave = async (data) => {
    if (editingRule) {
      const response = await recurringService.updateRecurring(editingRule.id, data);
      if (response.success) {
        toast.success(isEnglish ? 'Schedule updated' : 'Đã cập nhật lịch thành công');
        loadRules(currentPage, itemsPerPage);
      }
    } else {
      const response = await recurringService.createRecurring(data);
      if (response.success) {
        toast.success(isEnglish ? 'Schedule created' : 'Đã thiết lập lịch thành công');
        loadRules(1, itemsPerPage);
      }
    }
  };

  const handleToggleActive = async (rule) => {
    try {
      const response = await recurringService.updateRecurring(rule.id, {
        isActive: !rule.isActive
      });
      if (response.success) {
        toast.success(
          rule.isActive
            ? (isEnglish ? 'Schedule paused' : 'Đã tạm dừng lịch thành công')
            : (isEnglish ? 'Schedule resumed' : 'Đã kích hoạt lại lịch thành công')
        );
        loadRules(currentPage, itemsPerPage);
      }
    } catch (error) {
      toast.error(isEnglish ? 'Action failed' : 'Thao tác thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isEnglish ? 'Delete this schedule?' : 'Xóa thiết lập giao dịch định kỳ này?')) return;
    try {
      const response = await recurringService.deleteRecurring(id);
      if (response.success) {
        toast.success(isEnglish ? 'Schedule deleted' : 'Xóa lịch thành công');
        const newPage = items.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        loadRules(newPage, itemsPerPage);
      }
    } catch (error) {
      toast.error(isEnglish ? 'Delete failed' : 'Xóa thất bại');
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getFreqText = (freq) => {
    return {
      daily: isEnglish ? 'Daily' : 'Hàng ngày',
      weekly: isEnglish ? 'Weekly' : 'Hàng tuần',
      monthly: isEnglish ? 'Monthly' : 'Hàng tháng',
      yearly: isEnglish ? 'Yearly' : 'Hàng năm'
    }[freq] || freq;
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="rounded-3xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Automation' : 'Tự động hóa chi tiêu'}</p>
          <h1 className="mt-2 text-4xl font-black flex items-center gap-3">
            <FiRefreshCw className="animate-spin-slow" />
            {isEnglish ? 'Recurring Transactions' : 'Giao dịch định kỳ'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
            {isEnglish
              ? 'Schedule automated income, expense, or transfers. Our system will record them on time in the background.'
              : 'Thiết lập tự động ghi nhận thu nhập, chi tiêu hoặc chuyển khoản định kỳ. Hệ thống sẽ tự động tạo giao dịch đúng hẹn.'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#004b38] shadow-sm hover:bg-[#e9f4f1] transition shrink-0"
        >
          <FiPlus size={16} />
          {isEnglish ? 'New Schedule' : 'Tạo lịch mới'}
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl bg-white shadow-sm dark:bg-[#171a21] overflow-hidden border border-gray-150 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs font-semibold text-[#5f6e82] dark:bg-[#1b202a] dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">STT</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Type' : 'Loại'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Category' : 'Danh mục / Ghi chú'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Wallet' : 'Ví liên quan'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Interval' : 'Tần suất'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Schedule info' : 'Lịch thực hiện'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                <th className="px-5 py-3.5 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f5] dark:divide-gray-800 dark:text-[#d1d5db]">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : items.length > 0 ? (
                items.map((item, index) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2230]/30 transition-colors">
                      <td className="px-5 py-4 text-center text-gray-400 font-medium">{index + 1}</td>
                      <td className="px-5 py-4">
                        {item.type === 'income' && (
                          <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/10">
                            {isEnglish ? 'Income' : 'Thu nhập'}
                          </span>
                        )}
                        {item.type === 'expense' && (
                          <span className="inline-flex rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/10">
                            {isEnglish ? 'Expense' : 'Chi tiêu'}
                          </span>
                        )}
                        {item.type === 'transfer' && (
                          <span className="inline-flex rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-500/10">
                            {isEnglish ? 'Transfer' : 'Chuyển khoản'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-950 dark:text-white">{item.category}</div>
                        {item.note && <div className="text-xs text-gray-400 mt-0.5 italic">{item.note}</div>}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                        {item.type === 'transfer' ? (
                          <div className="text-xs space-y-0.5 font-medium">
                            <div>{item.wallet?.icon} {item.wallet?.name}</div>
                            <div className="text-[10px] text-gray-400">➔ {item.toWallet?.icon} {item.toWallet?.name}</div>
                          </div>
                        ) : (
                          <span className="text-xs font-medium">{item.wallet?.icon} {item.wallet?.name}</span>
                        )}
                      </td>
                      <td className={`px-5 py-4 font-bold ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-purple-600 dark:text-purple-400">
                        {getFreqText(item.frequency)}
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar />
                          <span>{formatDate(item.startDate)} {item.endDate ? `➔ ${formatDate(item.endDate)}` : ''}</span>
                        </div>
                        {item.isActive && (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <FiClock />
                            <span>{isEnglish ? 'Next run' : 'Kỳ sau'}: {formatDate(item.nextExecutionDate)}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {item.isActive ? (
                          <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {isEnglish ? 'Active' : 'Đang chạy'}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                            {isEnglish ? 'Paused' : 'Tạm dừng'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(item)}
                            className={`p-1.5 rounded-lg border transition ${
                              item.isActive
                                ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/40 dark:hover:bg-amber-950/20'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/40 dark:hover:bg-emerald-950/20'
                            }`}
                            title={item.isActive ? (isEnglish ? 'Pause' : 'Tạm dừng') : (isEnglish ? 'Resume' : 'Kích hoạt lại')}
                          >
                            {item.isActive ? <FiPause size={14} /> : <FiPlay size={14} />}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-900/40 dark:hover:bg-blue-950/20 transition"
                            title={isEnglish ? 'Edit' : 'Sửa'}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-500/10 transition"
                            title={isEnglish ? 'Delete' : 'Xóa'}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-[#9ea3ae] dark:text-gray-500">
                    <FiRefreshCw size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-sm font-semibold">{isEnglish ? 'No recurring transactions configured yet.' : 'Chưa có thiết lập giao dịch định kỳ nào.'}</p>
                    <button
                      onClick={openCreateModal}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      {isEnglish ? 'Create one now →' : 'Tạo thiết lập ngay →'}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {items.length > 0 && (
          <div className="px-5 pb-5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
              totalItems={totalItems}
            />
          </div>
        )}
      </div>

      <RecurringModal
        isOpen={showModal}
        rule={editingRule}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />
    </div>
  );
};

export default RecurringTransactions;
