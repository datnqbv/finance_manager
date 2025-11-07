import { useState, useEffect } from 'react';
import { useCategories } from '../context/CategoryContext';
import { FiX, FiCalendar, FiRepeat } from 'react-icons/fi';

const RecurringModal = ({ recurring, onClose, onSave }) => {
  const { categories, fetchCategories } = useCategories();
  const [formData, setFormData] = useState({
    templateName: '',
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    occurrences: '',
    notifyBeforeExecution: false,
    notifyDays: 1
  });
  const [errors, setErrors] = useState({});
  const [endType, setEndType] = useState('never'); // never, date, occurrences

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (recurring) {
      setFormData({
        templateName: recurring.templateName || '',
        type: recurring.type || 'expense',
        category: recurring.category || '',
        amount: recurring.amount || '',
        note: recurring.note || '',
        frequency: recurring.frequency || 'monthly',
        startDate: recurring.startDate ? new Date(recurring.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: recurring.endDate ? new Date(recurring.endDate).toISOString().split('T')[0] : '',
        occurrences: recurring.occurrences || '',
        notifyBeforeExecution: recurring.notifyBeforeExecution || false,
        notifyDays: recurring.notifyDays || 1
      });
      
      if (recurring.endDate) setEndType('date');
      else if (recurring.occurrences) setEndType('occurrences');
      else setEndType('never');
    }
  }, [recurring]);

  const validate = () => {
    const newErrors = {};
    if (!formData.templateName.trim()) {
      newErrors.templateName = 'Vui lòng nhập tên mẫu';
    }
    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục';
    }
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
      const submitData = {
        ...formData,
        endDate: endType === 'date' ? formData.endDate : null,
        occurrences: endType === 'occurrences' ? parseInt(formData.occurrences) : null
      };
      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving recurring:', error);
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

  const availableCategories = categories.filter(cat => 
    cat.type === formData.type || cat.type === 'both'
  );

  const frequencyLabels = {
    daily: 'Hàng ngày',
    weekly: 'Hàng tuần',
    monthly: 'Hàng tháng',
    yearly: 'Hàng năm'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <FiRepeat size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {recurring ? 'Sửa giao dịch định kỳ' : 'Thêm giao dịch định kỳ'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-[#222222] rounded-lg transition"
          >
            <FiX size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tên mẫu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="templateName"
              value={formData.templateName}
              onChange={handleChange}
              className={`input ${errors.templateName ? 'border-red-500' : ''}`}
              placeholder="Ví dụ: Tiền điện hàng tháng, Lương..."
            />
            {errors.templateName && (
              <p className="mt-1 text-sm text-red-500">{errors.templateName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Loại giao dịch
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'income', category: '' }))}
                  className={`py-2 rounded-lg font-medium transition ${
                    formData.type === 'income'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Thu nhập
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                  className={`py-2 rounded-lg font-medium transition ${
                    formData.type === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Chi tiêu
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`input ${errors.category ? 'border-red-500' : ''}`}
              >
                <option value="">Chọn danh mục</option>
                {availableCategories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-500">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số tiền <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className={`input ${errors.amount ? 'border-red-500' : ''}`}
              placeholder="0"
              min="0"
              step="1000"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-500">{errors.amount}</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="2"
              className="input"
              placeholder="Thêm ghi chú (tùy chọn)"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-[#2a2a2a] pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiCalendar /> Lịch trình lặp lại
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tần suất
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="daily">📅 Hàng ngày</option>
                  <option value="weekly">📆 Hàng tuần</option>
                  <option value="monthly">🗓️ Hàng tháng</option>
                  <option value="yearly">📋 Hàng năm</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            {/* End Type */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kết thúc
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endType === 'never'}
                    onChange={() => setEndType('never')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Không bao giờ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endType === 'date'}
                    onChange={() => setEndType('date')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Vào ngày</span>
                  {endType === 'date' && (
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="input flex-1"
                    />
                  )}
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={endType === 'occurrences'}
                    onChange={() => setEndType('occurrences')}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Sau</span>
                  {endType === 'occurrences' && (
                    <>
                      <input
                        type="number"
                        name="occurrences"
                        value={formData.occurrences}
                        onChange={handleChange}
                        className="input w-20"
                        min="1"
                        placeholder="1"
                      />
                      <span className="text-gray-700 dark:text-gray-300">lần</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Notification */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200 dark:border-[#2a2a2a]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="notifyBeforeExecution"
                  checked={formData.notifyBeforeExecution}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thông báo trước khi thực hiện
                  </span>
                  {formData.notifyBeforeExecution && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Trước</span>
                      <input
                        type="number"
                        name="notifyDays"
                        value={formData.notifyDays}
                        onChange={handleChange}
                        className="input w-16"
                        min="0"
                        max="30"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">ngày</span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
              📝 Tóm tắt:
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Giao dịch <strong>{formData.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}</strong> {' '}
              <strong>{formData.category || '...'}</strong> với số tiền{' '}
              <strong>{formData.amount ? parseInt(formData.amount).toLocaleString('vi-VN') + '₫' : '...'}</strong>
              {' '}sẽ được tạo <strong>{frequencyLabels[formData.frequency]}</strong>
              {endType === 'date' && formData.endDate && ` đến ${new Date(formData.endDate).toLocaleDateString('vi-VN')}`}
              {endType === 'occurrences' && formData.occurrences && ` trong ${formData.occurrences} lần`}
              {endType === 'never' && ' không giới hạn'}.
            </p>
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
              {recurring ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringModal;
