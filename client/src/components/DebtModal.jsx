import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import { useLanguage } from '../context/LanguageContext';

const DebtModal = ({ debt, onClose, onSave }) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
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
    if (!form.personName.trim()) {
      e.personName = isEnglish ? 'Please enter name' : 'Vui lòng nhập tên';
    }
    if (!form.amount || Number(form.amount) <= 0) {
      e.amount = isEnglish ? 'Please enter a valid amount' : 'Vui lòng nhập số tiền hợp lệ';
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100 max-h-[90vh] overflow-y-auto animate-modal-scale">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {debt 
              ? (isEnglish ? 'Edit Debt' : 'Sửa khoản nợ') 
              : (isEnglish ? 'Add Debt' : 'Thêm khoản nợ')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Type' : 'Loại'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { 
                  value: 'borrow', 
                  label: isEnglish ? '💸 I Borrowed' : '💸 Tôi đang vay', 
                  desc: isEnglish ? 'I owe someone' : 'Tôi nợ người khác', 
                  activeColor: 'border-rose-300 bg-rose-50/50 dark:border-rose-950/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500' 
                },
                { 
                  value: 'lend',   
                  label: isEnglish ? '🤝 I Lent' : '🤝 Tôi cho vay', 
                  desc: isEnglish ? 'Someone owes me' : 'Người khác nợ tôi', 
                  activeColor: 'border-[#cfe2d8] bg-emerald-50/50 dark:border-[#335348] dark:bg-[#273332] text-[#0d3a2d] dark:text-[#b9e4d2] ring-2 ring-emerald-500' 
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => change('type', opt.value)}
                  disabled={!!debt}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.type === opt.value
                      ? opt.activeColor
                      : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#232936] text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                  } ${debt ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <p className="text-sm font-bold">{opt.label}</p>
                  <p className="text-[10px] opacity-75 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Person name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {form.type === 'lend' 
                ? (isEnglish ? 'Borrower Name' : 'Tên người vay') 
                : (isEnglish ? 'Lender Name' : 'Tên người cho vay')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.personName}
              onChange={e => change('personName', e.target.value)}
              placeholder={isEnglish ? 'Enter name...' : 'Nhập tên...'}
              className={`input text-sm ${errors.personName ? 'border-red-500' : ''}`}
            />
            {errors.personName && <p className="text-xs text-red-500 mt-1">{errors.personName}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Amount' : 'Số tiền'} <span className="text-red-500">*</span>
            </label>
            <CurrencyInput
              value={form.amount}
              onChange={v => change('amount', v)}
              placeholder="0"
              error={!!errors.amount}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Due Date (optional)' : 'Hạn trả (tùy chọn)'}
            </label>
            <DatePicker
              value={form.dueDate}
              onChange={val => change('dueDate', val)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Note' : 'Ghi chú'}
            </label>
            <textarea
              value={form.description}
              onChange={e => change('description', e.target.value)}
              placeholder={isEnglish ? 'Debt description...' : 'Mô tả khoản nợ...'}
              rows={2}
              className="input text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
              {isEnglish ? 'Cancel' : 'Hủy'}
            </button>
            <button type="submit" className="flex-1 btn btn-primary">
              {debt 
                ? (isEnglish ? 'Update' : 'Cập nhật') 
                : (isEnglish ? 'Create' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
