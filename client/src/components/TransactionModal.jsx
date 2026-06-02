import { useState, useEffect, useRef } from 'react';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { useWallets } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { FiX, FiAlertCircle, FiCamera, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import { toast } from 'react-toastify';

const TransactionModal = ({ transaction, onClose, isOpen }) => {
  const { createTransaction, updateTransaction } = useTransactions();
  const { categories, fetchCategories } = useCategories();
  const { wallets, fetchWallets } = useWallets();
  const { user } = useAuth();
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

  const preprocessImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image to canvas
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Apply linear contrast stretching to make text darker and paper whiter without creating solid black shadow blocks
          const contrast = 1.5;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Grayscale conversion
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Contrast adjustment formula
            let v = contrast * (gray - 128) + 128;
            v = Math.max(0, Math.min(255, v));
            
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Convert canvas back to file blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check VIP daily scan limit for standard users
    const isVip = user && user.isVip && new Date(user.vipExpire) > new Date();
    if (!isVip) {
      const today = new Date().toISOString().split('T')[0];
      const scanKey = `ocr_scans_${user?.id || 'anonymous'}`;
      let scanData = { date: '', count: 0 };
      try {
        scanData = JSON.parse(localStorage.getItem(scanKey) || '{"date":"","count":0}');
      } catch (err) {
        console.error('Error parsing scan history', err);
      }

      if (scanData.date === today) {
        if (scanData.count >= 3) {
          toast.error("⚠️ Bạn đã đạt giới hạn 3 lượt quét hóa đơn/ngày của tài khoản thường. Nâng cấp VIP để sử dụng không giới hạn!");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        scanData.count += 1;
      } else {
        scanData = { date: today, count: 1 };
      }
      localStorage.setItem(scanKey, JSON.stringify(scanData));
    }

    setOcrLoading(true);
    const toastId = toast.loading("🔍 Đang đọc hóa đơn...");

    try {
      // Preprocess image to enhance OCR readability (resolves dot matrix and blur details)
      const processedFile = await preprocessImage(file);

      // Tesseract reads image and identifies text
      const result = await Tesseract.recognize(processedFile, 'vie', { 
        logger: m => {} 
      });
      
      const text = result.data.text.toLowerCase();
      const lines = text.split('\n');
      
      // OCR numeric character pattern: allow digits, and commonly confused characters
      // o/O -> 0, l/i/I/|/! -> 1, s/S -> 5, g -> 9
      const OCR_NUM_CHAR = '[0-9oOl|i!IsSg]';
      const numberRegex = new RegExp(`\\b${OCR_NUM_CHAR}+(?:[.,]\\s*${OCR_NUM_CHAR}+)*\\b`, 'g');

      const cleanNumber = (str) => {
        let cleaned = str.toLowerCase();
        // Correct common OCR errors
        cleaned = cleaned.replace(/[oO]/g, '0');
        cleaned = cleaned.replace(/[liI|!]/g, '1');
        cleaned = cleaned.replace(/[sS]/g, '5');
        cleaned = cleaned.replace(/g/g, '9');
        
        // Remove decimal cents/xu part (.00 or ,00) at the end
        cleaned = cleaned.replace(/[.,]00\s*$/, '');
        
        // Strip out non-digit formatting characters
        cleaned = cleaned.replace(/\D/g, '');
        
        return parseFloat(cleaned) || 0;
      };

      const isIgnoredNumber = (str, val) => {
        const digits = str.replace(/\D/g, '');
        
        // Ignore Vietnamese phone numbers (starts with 0 and has 10 digits, or starts with 84 and has 11-12 digits)
        if (/^0\d{9}$/.test(digits) || /^84\d{9,10}$/.test(digits)) {
          return true;
        }
        
        // Ignore tax codes / MST (typically 10 or 13 digits)
        if (digits.length === 10 || digits.length === 13) {
          return true;
        }
        
        // Ignore calendar years (e.g. 2020-2030)
        if (val >= 2020 && val <= 2030) {
          return true;
        }
        
        return false;
      };

      const getLineScore = (lineText) => {
        let score = 0;
        const normalized = lineText.toLowerCase();

        // Exclude phone ranges, dates, addresses (e.g. 13-11-2011, 9407863-8259956, 17-19)
        if (/\b\d+\s*[-\/]\s*\d+\b/.test(normalized)) {
          return -150;
        }

        // Phone number / Contact lines - should be heavily penalized or ignored
        const phoneKeywords = ['đt', 'dt', 'tel', 'phone', 'fax', 'hotline', 'điện thoại', 'dien thoai', 'contact', 'mst', 'mst:', 'dĩ', 'dỉ', 'di', 'đỉ', 'đĩ'];
        for (const kw of phoneKeywords) {
          if (normalized.includes(kw)) {
            return -150; // Return immediately to exclude/penalize this line completely
          }
        }

        // Very high priority: explicit total keywords
        const veryHighKeywords = [
          'tổng cộng', 'tong cong', 'tổng tiền', 'tong tien', 'tổng thanh toán', 'tong thanh toan',
          'total amount', 'amount due', 'net total', 'grand total', 'khách phải trả', 'khach phai tra',
          'khách cần trả', 'khach can tra', 'khách thanh toán', 'khach thanh toan', 'tổng cộng/total',
          'cần thanh toán', 'can thanh toan', 'tổng cộng thanh toán'
        ];
        
        // High priority: general total/sum words
        const highKeywords = [
          'tổng', 'total', 'thanh toán', 'thanh toan', 'thành tiền', 'thanh tien', 'tiền phải trả',
          'sum', 'cộng tiền', 'cong tien'
        ];

        // Medium priority: payment details
        const medKeywords = [
          'tiền mặt', 'tien mat', 'chuyển khoản', 'chuyen khoan', 'banking', 'thẻ', 'card',
          'cash', 'visa', 'mastercard', 'vnpay', 'momo'
        ];

        // Negative priority: change details, customer paid, quantity
        const negKeywords = [
          'tiền thừa', 'tien thua', 'thối lại', 'thoi lai', 'tiền thối', 'tien thoi', 'change', 'balance',
          'khách đưa', 'khach dua', 'tiền khách đưa', 'tien khach dua', 'nhận của khách', 'nhan cua khach'
        ];

        // Detail rows (e.g., quantities, item unit prices)
        const detailKeywords = [
          'đơn giá', 'don gia', 'giá bán', 'gia ban', 'unit price', 'price', 'số lượng', 'so luong',
          'quantity', 'qty', 'x1', 'x2', 'x3', 'x4', 'x5'
        ];

        for (const kw of veryHighKeywords) {
          if (normalized.includes(kw)) {
            score += 100;
            break;
          }
        }

        if (score === 0) {
          for (const kw of highKeywords) {
            if (normalized.includes(kw)) {
              score += 50;
              break;
            }
          }
        }

        for (const kw of medKeywords) {
          if (normalized.includes(kw)) {
            score += 15;
          }
        }

        for (const kw of negKeywords) {
          if (normalized.includes(kw)) {
            score -= 100;
          }
        }

        for (const kw of detailKeywords) {
          if (normalized.includes(kw)) {
            score -= 50;
          }
        }

        return score;
      };

      const candidates = [];
      const lineScores = lines.map(line => getLineScore(line));

      for (let i = 0; i < lines.length; i++) {
        let score = lineScores[i];
        
        // Score inheritance: if current line has no keywords, it might inherit from the line directly above
        // Label is always above or on the same line as the amount, never below
        if (score <= 0 && i > 0) {
          const aboveScore = lineScores[i - 1];
          if (aboveScore > 0) {
            score = Math.max(score, aboveScore * 0.8);
          }
        }

        const matches = lines[i].match(numberRegex);
        if (matches) {
          matches.forEach(m => {
            const val = cleanNumber(m);
            // Ignore candidates <= 1000 VND and those flagged as phone numbers/tax codes/years
            if (val > 1000 && !isIgnoredNumber(m, val)) {
              candidates.push({
                text: m,
                value: val,
                score: score,
                line: lines[i]
              });
            }
          });
        }
      }

      // Sort: highest score first, then largest value
      candidates.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return b.value - a.value;
      });

      let maxTotal = 0;
      const positiveCandidates = candidates.filter(c => c.score > 0);

      if (positiveCandidates.length > 0) {
        maxTotal = positiveCandidates[0].value;
      } else {
        // Fallback: no keywords matched
        // Filter candidates that have a score of 0 or -50 (items/details), excluding phone numbers (-150)
        const itemCandidates = candidates.filter(c => c.score <= 0 && c.score >= -99);
        
        if (itemCandidates.length >= 3) {
          // Sort item candidates descending by value
          itemCandidates.sort((a, b) => b.value - a.value);
          const largest = itemCandidates[0].value;
          const sumOfOthers = itemCandidates.slice(1).reduce((sum, c) => sum + c.value, 0);
          
          // If the sum of other items is significantly larger than the single largest item,
          // it means the actual total is missing, so we sum all items!
          if (sumOfOthers > largest * 1.2) {
            maxTotal = sumOfOthers + largest;
          }
        }
        
        if (maxTotal === 0 && candidates.length > 0) {
          maxTotal = candidates[0].value;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white shadow-2xl dark:bg-[#191d25] transition-all transform scale-100 animate-modal-scale">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-[#191d25]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {transaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 mb-2">
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
                className="input w-full bg-white dark:bg-[#191d25] text-sm"
              />
              <button type="button" onClick={handleSmartParse} className="btn btn-primary px-4">
                Phân tích
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-500/80 font-medium">Hoặc tự động đọc hóa đơn/bill (AI):</span>
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
                className={`text-[11px] flex items-center gap-1.5 py-1.5 px-3 bg-white dark:bg-[#232936] border border-emerald-200 dark:border-emerald-850 rounded-lg text-emerald-700 dark:text-[#b9e4d2] transition ${ocrLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
              >
                <FiCamera /> {ocrLoading ? 'Đang đọc...' : 'Tải ảnh hóa đơn'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Loại giao dịch
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-50 p-1 dark:bg-[#232936] border border-gray-150 dark:border-gray-800">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'income' } })}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'income'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-150/50 dark:text-gray-400 dark:hover:bg-[#191d25]/50'
                }`}
              >
                Thu nhập
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'expense' } })}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'expense'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-150/50 dark:text-gray-400 dark:hover:bg-[#191d25]/50'
                }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'transfer' } })}
                className={`rounded-lg py-2 text-xs sm:text-sm font-semibold transition-all ${
                  formData.type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-150/50 dark:text-gray-400 dark:hover:bg-[#191d25]/50'
                }`}
              >
                Chuyển khoản
              </button>
            </div>
          </div>

          {formData.type !== 'transfer' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Danh mục
              </label>
              {availableCategories.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-bold mb-2">
                        Chưa có danh mục nào cho loại giao dịch này
                      </p>
                      <Link
                        to="/categories"
                        onClick={onClose}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold underline"
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
                  className="input w-full text-sm"
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
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Số tiền
            </label>
            <CurrencyInput
              value={formData.amount}
              onChange={v => setFormData(prev => ({ ...prev, amount: v }))}
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Ngày
            </label>
            <DatePicker
              value={formData.date}
              onChange={v => setFormData(prev => ({ ...prev, date: v }))}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Ghi chú
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="2"
              className="input w-full text-sm resize-none"
              placeholder="Thêm ghi chú (tùy chọn)"
            />
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
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
