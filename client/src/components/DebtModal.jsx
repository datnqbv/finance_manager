import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const DebtModal = ({ debt, onClose, onSave }) => {
  const [form, setForm] = useState({
    type: 'borrow',
    personName: '',
    amount: '',
    description: '',
    dueDate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (debt) {
      setForm({
        type: debt.type,
        personName: debt.personName,
        amount: debt.amount,
        description: debt.description || '',
        dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : ''
      });
    }
  }, [debt]);

  const validate = () => {
    const e = {};
    if (!form.personName.trim()) e.personName = 'Vui lòng nhập tên';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Vui lòng nhập số tiền hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await onSave({
      ...form,
      amount: Number(form.amount),
      dueDate: form.dueDate || null
    });
    if (res?.success !== false) onClose();
  };

  const change = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#222]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {debt ? 'Sửa khoản nợ' : 'Thêm khoản nợ'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#222] rounded-xl transition">
            <FiX size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Loại</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'borrow', label: '💸 Tôi đang vay', desc: 'Tôi nợ người khác', color: 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
                { value: 'lend',   label: '🤝 Tôi cho vay', desc: 'Người khác nợ tôi', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => change('type', opt.value)}
                  disabled={!!debt}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.type === opt.value
                      ? opt.color + ' border-opacity-100'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 hover:border-gray-300'
                  } ${debt ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <p className="text-sm font-bold">{opt.label}</p>
                  <p className="text-xs opacity-75 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Person name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              {form.type === 'lend' ? 'Tên người vay' : 'Tên người cho vay'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.personName}
              onChange={e => change('personName', e.target.value)}
              placeholder="Nhập tên..."
              className={`input ${errors.personName ? 'border-red-500' : ''}`}
            />
            {errors.personName && <p className="text-xs text-red-500 mt-1">{errors.personName}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Số tiền <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={e => change('amount', e.target.value)}
              placeholder="0"
              min="1"
              step="1000"
              className={`input ${errors.amount ? 'border-red-500' : ''}`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Hạn trả (tùy chọn)
            </label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => change('dueDate', e.target.value)}
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Ghi chú
            </label>
            <textarea
              value={form.description}
              onChange={e => change('description', e.target.value)}
              placeholder="Mô tả khoản nợ..."
              rows={2}
              className="input resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Hủy</button>
            <button type="submit" className="flex-1 btn btn-primary">{debt ? 'Cập nhật' : 'Tạo mới'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
