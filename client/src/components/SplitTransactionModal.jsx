import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiScissors } from 'react-icons/fi';
import CurrencyInput from './CurrencyInput';
import { useCategories } from '../context/CategoryContext';
import { useTransactions } from '../context/TransactionContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const SplitTransactionModal = ({ transaction, onClose, isOpen }) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const { categories, fetchCategories } = useCategories();
  const { splitTransaction } = useTransactions();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Danh sách các phần tách (ít nhất 2)
  const [splits, setSplits] = useState([
    { category: '', amount: '', note: '' },
    { category: '', amount: '', note: '' },
  ]);

  const totalAmount = Number(transaction?.amount) || 0;

  // Lọc danh mục theo loại giao dịch
  const availableCategories = categories.filter(
    (cat) => cat.type === transaction?.type || cat.type === 'both'
  );

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  // Tổng đã phân bổ
  const allocated = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
  const remaining = totalAmount - allocated;

  // Cập nhật 1 phần tách
  const updateSplit = (index, field, value) => {
    setSplits((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  // Thêm phần tách mới
  const addSplit = () => {
    setSplits((prev) => [...prev, { category: '', amount: '', note: '' }]);
  };

  // Xóa 1 phần tách (tối thiểu 2)
  const removeSplit = (index) => {
    if (splits.length <= 2) return;
    setSplits((prev) => prev.filter((_, i) => i !== index));
  };

  // Tự động điền số tiền còn lại vào phần tách cuối
  const autoFillLast = () => {
    const allButLast = splits.slice(0, -1).reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const lastAmount = totalAmount - allButLast;
    if (lastAmount > 0) {
      updateSplit(splits.length - 1, 'amount', lastAmount.toString());
    }
  };

  // Format tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate: tất cả phần tách phải có danh mục và số tiền
    for (let i = 0; i < splits.length; i++) {
      if (!splits[i].category) {
        return;
      }
      if (!splits[i].amount || parseFloat(splits[i].amount) <= 0) {
        return;
      }
    }

    // Validate: tổng phải khớp
    if (Math.abs(remaining) > 0.01) {
      return;
    }

    setLoading(true);
    const result = await splitTransaction(transaction.id, splits.map((s) => ({
      category: s.category,
      amount: parseFloat(s.amount),
      note: s.note,
    })));
    setLoading(false);

    if (result.success) {
      onClose();
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-[#FFFCF5] shadow-2xl dark:bg-[#191d25] animate-modal-scale">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-[#FFFCF5] px-6 py-4 dark:border-gray-800 dark:bg-[#191d25]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiScissors className="text-emerald-600" />
            {isEnglish ? 'Split Transaction' : 'Tách giao dịch'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Thông tin giao dịch gốc */}
          <div className="rounded-xl bg-gray-50 dark:bg-[#232936] p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {isEnglish ? 'Original Transaction' : 'Giao dịch gốc'}
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{transaction.category}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.note || '-'}</p>
              </div>
              <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>

          {/* Thanh tiến trình phân bổ */}
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-600 dark:text-gray-400">
                {isEnglish ? 'Allocated' : 'Đã phân bổ'}: <span className="font-semibold">{formatCurrency(allocated)}</span>
              </span>
              <span className={`font-semibold ${Math.abs(remaining) < 0.01 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isEnglish ? 'Remaining' : 'Còn lại'}: {formatCurrency(remaining)}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${Math.abs(remaining) < 0.01 ? 'bg-emerald-500' : allocated > totalAmount ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min((allocated / totalAmount) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Danh sách các phần tách */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              {isEnglish ? 'Split Items' : 'Các phần tách'} ({splits.length})
            </p>

            {splits.map((split, index) => (
              <div key={index} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-[#FFFCF5] dark:bg-[#1a1f28]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {isEnglish ? `Part ${index + 1}` : `Phần ${index + 1}`}
                  </span>
                  {splits.length > 2 && (
                    <button type="button" onClick={() => removeSplit(index)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Danh mục */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {isEnglish ? 'Category' : 'Danh mục'}
                    </label>
                    <select
                      value={split.category}
                      onChange={(e) => updateSplit(index, 'category', e.target.value)}
                      required
                      className="input w-full text-sm"
                    >
                      <option value="">{isEnglish ? 'Select...' : 'Chọn...'}</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Số tiền */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {isEnglish ? 'Amount' : 'Số tiền'}
                    </label>
                    <CurrencyInput
                      value={split.amount}
                      onChange={(val) => updateSplit(index, 'amount', val)}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <input
                    type="text"
                    value={split.note}
                    onChange={(e) => updateSplit(index, 'note', e.target.value)}
                    placeholder={isEnglish ? 'Note (optional)' : 'Ghi chú (tùy chọn)'}
                    className="input w-full text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Nút thêm phần tách + tự động điền */}
          <div className="flex gap-2">
            <button type="button" onClick={addSplit} className="btn btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm">
              <FiPlus size={14} /> {isEnglish ? 'Add Part' : 'Thêm phần'}
            </button>
            {remaining > 0.01 && (
              <button type="button" onClick={autoFillLast} className="btn btn-secondary flex-1 text-sm text-amber-600 dark:text-amber-400">
                {isEnglish ? 'Auto-fill last' : 'Tự điền phần cuối'}
              </button>
            )}
          </div>

          {/* Cảnh báo nếu tổng chưa khớp */}
          {Math.abs(remaining) > 0.01 && allocated > 0 && (
            <div className={`text-xs p-3 rounded-lg ${remaining < 0 ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400'}`}>
              {remaining > 0
                ? (isEnglish ? `You need to allocate ${formatCurrency(remaining)} more` : `Cần phân bổ thêm ${formatCurrency(remaining)}`)
                : (isEnglish ? `You exceeded by ${formatCurrency(Math.abs(remaining))}` : `Đã vượt ${formatCurrency(Math.abs(remaining))}`)}
            </div>
          )}

          {/* Nút submit */}
          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              {isEnglish ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={loading || Math.abs(remaining) > 0.01}
              className="btn btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <FiScissors size={14} />
              {loading
                ? (isEnglish ? 'Processing...' : 'Đang xử lý...')
                : (isEnglish ? 'Split' : 'Tách giao dịch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SplitTransactionModal;
