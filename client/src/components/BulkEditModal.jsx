import { useState } from 'react';
import { FiX, FiCheck, FiInfo } from 'react-icons/fi';
import { useWallets } from '../context/WalletContext';
import { useLanguage } from '../context/LanguageContext';

const BulkEditModal = ({ isOpen, onClose, selectedIds, onBulkUpdate }) => {
  const { wallets } = useWallets();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const [formData, setFormData] = useState({
    type: '',
    category: '',
    walletId: '',
    date: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onBulkUpdate(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-modal-fade">
      <div className="bg-[#FFFCF5] dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 animate-modal-scale flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#084d3c]/5 to-transparent dark:from-emerald-500/10">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEnglish ? 'Bulk Edit Transactions' : 'Sửa hàng loạt giao dịch'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isEnglish
                ? `Updating ${selectedIds.length} selected transactions`
                : `Đang cập nhật ${selectedIds.length} giao dịch đã chọn`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/40 p-4 px-6 flex items-start gap-3 text-blue-800 dark:text-blue-300 text-sm">
          <FiInfo size={18} className="mt-0.5 flex-shrink-0" />
          <span>
            {isEnglish
              ? 'Only filled fields will be updated. Leave fields empty to keep existing values for each transaction.'
              : 'Chỉ các trường được nhập mới thay đổi. Để trống nếu muốn giữ nguyên giá trị cũ của từng giao dịch.'}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEnglish ? 'Transaction Type' : 'Loại giao dịch'}
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-[#FFFCF5] dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#084d3c] dark:focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">{isEnglish ? '-- No change --' : '-- Giữ nguyên --'}</option>
              <option value="expense">{isEnglish ? 'Expense' : 'Chi tiêu'}</option>
              <option value="income">{isEnglish ? 'Income' : 'Thu nhập'}</option>
              <option value="transfer">{isEnglish ? 'Transfer' : 'Chuyển khoản'}</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEnglish ? 'Category' : 'Danh mục'}
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder={isEnglish ? 'Enter new category (leave blank for no change)' : 'Nhập danh mục mới (để trống nếu giữ nguyên)'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-[#FFFCF5] dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#084d3c] dark:focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEnglish ? 'Wallet' : 'Ví'}
            </label>
            <select
              name="walletId"
              value={formData.walletId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-[#FFFCF5] dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#084d3c] dark:focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">{isEnglish ? '-- No change --' : '-- Giữ nguyên --'}</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEnglish ? 'Date' : 'Ngày giao dịch'}
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-[#FFFCF5] dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#084d3c] dark:focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEnglish ? 'Note' : 'Ghi chú'}
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
              placeholder={isEnglish ? 'Enter new note (leave blank for no change)' : 'Nhập ghi chú mới (để trống nếu giữ nguyên)'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-[#FFFCF5] dark:focus:bg-gray-700 focus:ring-2 focus:ring-[#084d3c] dark:focus:ring-emerald-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              {isEnglish ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#084d3c] dark:bg-emerald-600 text-white hover:bg-[#084d3c]/90 dark:hover:bg-emerald-500 font-medium flex items-center gap-2 shadow-lg shadow-[#084d3c]/20 dark:shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <FiCheck size={18} />
              {loading ? (isEnglish ? 'Updating...' : 'Đang cập nhật...') : (isEnglish ? 'Apply Changes' : 'Áp dụng')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal;
