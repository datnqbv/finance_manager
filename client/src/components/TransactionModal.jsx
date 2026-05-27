import { useState, useEffect, useRef } from 'react';
import CurrencyInput from './CurrencyInput';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { useWallets } from '../context/WalletContext';
import { FiX, FiAlertCircle, FiCamera, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { toast } from 'react-toastify';

const TransactionModal = ({ transaction, onClose, isOpen }) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const { categories, fetchCategories } = useCategories();
  const { wallets, fetchWallets } = useWallets();
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    walletId: '',
    toWalletId: '',
  });
  const [loading, setLoading] = useState(false);
  const [smartText, setSmartText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Get categories for current type
  const availableCategories = categories.filter(cat => 
    cat.type === formData.type || cat.type === 'both'
  );

  const handleSmartParse = () => {
    if (!smartText.trim()) return;
    
    // Pattern: capture amount and unit (k, tr, m)
    // VD: 30k, 50.5k, 1.5tr, 30000
    const amountMatch = smartText.match(/(\d+([.,]\d+)*)\s*(k|tr|m|đ)?/i);
    let newAmount = formData.amount;
    let newNote = smartText;
    let newCategory = formData.category;

    if (amountMatch) {
      let numStr = amountMatch[1].replace(/[,]/g, '.'); 
      let value = parseFloat(numStr);
      const unit = amountMatch[3]?.toLowerCase();
      
      if (unit === 'k') value *= 1000;
      else if (unit === 'tr' || unit === 'm') value *= 1000000;
      else if (value < 1000 && !unit && numStr.length <= 3) {
        // Nếu nhập số nhỏ hơn 1000 không có đơn vị, ngầm định là nghìn hoặc người dùng lười gõ
        // Thôi chúng ta lấy số tự thân, người Việt thường gõ thẳng 30000. 
      }
      
      newAmount = value.toString();
      newNote = newNote.replace(amountMatch[0], '').trim();
    }

    // Try to match popular category keywords (Tìm danh mục)
    const lowerNote = newNote.toLowerCase();
    for (const cat of availableCategories) {
      if (lowerNote.includes(cat.name.toLowerCase())) {
        newCategory = cat.name;
        // Bỏ keyword danh mục khỏi ghi chú để gọn gàng hơn
        newNote = newNote.replace(new RegExp(cat.name, 'i'), '').trim();
        break;
      }
    }

    setFormData(prev => ({
      ...prev,
      amount: newAmount,
      note: newNote,
      category: newCategory
    }));
    toast.success("✅ Phân tích thông minh thành công!");
    setSmartText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    const toastId = toast.loading("🔍 Đang đọc hóa đơn...");

    try {
      // Tesseract reads image and identifies text
      const result = await Tesseract.recognize(file, 'vie', { 
        logger: m => {} 
      });
      
      const text = result.data.text.toLowerCase();
      const lines = text.split('\n');
      let maxTotal = 0;

      // Scan each line for total indicators
      for (let line of lines) {
        if (line.includes('tổng') || line.includes('total') || line.includes('thanh toán') || line.includes('vnd') || line.includes('cộng')) {
          const matches = line.match(/\d+([.,]\d+)+/g);
          if (matches) {
            matches.forEach(m => {
              const val = parseFloat(m.replace(/[,.]/g, ''));
              if (val > maxTotal && val > 1000) maxTotal = val; // Assuming logic total > 1000 vnđ
            });
          }
        }
      }

      // Fallback: if keywords failed, just grab the absolute largest number in the document
      if (maxTotal === 0) {
        const allMatches = text.match(/\d+([.,]\d+)+/g);
        if (allMatches) {
           allMatches.forEach(m => {
              const val = parseFloat(m.replace(/[,.]/g, ''));
              if (val > maxTotal) maxTotal = val; 
           });
        }
      }

      if (maxTotal > 0) {
        setFormData(prev => ({ ...prev, amount: maxTotal.toString() }));
        toast.update(toastId, { render: "✅ Đã tìm thấy số tiền tổng!", type: "success", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: "⚠️ Không tìm thấy số tiền tổng rõ ràng.", type: "warning", isLoading: false, autoClose: 3000 });
      }

    } catch (error) {
      console.error(error);
      toast.update(toastId, { render: "❌ Lỗi khi đọc hóa đơn.", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setOcrLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Fetch categories and wallets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchWallets();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        note: transaction.note || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        walletId: transaction.walletId || '',
        toWalletId: transaction.toWalletId || '',
      });
    } else {
      const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];
      // Reset form when creating new transaction
      setFormData({
        type: 'expense',
        category: '',
        amount: '',
        note: '',
        date: new Date().toISOString().split('T')[0],
        walletId: defaultWallet ? defaultWallet.id : '',
        toWalletId: '',
      });
    }
  }, [transaction, isOpen, wallets]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset category when type changes
    if (name === 'type') {
      setFormData((prev) => ({ ...prev, type: value, category: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    let result;
    if (transaction) {
      result = await updateTransaction(transaction.id, data);
    } else {
      result = await createTransaction(data);
    }

    setLoading(false);

    if (result.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-[#2a2a2a] dark:bg-[#111111]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-[#2a2a2a] dark:bg-[#111111]">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {transaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-[#222222]"
          >
            <FiX size={22} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
              <FiZap /> Nhập nhanh (Smart Parsing)
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={smartText}
                onChange={(e) => setSmartText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSmartParse();
                  }
                }}
                placeholder="VD: 30k cafe, 2tr đi chợ..."
                className="input w-full bg-white dark:bg-[#1f242f] text-sm"
              />
              <button type="button" onClick={handleSmartParse} className="btn btn-primary px-4">
                Phân tích
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-blue-600 dark:text-blue-400 opacity-80">Hoặc tự động đọc hóa đơn/bill (AI):</span>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className={`text-xs flex items-center gap-1.5 py-1.5 px-3 bg-white dark:bg-[#1f242f] border border-blue-200 dark:border-blue-800 rounded-lg text-blue-600 dark:text-blue-400 transition ${ocrLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}
              >
                <FiCamera /> {ocrLoading ? 'Đang đọc...' : 'Tải ảnh hóa đơn'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1 dark:bg-[#1f242f]">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
                className={`rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2a3140]'
                }`}
              >
                Thu nhập
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
                className={`rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2a3140]'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'transfer' } })}
                className={`rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-[#2a3140]'
                }`}
              >
                Chuyển khoản
              </button>
            </div>
          </div>

          {formData.type !== 'transfer' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Danh mục
              </label>
              {availableCategories.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                        Chưa có danh mục nào cho loại giao dịch này
                      </p>
                      <Link
                        to="/categories"
                        onClick={onClose}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium underline"
                      >
                        Tạo danh mục mới →
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input w-full"
                >
                  <option value="">Chọn danh mục</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}

          {/* Wallet Select */}
          {formData.type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ví nguồn
                </label>
                <select
                  name="walletId"
                  value={formData.walletId}
                  onChange={handleChange}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">Chọn ví nguồn</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === formData.toWalletId}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ví đích
                </label>
                <select
                  name="toWalletId"
                  value={formData.toWalletId}
                  onChange={handleChange}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">Chọn ví đích</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === formData.walletId}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tài khoản ví
              </label>
              <select
                name="walletId"
                value={formData.walletId}
                onChange={handleChange}
                required
                className="input w-full text-sm"
              >
                <option value="">Chọn ví thực hiện</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name} ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Số tiền
            </label>
            <CurrencyInput
              value={formData.amount}
              onChange={v => setFormData(prev => ({ ...prev, amount: v }))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ngày
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="3"
              className="input w-full resize-none"
              placeholder="Thêm ghi chú (tùy chọn)"
            />
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-[#2a2a2a]">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Đang xử lý...' : transaction ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
