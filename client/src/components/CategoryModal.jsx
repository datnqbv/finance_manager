import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
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
  const { language } = useLanguage();
  const isEnglish = language === 'en';

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
      newErrors.name = isEnglish ? 'Please enter category name' : 'Vui lòng nhập tên danh mục';
    }
    if (formData.name.trim().length > 50) {
      newErrors.name = isEnglish ? 'Category name cannot exceed 50 characters' : 'Tên danh mục không được quá 50 ký tự';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100 max-h-[90vh] overflow-y-auto animate-modal-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {category 
              ? (isEnglish ? 'Edit Category' : 'Sửa danh mục') 
              : (isEnglish ? 'Add Category' : 'Thêm danh mục')}
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
          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Icon
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full flex items-center justify-between p-3.5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-[#004b38] dark:hover:border-emerald-500 bg-gray-50 dark:bg-[#232936] transition"
              >
                <span className="text-3xl">{formData.icon}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {isEnglish ? 'Click to select icon' : 'Bấm để chọn icon'}
                </span>
              </button>

              {showIconPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-[#232936] border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_ICONS.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, icon: emoji }));
                          setShowIconPicker(false);
                        }}
                        className={`text-2xl p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#191d25] transition ${
                          formData.icon === emoji ? 'bg-emerald-50 dark:bg-emerald-500/10 ring-2 ring-[#004b38] dark:ring-emerald-500' : ''
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
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {isEnglish ? 'Color' : 'Màu sắc'}
            </label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#191d25] scale-110' : ''
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
                className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 dark:border-gray-800 bg-transparent"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="input text-sm flex-1"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Category Name' : 'Tên danh mục'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`input text-sm ${errors.name ? 'border-red-500' : ''}`}
              placeholder={isEnglish ? 'Example: Dining, Salary, ...' : 'Ví dụ: Ăn uống, Lương, ...'}
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Category Type' : 'Loại danh mục'}
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input text-sm"
            >
              <option value="income">{isEnglish ? 'Income' : 'Thu nhập'}</option>
              <option value="expense">{isEnglish ? 'Expense' : 'Chi tiêu'}</option>
              <option value="both">{isEnglish ? 'Both' : 'Cả hai'}</option>
            </select>
          </div>

          {/* Order */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Display Order' : 'Thứ tự hiển thị'}
            </label>
            <input
              type="number"
              name="order"
              value={formData.order}
              onChange={handleChange}
              className="input text-sm"
              min="0"
              placeholder="0"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              {isEnglish ? 'Smaller numbers will display first' : 'Số càng nhỏ sẽ hiển thị càng trước'}
            </p>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 dark:bg-[#232936] rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              {isEnglish ? 'Preview:' : 'Xem trước:'}
            </p>
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{ backgroundColor: formData.color + '20', color: formData.color }}
              >
                {formData.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900 dark:text-white">
                  {formData.name || (isEnglish ? 'Category Name' : 'Tên danh mục')}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formData.type === 'income' 
                    ? (isEnglish ? 'Income' : 'Thu nhập') 
                    : formData.type === 'expense' 
                      ? (isEnglish ? 'Expense' : 'Chi tiêu') 
                      : (isEnglish ? 'Both' : 'Cả hai')}
                </p>
              </div>
            </div>
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
              {category 
                ? (isEnglish ? 'Update' : 'Cập nhật') 
                : (isEnglish ? 'Create' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
