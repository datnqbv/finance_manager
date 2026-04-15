import { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const TransactionModal = ({ transaction, onClose, isOpen }) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const { categories, fetchCategories } = useCategories();
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        note: transaction.note || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
      });
    } else {
      // Reset form when creating new transaction
      setFormData({
        type: 'expense',
        category: '',
        amount: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [transaction, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset category when type changes
    if (name === 'type') {
      setFormData((prev) => ({ ...prev, type: value, category: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get categories for current type
  const availableCategories = categories.filter(cat => 
    cat.type === formData.type || cat.type === 'both'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    let result;
    if (transaction) {
      result = await updateTransaction(transaction._id, data);
    } else {
      result = await createTransaction(data);
    }

    setLoading(false);

    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#111111]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-[#2a2a2a] dark:bg-[#111111]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {transaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-[#222222]"
          >
            <FiX size={22} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-[#1f242f]">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  formData.type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2a3140]'
                }`}
              >
                Thu nhập
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  formData.type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2a3140]'
                }`}
              >
                Chi tiêu
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Danh mục
            </label>
            {availableCategories.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                      Chưa có danh mục nào cho loại giao dịch này
                    </p>
                    <Link
                      to="/categories"
                      onClick={onClose}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                    >
                      Tạo danh mục mới →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="input w-full"
              >
                <option value="">Chọn danh mục</option>
                {availableCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số tiền
            </label>
            <CurrencyInput
              value={formData.amount}
              onChange={v => setFormData(prev => ({ ...prev, amount: v }))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ngày
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
              className="input w-full resize-none"
              placeholder="Thêm ghi chú (tùy chọn)"
            />
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Đang xử lý...' : transaction ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
