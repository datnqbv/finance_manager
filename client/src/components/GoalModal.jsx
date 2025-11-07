import { useState, useEffect } from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';

const GoalModal = ({ isOpen, onClose, onSubmit, goal = null }) => {
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
  const colorOptions = [
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
      newErrors.name = 'Tên mục tiêu là bắt buộc';
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Số tiền mục tiêu phải lớn hơn 0';
    }

    if (parseFloat(formData.currentAmount) < 0) {
      newErrors.currentAmount = 'Số tiền hiện tại không thể âm';
    }

    if (parseFloat(formData.currentAmount) > parseFloat(formData.targetAmount)) {
      newErrors.currentAmount = 'Số tiền hiện tại không thể vượt mục tiêu';
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Hạn hoàn thành là bắt buộc';
    } else if (new Date(formData.deadline) < new Date()) {
      newErrors.deadline = 'Hạn hoàn thành phải trong tương lai';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {goal ? 'Chỉnh Sửa Mục Tiêu' : 'Tạo Mục Tiêu Mới'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên Mục Tiêu *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="VD: Quỹ khẩn cấp, Du lịch, Mua xe..."
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mô Tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Mô tả mục tiêu của bạn..."
            />
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số Tiền Mục Tiêu * (VND)
              </label>
              <input
                type="number"
                name="targetAmount"
                value={formData.targetAmount}
                onChange={handleChange}
                min="0"
                step="1000"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.targetAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.targetAmount && (
                <p className="mt-1 text-sm text-red-500">{errors.targetAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Số Tiền Hiện Tại (VND)
              </label>
              <input
                type="number"
                name="currentAmount"
                value={formData.currentAmount}
                onChange={handleChange}
                min="0"
                step="1000"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.currentAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.currentAmount && (
                <p className="mt-1 text-sm text-red-500">{errors.currentAmount}</p>
              )}
            </div>
          </div>

          {/* Deadline & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hạn Hoàn Thành *
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.deadline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-500">{errors.deadline}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Độ Ưu Tiên
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Biểu Tượng
            </label>
            <div className="grid grid-cols-12 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`p-2 text-2xl rounded-lg border-2 hover:scale-110 transition-transform ${
                    formData.icon === icon
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Màu Sắc
            </label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                  className={`h-10 rounded-lg border-2 hover:scale-110 transition-transform ${
                    formData.color === color.value
                      ? 'border-gray-900 dark:border-white'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 flex gap-3">
            <FaInfoCircle className="text-blue-500 dark:text-blue-300 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-200">
              <p className="font-medium mb-1">Mẹo:</p>
              <p>Đặt hạn hoàn thành thực tế và thường xuyên bổ sung vào mục tiêu. Bạn có thể theo dõi tiến độ và thêm tiền bất cứ lúc nào!</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {goal ? 'Cập Nhật' : 'Tạo Mục Tiêu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
