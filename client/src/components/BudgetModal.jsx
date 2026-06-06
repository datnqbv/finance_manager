import { useState, useEffect } from 'react';
import CurrencyInput from './CurrencyInput';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { FiX } from 'react-icons/fi';

const BudgetModal = ({ budget, onClose, onSave }) => {
  const { categories, fetchCategories } = useCategories();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const [formData, setFormData] = useState({
    categoryId: '',
    categoryName: '',
    amount: '',
    period: 'monthly',
    alertThresholds: [80, 100, 120],
    notificationEnabled: true,
    rolloverEnabled: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (budget) {
      setFormData({
        categoryId: budget.categoryId || '',
        categoryName: budget.categoryName || '',
        amount: budget.amount || '',
        period: budget.period || 'monthly',
        alertThresholds: budget.alertThresholds || [80, 100, 120],
        notificationEnabled: budget.notificationEnabled !== false,
        rolloverEnabled: budget.rolloverEnabled || false
      });
    }
  }, [budget]);

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = isEnglish ? 'Please enter a valid amount' : 'Vui lòng nhập số tiền hợp lệ';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    if (categoryId === '') {
      // Overall budget
      setFormData(prev => ({
        ...prev,
        categoryId: '',
        categoryName: ''
      }));
    } else {
      const category = categories.find(c => c.id === categoryId);
      setFormData(prev => ({
        ...prev,
        categoryId: category.id,
        categoryName: category.name
      }));
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100 max-h-[90vh] overflow-y-auto animate-modal-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {budget 
              ? (isEnglish ? 'Edit Budget' : 'Sửa ngân sách') 
              : (isEnglish ? 'Add Budget' : 'Thêm ngân sách')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Category' : 'Danh mục'}
            </label>
            <select
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className="input text-sm"
              disabled={!!budget} // Không cho đổi category khi edit
            >
              <option value="">{isEnglish ? 'Total Budget' : 'Ngân sách tổng'}</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              {formData.categoryId 
                ? (isEnglish ? 'Budget for specific category' : 'Ngân sách cho danh mục cụ thể') 
                : (isEnglish ? 'Budget for all expenses' : 'Ngân sách cho tất cả chi tiêu')}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Budget Amount' : 'Số tiền ngân sách'} <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              value={formData.amount}
              onChange={v => {
                setFormData(prev => ({ ...prev, amount: v }));
                if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
              }}
              placeholder="0"
              error={!!errors.amount}
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Period' : 'Chu kỳ'}
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="input text-sm"
            >
              <option value="weekly">{isEnglish ? 'Weekly' : 'Hàng tuần'}</option>
              <option value="monthly">{isEnglish ? 'Monthly' : 'Hàng tháng'}</option>
              <option value="yearly">{isEnglish ? 'Yearly' : 'Hàng năm'}</option>
            </select>
          </div>

          {/* Alert Thresholds */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Alert Thresholds (%)' : 'Ngưỡng cảnh báo (%)'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={formData.alertThresholds[0]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  alertThresholds: [Number(e.target.value), prev.alertThresholds[1], prev.alertThresholds[2]]
                }))}
                className="input text-center text-sm"
                min="0"
                max="100"
              />
              <input
                type="number"
                value={formData.alertThresholds[1]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  alertThresholds: [prev.alertThresholds[0], Number(e.target.value), prev.alertThresholds[2]]
                }))}
                className="input text-center text-sm"
                min="0"
                max="200"
              />
              <input
                type="number"
                value={formData.alertThresholds[2]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  alertThresholds: [prev.alertThresholds[0], prev.alertThresholds[1], Number(e.target.value)]
                }))}
                className="input text-center text-sm"
                min="0"
                max="200"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              {isEnglish 
                ? `Alert when reached: ${formData.alertThresholds[0]}%, ${formData.alertThresholds[1]}%, ${formData.alertThresholds[2]}%`
                : `Cảnh báo khi đạt: ${formData.alertThresholds[0]}%, ${formData.alertThresholds[1]}%, ${formData.alertThresholds[2]}%`}
            </p>
          </div>

          {/* Notification Enabled */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="notificationEnabled"
              name="notificationEnabled"
              checked={formData.notificationEnabled}
              onChange={handleChange}
              className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="notificationEnabled" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              {isEnglish ? 'Enable alert notifications' : 'Bật thông báo cảnh báo'}
            </label>
          </div>

          {/* Rollover Enabled */}
          <div className="rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 p-3 space-y-1">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="rolloverEnabled"
                name="rolloverEnabled"
                checked={formData.rolloverEnabled}
                onChange={handleChange}
                className="h-4.5 w-4.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="rolloverEnabled" className="text-sm font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer">
                {isEnglish ? 'Enable Rollover (carry over balance)' : 'Bật Rollover (chuyển dư/vượt sang kỳ sau)'}
              </label>
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-500/80 ml-7 leading-relaxed">
              {isEnglish
                ? 'If spending is low this period, the surplus is automatically added to the next period. If overspent, it will be deducted.'
                : 'Nếu kỳ này chi ít, phần dư tự động cộng vào kỳ sau. Nếu vượt, sẽ bị trừ ở kỳ sau.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              {isEnglish ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
            >
              {budget 
                ? (isEnglish ? 'Update' : 'Cập nhật') 
                : (isEnglish ? 'Create' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
