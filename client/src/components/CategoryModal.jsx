import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const EMOJI_ICONS = [
  '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🏦', '💎', '💼',
  '🍜', '🍕', '🍔', '🍟', '🍗', '🥗', '🍱', '🍜', '☕', '🍺',
  '🚗', '🚕', '🚌', '🚇', '✈️', '🚲', '⛽', '🅿️', '🚦', '🛵',
  '🛒', '👕', '👗', '👠', '👜', '💄', '🎁', '🛍️', '📱', '💻',
  '🎮', '🎬', '🎵', '🎸', '🎯', '⚽', '🏀', '🎾', '🎪', '🎨',
  '📚', '📖', '✏️', '🎓', '🏫', '📝', '💼', '🖊️', '📐', '🔬',
  '🏥', '💊', '💉', '🩺', '🏨', '⚕️', '🚑', '🔬', '🧬', '🦷',
  '🏠', '🏡', '🏢', '🏬', '🏪', '🏛️', '🏗️', '🔧', '🔨', '🪛',
  '📄', '📋', '📊', '📈', '💡', '🔌', '💻', '📱', '☎️', '🌐',
  '📁', '📂', '📅', '📆', '⏰', '⏱️', '🔔', '🔕', '💤', '✅',
];

const PRESET_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#06B6D4', '#6366F1', '#F97316', '#84CC16',
  '#14B8A6', '#F43F5E', '#A855F7', '#0EA5E9', '#22C55E',
  '#64748B', '#DC2626', '#EA580C', '#059669', '#0284C7',
];

const CategoryModal = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '📁',
    color: '#3B82F6',
    type: 'expense',
    order: 0
  });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        icon: category.icon || '📁',
        color: category.color || '#3B82F6',
        type: category.type || 'expense',
        order: category.order || 0
      });
    }
  }, [category]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên danh mục';
    }
    if (formData.name.trim().length > 50) {
      newErrors.name = 'Tên danh mục không được quá 50 ký tự';
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
      console.error('Error saving category:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {category ? 'Sửa danh mục' : 'Thêm danh mục'}
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
          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full flex items-center justify-between p-4 border-2 border-gray-300 dark:border-[#2a2a2a] rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition"
              >
                <span className="text-4xl">{formData.icon}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Click để chọn icon
                </span>
              </button>

              {showIconPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_ICONS.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, icon: emoji }));
                          setShowIconPicker(false);
                        }}
                        className={`text-2xl p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#222222] transition ${
                          formData.icon === emoji ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Màu sắc
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-10 h-10 rounded-lg transition-transform hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#111111] scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-12 h-12 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="input flex-1"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Ví dụ: Ăn uống, Lương, ..."
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại danh mục
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="income">Thu nhập</option>
              <option value="expense">Chi tiêu</option>
              <option value="both">Cả hai</option>
            </select>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thứ tự hiển thị
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              className="input"
              min="0"
              placeholder="0"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Số càng nhỏ sẽ hiển thị càng trước
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border-2 border-dashed border-gray-300 dark:border-[#2a2a2a]">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Xem trước:</p>
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ backgroundColor: formData.color + '20', color: formData.color }}
              >
                {formData.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formData.name || 'Tên danh mục'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.type === 'income' ? 'Thu nhập' : formData.type === 'expense' ? 'Chi tiêu' : 'Cả hai'}
                </p>
              </div>
            </div>
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
              {category ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
