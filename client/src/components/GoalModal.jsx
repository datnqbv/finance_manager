import { useState, useEffect } from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import { useLanguage } from '../context/LanguageContext';

const GoalModal = ({ isOpen, onClose, onSubmit, goal = null }) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: '',
    currentAmount: 0,
    deadline: '',
    priority: 'medium',
    icon: '🎯',
    color: '#3b82f6'
  });

  const [errors, setErrors] = useState({});

  // Icon options
  const iconOptions = [
    '🎯', '💰', '🏠', '🚗', '✈️', '🎓', '💍', '📱', 
    '💻', '🏖️', '🎸', '📚', '⚽', '🎮', '🏋️', '🎨',
    '🌟', '💎', '🏆', '🎁', '🛍️', '🏝️', '🌍', '🚀'
  ];

  // Color options
  const colorOptions = isEnglish ? [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Teal', value: '#14b8a6' }
  ] : [
    { name: 'Xanh dương', value: '#3b82f6' },
    { name: 'Xanh lá', value: '#10b981' },
    { name: 'Đỏ', value: '#ef4444' },
    { name: 'Vàng', value: '#f59e0b' },
    { name: 'Tím', value: '#8b5cf6' },
    { name: 'Hồng', value: '#ec4899' },
    { name: 'Chàm', value: '#6366f1' },
    { name: 'Lục lam', value: '#14b8a6' }
  ];

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || '',
        description: goal.description || '',
        targetAmount: goal.targetAmount || '',
        currentAmount: goal.currentAmount || 0,
        deadline: goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
        priority: goal.priority || 'medium',
        icon: goal.icon || '🎯',
        color: goal.color || '#3b82f6'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        targetAmount: '',
        currentAmount: 0,
        deadline: '',
        priority: 'medium',
        icon: '🎯',
        color: '#3b82f6'
      });
    }
    setErrors({});
  }, [goal, isOpen]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = isEnglish ? 'Goal name is required' : 'Tên mục tiêu là bắt buộc';
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = isEnglish ? 'Target amount must be greater than 0' : 'Số tiền mục tiêu phải lớn hơn 0';
    }

    if (parseFloat(formData.currentAmount) < 0) {
      newErrors.currentAmount = isEnglish ? 'Current amount cannot be negative' : 'Số tiền hiện tại không thể âm';
    }

    if (parseFloat(formData.currentAmount) > parseFloat(formData.targetAmount)) {
      newErrors.currentAmount = isEnglish ? 'Current amount cannot exceed target amount' : 'Số tiền hiện tại không thể vượt mục tiêu';
    }

    if (!formData.deadline) {
      newErrors.deadline = isEnglish ? 'Deadline is required' : 'Hạn hoàn thành là bắt buộc';
    } else if (new Date(formData.deadline) < new Date()) {
      newErrors.deadline = isEnglish ? 'Deadline must be in the future' : 'Hạn hoàn thành phải trong tương lai';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100 max-h-[90vh] overflow-y-auto animate-modal-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {goal 
              ? (isEnglish ? 'Edit Goal' : 'Chỉnh Sửa Mục Tiêu') 
              : (isEnglish ? 'Create New Goal' : 'Tạo Mục Tiêu Mới')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Goal Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Goal Name *' : 'Tên Mục Tiêu *'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input text-sm ${errors.name ? 'border-red-500' : ''}`}
              placeholder={isEnglish ? 'e.g. Emergency Fund, Travel, Buy a Car...' : 'VD: Quỹ khẩn cấp, Du lịch, Mua xe...'}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Description' : 'Mô Tả'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="input text-sm resize-none"
              placeholder={isEnglish ? 'Describe your financial goal...' : 'Mô tả mục tiêu của bạn...'}
            />
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {isEnglish ? 'Target Amount * (VND)' : 'Số Tiền Mục Tiêu * (VND)'}
              </label>
              <CurrencyInput
                value={formData.targetAmount}
                onChange={v => {
                  setFormData(prev => ({ ...prev, targetAmount: v }));
                  if (errors.targetAmount) setErrors(prev => ({ ...prev, targetAmount: '' }));
                }}
                placeholder="0"
                error={!!errors.targetAmount}
              />
              {errors.targetAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.targetAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {isEnglish ? 'Current Amount (VND)' : 'Số Tiền Hiện Tại (VND)'}
              </label>
              <CurrencyInput
                value={formData.currentAmount}
                onChange={v => {
                  setFormData(prev => ({ ...prev, currentAmount: v }));
                  if (errors.currentAmount) setErrors(prev => ({ ...prev, currentAmount: '' }));
                }}
                placeholder="0"
                error={!!errors.currentAmount}
              />
              {errors.currentAmount && (
                <p className="mt-1 text-xs text-red-500">{errors.currentAmount}</p>
              )}
            </div>
          </div>

          {/* Deadline & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {isEnglish ? 'Deadline *' : 'Hạn Hoàn Thành *'}
              </label>
              <DatePicker
                value={formData.deadline}
                onChange={val => {
                  setFormData(prev => ({ ...prev, deadline: val }));
                  if (errors.deadline) {
                    setErrors(prev => ({ ...prev, deadline: '' }));
                  }
                }}
                className={errors.deadline ? 'border-red-500' : ''}
              />
              {errors.deadline && (
                <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {isEnglish ? 'Priority' : 'Độ Ưu Tiên'}
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="input text-sm"
              >
                <option value="low">{isEnglish ? 'Low' : 'Thấp'}</option>
                <option value="medium">{isEnglish ? 'Medium' : 'Trung bình'}</option>
                <option value="high">{isEnglish ? 'High' : 'Cao'}</option>
              </select>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {isEnglish ? 'Icon' : 'Biểu Tượng'}
            </label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`h-9 w-9 text-lg rounded-xl flex items-center justify-center border transition-all ${
                    formData.icon === icon
                      ? 'border-[#004b38] bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10'
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-[#232936]'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {isEnglish ? 'Color' : 'Màu Sắc'}
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    formData.color === color.value
                      ? 'border-gray-900 dark:border-white scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 flex gap-3">
            <FaInfoCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-emerald-800 dark:text-emerald-300">
              <p className="font-bold mb-1">{isEnglish ? 'Tips:' : 'Mẹo:'}</p>
              <p>
                {isEnglish 
                  ? 'Set a realistic deadline and contribute regularly. You can track progress and add funds anytime!'
                  : 'Đặt hạn hoàn thành thực tế và thường xuyên bổ sung vào mục tiêu. Bạn có thể theo dõi tiến độ và thêm tiền bất cứ lúc nào!'}
              </p>
            </div>
          </div>

          {/* Buttons */}
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
              {goal 
                ? (isEnglish ? 'Update' : 'Cập Nhật') 
                : (isEnglish ? 'Create Goal' : 'Tạo Mục Tiêu')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
