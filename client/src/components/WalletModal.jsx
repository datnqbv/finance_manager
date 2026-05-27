import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { FiX } from 'react-icons/fi';

const WalletModal = ({ wallet, onClose, onSave }) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [icon, setIcon] = useState('💼');
  const [color, setColor] = useState('#3B82F6');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetIcons = ['💼', '💵', '💳', '📱', '🏦', '💰', '🔑', '✈️', '🛒'];
  const presetColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#EF4444', // Red
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#64748B', // Slate
  ];

  useEffect(() => {
    if (wallet) {
      setName(wallet.name || '');
      setInitialBalance(wallet.initialBalance !== undefined ? wallet.initialBalance.toString() : '0');
      setIcon(wallet.icon || '💼');
      setColor(wallet.color || '#3B82F6');
      setIsDefault(!!wallet.isDefault);
    } else {
      setName('');
      setInitialBalance('0');
      setIcon('💼');
      setColor('#3B82F6');
      setIsDefault(false);
    }
  }, [wallet]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSave({
        name: name.trim(),
        initialBalance: parseFloat(initialBalance) || 0,
        icon,
        color,
        isDefault
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {wallet 
              ? (isEnglish ? 'Edit Wallet' : 'Chỉnh sửa ví') 
              : (isEnglish ? 'Add Wallet' : 'Thêm ví mới')}
          </h3>
          <button 
            onClick={onClose} 
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Wallet Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Wallet Name' : 'Tên ví'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEnglish ? 'Cash, Bank Account...' : 'Tiền mặt, Vietcombank, Momo...'}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b38] dark:border-gray-800 dark:bg-[#232936] dark:text-white dark:focus:ring-emerald-500"
            />
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Initial Balance' : 'Số dư ban đầu'}
            </label>
            <input
              type="number"
              min="0"
              required
              disabled={!!wallet} // Disable editing initial balance directly when updating to prevent sync mismatch
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#004b38] dark:border-gray-800 dark:bg-[#232936] dark:text-white dark:focus:ring-emerald-500 disabled:opacity-50"
            />
            {wallet && (
              <p className="mt-1 text-[11px] text-gray-400">
                {isEnglish 
                  ? 'To update current balance, modify transactions or add adjustment transactions.' 
                  : 'Để thay đổi số dư, vui lòng chỉnh sửa các giao dịch hoặc thực hiện chuyển khoản.'}
              </p>
            )}
          </div>

          {/* Icon Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {isEnglish ? 'Icon' : 'Biểu tượng'}
            </label>
            <div className="flex flex-wrap gap-2">
              {presetIcons.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`h-10 w-10 text-xl rounded-xl flex items-center justify-center border transition-all ${
                    icon === i 
                      ? 'border-[#004b38] bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10' 
                      : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-[#232936]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              {isEnglish ? 'Color' : 'Màu sắc'}
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color === c 
                      ? 'border-gray-900 dark:border-white scale-110' 
                      : 'border-transparent hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Default Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="isDefault" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              {isEnglish ? 'Set as Default Wallet' : 'Đặt làm ví mặc định'}
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#232936]"
            >
              {isEnglish ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-[#003d2d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00523d] disabled:opacity-50 transition-colors"
            >
              {isSubmitting 
                ? (isEnglish ? 'Saving...' : 'Đang lưu...') 
                : (isEnglish ? 'Save' : 'Lưu')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default WalletModal;
