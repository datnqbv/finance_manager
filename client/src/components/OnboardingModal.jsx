import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { FiCheck, FiArrowRight, FiArrowLeft, FiZap } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

// Danh mục mặc định gợi ý
const DEFAULT_CATEGORIES = [
  // Thu nhập
  { name: 'Lương',         icon: '💰', type: 'income',  color: '#10b981' },
  { name: 'Thưởng',        icon: '🎁', type: 'income',  color: '#3b82f6' },
  { name: 'Đầu tư',        icon: '📈', type: 'income',  color: '#8b5cf6' },
  { name: 'Thu nhập khác', icon: '💵', type: 'income',  color: '#06b6d4' },
  // Chi tiêu
  { name: 'Ăn uống',       icon: '🍔', type: 'expense', color: '#ef4444' },
  { name: 'Di chuyển',     icon: '🚗', type: 'expense', color: '#f97316' },
  { name: 'Mua sắm',       icon: '🛍️', type: 'expense', color: '#ec4899' },
  { name: 'Hóa đơn',       icon: '💡', type: 'expense', color: '#f59e0b' },
  { name: 'Sức khỏe',      icon: '💊', type: 'expense', color: '#10b981' },
  { name: 'Giải trí',      icon: '🎮', type: 'expense', color: '#6366f1' },
  { name: 'Giáo dục',      icon: '📚', type: 'expense', color: '#14b8a6' },
  { name: 'Thuê nhà',      icon: '🏠', type: 'expense', color: '#64748b' },
];

const STEPS = ['welcome', 'categories', 'done'];

const OnboardingModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { createCategory } = useCategories();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const localizedCategories = DEFAULT_CATEGORIES.map(cat => {
    let name = cat.name;
    if (isEnglish) {
      if (cat.name === 'Lương') name = 'Salary';
      else if (cat.name === 'Thưởng') name = 'Bonus';
      else if (cat.name === 'Đầu tư') name = 'Investment';
      else if (cat.name === 'Thu nhập khác') name = 'Other Income';
      else if (cat.name === 'Ăn uống') name = 'Food & Drinks';
      else if (cat.name === 'Di chuyển') name = 'Transportation';
      else if (cat.name === 'Mua sắm') name = 'Shopping';
      else if (cat.name === 'Hóa đơn') name = 'Bills';
      else if (cat.name === 'Sức khỏe') name = 'Health';
      else if (cat.name === 'Giải trí') name = 'Entertainment';
      else if (cat.name === 'Giáo dục') name = 'Education';
      else if (cat.name === 'Thuê nhà') name = 'Rent';
    }
    return { ...cat, name };
  });

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(new Set(DEFAULT_CATEGORIES.map((_, i) => i)));
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  const toggleCategory = (i) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleCreateCategories = async () => {
    setCreating(true);
    const toCreate = localizedCategories.filter((_, i) => selected.has(i));
    for (const cat of toCreate) {
      try { await createCategory(cat); } catch { /* bỏ qua lỗi trùng */ }
    }
    setCreating(false);
    setCreated(true);
    setStep(2);
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingDone', '1');
    onClose();
  };

  const handleFinish = (goTo) => {
    localStorage.setItem('onboardingDone', '1');
    onClose();
    if (goTo) navigate(goTo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFCF5] shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100 overflow-hidden animate-modal-scale">

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800/60">
          <div
            className="h-full bg-[#0a5c48] dark:bg-emerald-500 transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step 1: Welcome */}
        {step === 0 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5">
              👋
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {isEnglish ? 'Welcome!' : 'Chào mừng bạn!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
              {isEnglish ? (
                <>
                  You have successfully created your account.<br />
                  Let us help you set up quickly in <strong>30 seconds</strong>. 🚀
                </>
              ) : (
                <>
                  Bạn vừa tạo tài khoản thành công.<br />
                  Hãy để chúng tôi giúp bạn thiết lập nhanh trong <strong>30 giây</strong>. 🚀
                </>
              )}
            </p>

            <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 mb-6 text-left space-y-2">
              {[
                { emoji: '📂', text: isEnglish ? 'Create default categories' : 'Tạo danh mục thu chi mặc định' },
                { emoji: '💸', text: isEnglish ? 'Ready to add your first transaction' : 'Sẵn sàng nhập giao dịch đầu tiên' },
                { emoji: '📊', text: isEnglish ? 'View statistics & spending analysis' : 'Xem thống kê & phân tích chi tiêu' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-[#0d3a2d] dark:text-emerald-400 font-semibold">
                  <span>{item.emoji}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-2.5 rounded-xl btn btn-secondary text-sm"
              >
                {isEnglish ? 'Skip' : 'Bỏ qua'}
              </button>
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl bg-[#084d3c] hover:bg-[#0a5d4a] text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                {isEnglish ? 'Get Started' : 'Bắt đầu'} <FiArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Chọn danh mục */}
        {step === 1 && (
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-xs font-black text-emerald-600 dark:text-emerald-400">2</div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">
                {isEnglish ? 'Select Categories' : 'Chọn danh mục'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-9">
              {isEnglish ? 'Select the categories you want to create. You can add/edit them later.' : 'Chọn các danh mục bạn muốn tạo. Bạn có thể thêm/sửa sau.'}
            </p>

            {/* Income */}
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">
              {isEnglish ? 'Income' : 'Thu nhập'}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {localizedCategories.filter(c => c.type === 'income').map((cat, idx) => {
                const i = localizedCategories.findIndex(x => x.name === cat.name && x.type === 'income');
                return (
                  <button
                    key={i}
                    onClick={() => toggleCategory(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all ${
                      selected.has(i)
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#232936] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium flex-1">{cat.name}</span>
                    {selected.has(i) && <FiCheck size={14} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Expense */}
            <p className="text-xs font-bold text-rose-500 mb-2 uppercase tracking-wide">
              {isEnglish ? 'Expense' : 'Chi tiêu'}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {localizedCategories.filter(c => c.type === 'expense').map((cat) => {
                const i = localizedCategories.findIndex(x => x.name === cat.name && x.type === 'expense');
                return (
                  <button
                    key={i}
                    onClick={() => toggleCategory(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all ${
                      selected.has(i)
                        ? 'border-rose-300 bg-rose-50/50 dark:border-rose-950/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 ring-2 ring-rose-500'
                        : 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#232936] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium flex-1">{cat.name}</span>
                    {selected.has(i) && <FiCheck size={14} className="flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2.5 rounded-xl btn btn-secondary text-sm flex items-center gap-1"
              >
                <FiArrowLeft size={14} /> {isEnglish ? 'Back' : 'Quay lại'}
              </button>
              <button
                onClick={handleCreateCategories}
                disabled={creating || selected.size === 0}
                className="flex-1 py-2.5 rounded-xl bg-[#084d3c] hover:bg-[#0a5d4a] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isEnglish ? 'Creating...' : 'Đang tạo...'}
                  </>
                ) : (
                  <>
                    <FiZap size={15} /> {isEnglish ? `Create ${selected.size} categories` : `Tạo ${selected.size} danh mục`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 2 && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5 animate-bounce">
              🎉
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {isEnglish ? 'Ready!' : 'Đã sẵn sàng!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              {created ? (
                isEnglish 
                  ? `Created ${selected.size} categories successfully. Now add your first transaction!`
                  : `Đã tạo ${selected.size} danh mục thành công. Giờ hãy thêm giao dịch đầu tiên!`
              ) : (
                isEnglish
                  ? 'Your account has been set up. Start managing your finances!'
                  : 'Tài khoản đã được thiết lập. Bắt đầu quản lý tài chính thôi!'
              )}
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleFinish('/transactions')}
                className="w-full py-3 rounded-xl bg-[#084d3c] hover:bg-[#0a5d4a] text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
              >
                💸 {isEnglish ? 'Add your first transaction' : 'Thêm giao dịch đầu tiên'}
              </button>
              <button
                onClick={() => handleFinish('/dashboard')}
                className="w-full py-2.5 rounded-xl btn btn-secondary text-sm"
              >
                {isEnglish ? 'Go to Dashboard' : 'Về Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
