import { useState, useEffect } from 'react';
import { useCategories } from '../context/CategoryContext';
import { FiX } from 'react-icons/fi';

const BudgetModal = ({ budget, onClose, onSave }) => {
  const { categories, fetchCategories } = useCategories();
  const [formData, setFormData] = useState({
    categoryId: '',
    categoryName: '',
    amount: '',
    period: 'monthly',
    alertThresholds: [80, 100, 120],
    notificationEnabled: true
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
        notificationEnabled: budget.notificationEnabled !== false
      });
    }
  }, [budget]);

  const validate = () => {
    const newErrors = {};
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
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
      const category = categories.find(c => c._id === categoryId);
      setFormData(prev => ({
        ...prev,
        categoryId: category._id,
        categoryName: category.name
      }));
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {budget ? 'Sửa ngân sách' : 'Thêm ngân sách'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-lg transition"
          >
            <FiX size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Danh mục
            </label>
            <select
              value={formData.categoryId}
              onChange={handleCategoryChange}
              className="input"
              disabled={!!budget} // Không cho đổi category khi edit
            >
              <option value="">Ngân sách tổng</option>
              {expenseCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.categoryId ? 'Ngân sách cho danh mục cụ thể' : 'Ngân sách cho tất cả chi tiêu'}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số tiền ngân sách <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`input ${errors.amount ? 'border-red-500' : ''}`}
              placeholder="0"
              min="0"
              step="1"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Chu kỳ
            </label>
            <select
              name="period"
              value={formData.period}
              onChange={handleChange}
              className="input"
            >
              <option value="weekly">Hàng tuần</option>
              <option value="monthly">Hàng tháng</option>
              <option value="yearly">Hàng năm</option>
            </select>
          </div>

          {/* Alert Thresholds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ngưỡng cảnh báo (%)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={formData.alertThresholds[0]}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  alertThresholds: [Number(e.target.value), prev.alertThresholds[1], prev.alertThresholds[2]]
                }))}
                className="input text-center"
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
                className="input text-center"
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
                className="input text-center"
                min="0"
                max="200"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Cảnh báo khi đạt: {formData.alertThresholds[0]}%, {formData.alertThresholds[1]}%, {formData.alertThresholds[2]}%
            </p>
          </div>

          {/* Notification Enabled */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="notificationEnabled"
              name="notificationEnabled"
              checked={formData.notificationEnabled}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="notificationEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Bật thông báo cảnh báo
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
            >
              {budget ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetModal;
