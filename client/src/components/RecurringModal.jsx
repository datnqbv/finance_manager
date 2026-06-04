import { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import { useCategories } from '../context/CategoryContext';
import { useWallets } from '../context/WalletContext';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const RecurringModal = ({ rule, onClose, isOpen, onSave }) => {
  const { categories, fetchCategories } = useCategories();
  const { wallets, fetchWallets } = useWallets();
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    walletId: '',
    toWalletId: '',
  });
  const [loading, setLoading] = useState(false);

  // Get categories for current type
  const availableCategories = categories.filter(cat => 
    cat.type === formData.type || cat.type === 'both'
  );

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchWallets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (rule) {
      setFormData({
        type: rule.type,
        category: rule.category,
        amount: rule.amount,
        note: rule.note || '',
        frequency: rule.frequency,
        startDate: rule.startDate,
        endDate: rule.endDate || '',
        walletId: rule.walletId || '',
        toWalletId: rule.toWalletId || '',
      });
    } else {
      const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
      setFormData({
        type: 'expense',
        category: '',
        amount: '',
        note: '',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        walletId: defaultWallet ? defaultWallet.id : '',
        toWalletId: '',
      });
    }
  }, [rule, isOpen, wallets]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset category when type changes
    if (name === 'type') {
      setFormData((prev) => ({ ...prev, type: value, category: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (!data.endDate) {
      delete data.endDate;
    }

    try {
      await onSave(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thiết lập.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white shadow-2xl dark:bg-[#191d25] transition-all transform scale-100">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-[#191d25]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {rule ? 'Cấu hình giao dịch định kỳ' : 'Thiết lập giao dịch định kỳ'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-50 p-1 dark:bg-[#232936] border border-gray-150 dark:border-gray-800">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-150/50 dark:text-gray-400 dark:hover:bg-[#191d25]/50'
                }`}
              >
                Thu nhập
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-750 hover:bg-gray-150/50 dark:text-gray-400 dark:hover:bg-[#191d25]/50'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'transfer' } })}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-150/50 dark:text-gray-400 dark:hover:bg-[#191d25]/50'
                }`}
              >
                Chuyển khoản
              </button>
            </div>
          </div>

          {formData.type !== 'transfer' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Danh mục
              </label>
              {availableCategories.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-bold mb-2">
                        Chưa có danh mục nào cho loại giao dịch này
                      </p>
                      <Link
                        to="/categories"
                        onClick={onClose}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold underline"
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
                  className="input w-full text-sm"
                >
                  <option value="">Chọn danh mục</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}

          {/* Wallet Select */}
          {formData.type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Ví nguồn
                </label>
                <select
                  name="walletId"
                  value={formData.walletId}
                  onChange={handleChange}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">Chọn ví nguồn</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === formData.toWalletId}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Ví đích
                </label>
                <select
                  name="toWalletId"
                  value={formData.toWalletId}
                  onChange={handleChange}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">Chọn ví đích</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === formData.walletId}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Tài khoản ví
              </label>
              <select
                name="walletId"
                value={formData.walletId}
                onChange={handleChange}
                required
                className="input w-full text-sm"
              >
                <option value="">Chọn ví thực hiện</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Số tiền
              </label>
              <CurrencyInput
                value={formData.amount}
                onChange={v => setFormData(prev => ({ ...prev, amount: v }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Tần suất lặp
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
                className="input w-full text-sm"
              >
                <option value="daily">Hàng ngày</option>
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="yearly">Hàng năm</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Ngày bắt đầu
              </label>
              <DatePicker
                value={formData.startDate}
                onChange={v => setFormData(prev => ({ ...prev, startDate: v }))}
                clearable={false}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Kết thúc (Tùy chọn)
              </label>
              <DatePicker
                value={formData.endDate}
                onChange={v => setFormData(prev => ({ ...prev, endDate: v }))}
                clearable={true}
                placeholder="Không giới hạn"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="2"
              className="input w-full text-sm resize-none"
              placeholder="Thêm ghi chú (tùy chọn)"
            />
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
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
              {loading ? 'Đang xử lý...' : rule ? 'Cập nhật' : 'Thiết lập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringModal;
