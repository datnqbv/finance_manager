import { useState, useEffect, useRef } from 'react';
import CurrencyInput from './CurrencyInput';
import DatePicker from './DatePicker';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { useWallets } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { FiX, FiAlertCircle, FiCamera, FiZap, FiPaperclip, FiExternalLink, FiDownload, FiUsers, FiMinus, FiPlus, FiCheck, FiInfo } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../context/LanguageContext';
import { transactionService } from '../services/transaction.service';

const TransactionModal = ({ transaction, onClose, isOpen }) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const { transactions, createTransaction, updateTransaction } = useTransactions();
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
    receiptUrl: '',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [smartText, setSmartText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const fileInputRef = useRef(null);
  const attachInputRef = useRef(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [totalBill, setTotalBill] = useState('');
  const [splitPeople, setSplitPeople] = useState(2);
  const [includeSplitNote, setIncludeSplitNote] = useState(true);

  useEffect(() => {
    if (isSplitMode && totalBill) {
      const bill = parseFloat(totalBill) || 0;
      const people = Math.max(1, splitPeople);
      const share = Math.round(bill / people);
      setFormData(prev => ({ ...prev, amount: share.toString() }));
    }
  }, [isSplitMode, totalBill, splitPeople]);

  // Get categories for current type
  const availableCategories = categories.filter(cat => 
    cat.type === formData.type || cat.type === 'both'
  );

  const handleSmartParse = () => {
    if (!smartText.trim()) return;

    let newType = formData.type;
    const textLower = smartText.toLowerCase();

    // 1. Detect transaction type based on keywords
    if (/\b(chuyển|chuyển khoản|ck|chuyen|transfer|sang|qua)\b/i.test(textLower)) {
      newType = 'transfer';
    } else if (/\b(nhận|lương|luong|thu nhập|thu nhap|được|duoc|lãi|lai|income)\b/i.test(textLower)) {
      newType = 'income';
    } else if (/\b(chi|mua|ăn|an|thanh toán|thanh toan|trả|tra|chi tiêu|expense)\b/i.test(textLower)) {
      newType = 'expense';
    }
    
    // 2. Parse amount and unit (k, tr, m)
    const amountMatch = smartText.match(/(\d+([.,]\d+)*)\s*(k|tr|m|đ)?/i);
    let newAmount = formData.amount;
    let newNote = smartText;

    if (amountMatch) {
      let numStr = amountMatch[1].replace(/[,]/g, '.'); 
      let value = parseFloat(numStr);
      const unit = amountMatch[3]?.toLowerCase();
      
      if (unit === 'k') {
        value *= 1000;
      } else if (unit === 'tr' || unit === 'm') {
        value *= 1000000;
      } else if (value < 1000 && !unit && numStr.length <= 3) {
        // Nhập số ngắn < 1000 không đơn vị -> tự hiểu là nghìn đồng (k)
        value *= 1000;
      }
      
      newAmount = value.toString();
      newNote = newNote.replace(amountMatch[0], '').trim();
    }

    // 3. Match categories based on the new/detected type
    let newCategory = formData.category;
    const catsForNewType = categories.filter(cat => 
      cat.type === newType || cat.type === 'both'
    );
    const lowerNote = newNote.toLowerCase();
    for (const cat of catsForNewType) {
      if (lowerNote.includes(cat.name.toLowerCase())) {
        newCategory = cat.name;
        // Strip category keyword from note for cleaner text
        newNote = newNote.replace(new RegExp(cat.name, 'i'), '').trim();
        break;
      }
    }

    // 4. Update form data
    setFormData(prev => ({
      ...prev,
      type: newType,
      amount: newAmount,
      note: newNote,
      category: newType === 'transfer' ? 'Chuyển khoản' : newCategory
    }));

    toast.success(isEnglish ? "✅ Smart parsing successful!" : "✅ Phân tích thông minh thành công!");
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

  const compressImageForUpload = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIMENSION = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.6); // 60% quality JPEG is very small
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAttachUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreviewImage(URL.createObjectURL(file));
    const compressed = await compressImageForUpload(file);
    setReceiptFile(compressed);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreviewImage(URL.createObjectURL(file));
    const compressed = await compressImageForUpload(file);
    setReceiptFile(compressed);

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
          toast.error(isEnglish ? "⚠️ You have reached the limit of 3 receipt scans/day for standard accounts. Upgrade to VIP for unlimited usage!" : "⚠️ Bạn đã đạt giới hạn 3 lượt quét hóa đơn/ngày của tài khoản thường. Nâng cấp VIP để sử dụng không giới hạn!");
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
    const toastId = toast.loading(isEnglish ? "🔍 Scanning receipt..." : "🔍 Đang đọc hóa đơn...");

    try {
      // Preprocess image to enhance OCR readability (resolves dot matrix and blur details)
      const processedFile = await preprocessImage(file);

      // Dynamic import of Tesseract to optimize bundle size and startup performance
      const Tesseract = (await import('tesseract.js')).default;

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
        toast.update(toastId, { render: isEnglish ? "✅ Found total amount!" : "✅ Đã tìm thấy số tiền tổng!", type: "success", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: isEnglish ? "⚠️ Clear total amount not found." : "⚠️ Không tìm thấy số tiền tổng rõ ràng.", type: "warning", isLoading: false, autoClose: 3000 });
      }

    } catch (error) {
      console.error(error);
      toast.update(toastId, { render: isEnglish ? "❌ Error reading receipt." : "❌ Lỗi khi đọc hóa đơn.", type: "error", isLoading: false, autoClose: 3000 });
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
    } else {
      setPreviewImage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowLightbox(false);
      }
    };
    if (showLightbox) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLightbox]);

  useEffect(() => {
    if (transaction) {
      let parsedTags = [];
      if (transaction.tags) {
        if (Array.isArray(transaction.tags)) {
          parsedTags = transaction.tags;
        } else {
          try {
            parsedTags = JSON.parse(transaction.tags);
          } catch {
            parsedTags = transaction.tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        }
      }
      setFormData({
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        note: transaction.note || '',
        date: new Date(transaction.date).toISOString().split('T')[0],
        walletId: transaction.walletId || '',
        toWalletId: transaction.toWalletId || '',
        receiptUrl: transaction.receiptUrl || '',
        tags: parsedTags,
      });
      if (transaction.receiptUrl) {
        setPreviewImage(transaction.receiptUrl);
      }
      setIsSplitMode(false);
      setTotalBill('');
      setSplitPeople(2);
      setIncludeSplitNote(true);
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
        receiptUrl: '',
        tags: [],
      });
      setPreviewImage(null);
      setReceiptFile(null);
      setIsSplitMode(false);
      setTotalBill('');
      setSplitPeople(2);
      setIncludeSplitNote(true);
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

    const parsedAmount = parseFloat(formData.amount);

    // 1. Wallet Balance Overdraft warning (Cảnh báo chi tiêu/chuyển vượt số dư ví)
    const selectedWallet = wallets.find(w => w.id === formData.walletId);
    if ((formData.type === 'expense' || formData.type === 'transfer') && selectedWallet) {
      if (Number(selectedWallet.balance) < parsedAmount) {
        const confirmOverdraft = window.confirm(
          isEnglish
            ? `⚠️ Warning: Selected wallet "${selectedWallet.name}" does not have enough balance (${selectedWallet.balance.toLocaleString('en-US')} VND) for this transaction. Do you want to proceed anyway?`
            : `⚠️ Cảnh báo: Ví "${selectedWallet.name}" của bạn không đủ số dư (${selectedWallet.balance.toLocaleString('vi-VN')} ₫) để thực hiện giao dịch này. Bạn có muốn tiếp tục ghi nhận không?`
        );
        if (!confirmOverdraft) {
          setLoading(false);
          return;
        }
      }
    }

    // 2. Prevent accidental duplicate transactions in the last 2 minutes
    if (!transaction) { // Only check for new creations, not edits
      const now = new Date();
      const isDuplicate = transactions && transactions.some(t => {
        const tDate = new Date(t.date);
        const diffMinutes = Math.abs(now - tDate) / (1000 * 60);
        return (
          diffMinutes <= 2 &&
          Number(t.amount) === parsedAmount &&
          t.walletId === formData.walletId &&
          t.type === formData.type &&
          (formData.type === 'transfer' ? t.toWalletId === formData.toWalletId : t.category === formData.category)
        );
      });

      if (isDuplicate) {
        const confirmDuplicate = window.confirm(
          isEnglish
            ? "⚠️ It looks like you recently created a similar transaction in the last 2 minutes. Are you sure you want to add this duplicate?"
            : "⚠️ Hệ thống phát hiện bạn vừa thêm một giao dịch tương tự trong vòng 2 phút qua. Bạn có chắc chắn muốn tiếp tục thêm giao dịch trùng lặp này không?"
        );
        if (!confirmDuplicate) {
          setLoading(false);
          return;
        }
      }
    }

    let finalNote = formData.note;
    if (formData.type === 'expense' && isSplitMode && totalBill && includeSplitNote) {
      const billFormatted = new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(totalBill) || 0);
      const splitInfo = isEnglish 
        ? `(Total bill: ${billFormatted}, split among ${splitPeople} people)`
        : `(Tổng bill: ${billFormatted}, chia ${splitPeople} người)`;
      if (!finalNote.includes(splitInfo)) {
        finalNote = finalNote ? `${finalNote} - ${splitInfo}` : splitInfo;
      }
    }

    const data = {
      ...formData,
      amount: parsedAmount,
      note: finalNote,
    };

    try {
      if (receiptFile) {
        toast.info(isEnglish ? "Uploading receipt..." : "Đang tải ảnh lên Cloudinary...", { autoClose: 1500 });
        const uploadRes = await transactionService.uploadReceipt(receiptFile);
        if (uploadRes.success) {
          data.receiptUrl = uploadRes.receiptUrl;
        }
      }

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
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(isEnglish ? "Error saving transaction" : "Lỗi khi lưu giao dịch");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white shadow-2xl dark:bg-[#191d25] transition-all transform scale-100 animate-modal-scale">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-[#191d25]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {transaction 
              ? (isEnglish ? 'Edit Transaction' : 'Chỉnh sửa giao dịch') 
              : (isEnglish ? 'Add New Transaction' : 'Thêm giao dịch mới')}
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
              <FiZap /> {isEnglish ? 'Quick Input (Smart Parsing)' : 'Nhập nhanh (Smart Parsing)'}
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
                placeholder={isEnglish ? 'e.g., 30k coffee, 2m market...' : 'VD: 30k cafe, 2tr đi chợ...'}
                className="input w-full bg-white dark:bg-[#191d25] text-sm"
              />
              <button type="button" onClick={handleSmartParse} className="btn btn-primary px-4">
                {isEnglish ? 'Parse' : 'Phân tích'}
              </button>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700/80 dark:text-emerald-500/80 font-medium">
                {isEnglish ? 'Or automatically scan receipt (AI):' : 'Hoặc tự động đọc hóa đơn/bill (AI):'}
              </span>
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
                <FiCamera /> {ocrLoading ? (isEnglish ? 'Scanning...' : 'Đang đọc...') : (isEnglish ? 'Upload receipt image' : 'Tải ảnh hóa đơn')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Transaction Type' : 'Loại giao dịch'}
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
                {isEnglish ? 'Income' : 'Thu nhập'}
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
                {isEnglish ? 'Expense' : 'Chi tiêu'}
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
                {isEnglish ? 'Transfer' : 'Chuyển khoản'}
              </button>
            </div>
          </div>

          {formData.type !== 'transfer' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                {isEnglish ? 'Category' : 'Danh mục'}
              </label>
              {availableCategories.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-bold mb-2">
                        {isEnglish ? 'No categories available for this transaction type' : 'Chưa có danh mục nào cho loại giao dịch này'}
                      </p>
                      <Link
                        to="/categories"
                        onClick={onClose}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold underline"
                      >
                        {isEnglish ? 'Create new category →' : 'Tạo danh mục mới →'}
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
                  <option value="">{isEnglish ? 'Select category' : 'Chọn danh mục'}</option>
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
                  {isEnglish ? 'Source Wallet' : 'Ví nguồn'}
                </label>
                <select
                  name="walletId"
                  value={formData.walletId}
                  onChange={handleChange}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">{isEnglish ? 'Select source wallet' : 'Chọn ví nguồn'}</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} disabled={w.id === formData.toWalletId}>
                      {w.icon} {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  {isEnglish ? 'Target Wallet' : 'Ví đích'}
                </label>
                <select
                  name="toWalletId"
                  value={formData.toWalletId}
                  onChange={handleChange}
                  required
                  className="input w-full text-sm"
                >
                  <option value="">{isEnglish ? 'Select target wallet' : 'Chọn ví đích'}</option>
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
                {isEnglish ? 'Wallet Account' : 'Tài khoản ví'}
              </label>
              <select
                name="walletId"
                value={formData.walletId}
                onChange={handleChange}
                required
                className="input w-full text-sm"
              >
                <option value="">{isEnglish ? 'Select execution wallet' : 'Chọn ví thực hiện'}</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.icon} {w.name} ({new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: 'VND' }).format(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {isEnglish ? 'Amount' : 'Số tiền'}
              </label>
              {formData.type === 'expense' && (
                <button
                  type="button"
                  onClick={() => setIsSplitMode(!isSplitMode)}
                  className={`text-xs flex items-center gap-1.5 py-1 px-2.5 rounded-lg font-semibold transition-all duration-200 ${
                    isSplitMode
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#232936] text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400'
                  }`}
                >
                  <FiUsers size={14} className={isSplitMode ? 'text-white' : 'text-emerald-500'} />
                  {isEnglish ? 'Split with friends' : 'Chia tiền nhóm'}
                </button>
              )}
            </div>

            {isSplitMode && formData.type === 'expense' ? (
              <div className="mb-4 p-4 bg-gradient-to-br from-emerald-50/80 via-emerald-50/40 to-white dark:from-emerald-950/20 dark:via-emerald-900/10 dark:to-[#191d25] border border-emerald-200 dark:border-emerald-800/40 rounded-2xl shadow-sm space-y-4 animate-modal-scale">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-800/30 pb-2.5">
                  <FiUsers size={16} />
                  {isEnglish ? 'Group Split Calculator' : 'Bảng tính chia tiền nhóm'}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    {isEnglish ? 'Total Bill Amount' : 'Tổng hóa đơn (Tổng Bill)'}
                  </label>
                  <CurrencyInput
                    value={totalBill}
                    onChange={v => setTotalBill(v)}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    {isEnglish ? 'Number of People' : 'Số người chia'}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-[#232936] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => setSplitPeople(p => Math.max(1, p - 1))}
                        className="p-2.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition"
                      >
                        <FiMinus size={16} />
                      </button>
                      <span className="w-12 text-center font-bold text-gray-900 dark:text-white text-sm">
                        {splitPeople}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSplitPeople(p => p + 1)}
                        className="p-2.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition"
                      >
                        <FiPlus size={16} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {[2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSplitPeople(num)}
                          className={`py-1.5 px-3 text-xs font-bold rounded-lg transition ${
                            splitPeople === num
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white dark:bg-[#232936] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-[#1f242e] rounded-xl border border-emerald-100 dark:border-emerald-800/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      {isEnglish ? 'Your Share to Pay:' : 'Phần bạn phải trả:'}
                    </span>
                    <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                      {new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: 'VND' }).format(parseFloat(formData.amount) || 0)}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer pt-2 border-t border-gray-100 dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={includeSplitNote}
                      onChange={e => setIncludeSplitNote(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-700 dark:bg-[#232936]"
                    />
                    <span className="select-none font-medium text-[11px]">
                      {isEnglish ? 'Automatically add split details to note' : 'Tự động ghim thông tin chia tiền vào ghi chú'}
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <CurrencyInput
                value={formData.amount}
                onChange={v => setFormData(prev => ({ ...prev, amount: v }))}
                placeholder="0"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Date' : 'Ngày'}
            </label>
            <DatePicker
              value={formData.date}
              onChange={v => setFormData(prev => ({ ...prev, date: v }))}
              clearable={false}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Note' : 'Ghi chú'}
            </label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows="2"
              className="input w-full text-sm resize-none"
              placeholder={isEnglish ? 'Add note (optional)' : 'Thêm ghi chú (tùy chọn)'}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              {isEnglish ? 'Tags / Labels' : 'Tag / Nhãn (Sự kiện, chuyến đi...)'}
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-gray-50 dark:bg-[#232936] border border-gray-200 dark:border-gray-700 min-h-[42px] items-center">
              {formData.tags?.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }))}
                    className="hover:text-red-500 transition-colors"
                  >
                    <FiX size={13} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder={isEnglish ? '+ Add tag (press Enter)' : '+ Thêm tag (nhấn Enter)'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const val = e.target.value.trim().replace(/^#/, '');
                    if (val && !formData.tags?.includes(val)) {
                      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), val] }));
                      e.target.value = '';
                    }
                  }
                }}
                className="bg-transparent text-sm border-none focus:outline-none focus:ring-0 px-1 text-gray-800 dark:text-gray-200 flex-1 min-w-[120px]"
              />
            </div>
            {/* Quick tag suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-gray-400 self-center mr-1">{isEnglish ? 'Suggestions:' : 'Gợi ý nhanh:'}</span>
              {['du lịch Đà Lạt', 'sinh nhật', 'công việc', 'mua sắm', 'ăn uống'].map(sug => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    if (!formData.tags?.includes(sug)) {
                      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), sug] }));
                    }
                  }}
                  className="text-[10px] bg-gray-100 dark:bg-[#1f242e] hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-800 transition-colors"
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {isEnglish ? 'Receipt Image' : 'Ảnh đính kèm'}
              </label>
              {!previewImage && (
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  <FiPaperclip size={14} /> {isEnglish ? 'Attach Image' : 'Đính kèm ảnh'}
                </button>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              ref={attachInputRef} 
              onChange={handleAttachUpload} 
              className="hidden" 
            />

            {previewImage && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-[#202530] rounded-lg border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    {isEnglish ? 'Selected Image:' : 'Ảnh đã đính kèm:'}
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setShowLightbox(true)}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {isEnglish ? 'View Full' : 'Xem phóng to'}
                    </button>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setReceiptFile(null);
                        setFormData(prev => ({ ...prev, receiptUrl: '' }));
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        if (attachInputRef.current) attachInputRef.current.value = '';
                      }}
                      className="font-bold text-red-500 hover:underline"
                    >
                      {isEnglish ? 'Clear' : 'Xóa ảnh'}
                    </button>
                  </div>
                </div>
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#191d25] flex items-center justify-center">
                  <img
                    src={previewImage}
                    alt="Receipt Preview"
                    className="max-w-full max-h-full object-contain cursor-pointer transition-transform hover:scale-105"
                    onClick={() => setShowLightbox(true)}
                    title={isEnglish ? 'Click to view full image' : 'Click để xem ảnh phóng to'}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              {isEnglish ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading 
                ? (isEnglish ? 'Processing...' : 'Đang xử lý...') 
                : transaction 
                  ? (isEnglish ? 'Update' : 'Cập nhật') 
                  : (isEnglish ? 'Add' : 'Thêm')}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Lightbox on top of Transaction Modal */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-modal-fade"
          onClick={() => setShowLightbox(false)}
        >
          <div 
            className="relative max-w-4xl w-[90%] md:w-auto max-h-[85vh] flex flex-col items-center justify-center animate-modal-scale"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 md:-right-12 text-white hover:text-emerald-400 p-2 bg-black/40 rounded-full hover:bg-black/60 transition duration-200 flex items-center justify-center"
              title={isEnglish ? "Close" : "Đóng"}
            >
              <FiX size={24} />
            </button>

            {/* Image display */}
            <div className="relative group overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl flex items-center justify-center p-1">
              <img
                src={previewImage}
                alt="Receipt Full View"
                className="max-h-[65vh] md:max-h-[75vh] max-w-full md:max-w-3xl object-contain rounded-lg transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* Action controls */}
            <div className="mt-4 flex gap-3">
              <a
                href={previewImage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-sm font-semibold transition duration-200 shadow-lg"
              >
                <FiExternalLink size={14} /> {isEnglish ? "Open Original" : "Mở ảnh gốc"}
              </a>
              <a
                href={previewImage}
                download="receipt_upload.jpg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#003d2d] hover:bg-[#00523d] text-white rounded-xl text-sm font-semibold transition duration-200 shadow-lg"
              >
                <FiDownload size={14} /> {isEnglish ? "Download" : "Tải xuống"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionModal;
