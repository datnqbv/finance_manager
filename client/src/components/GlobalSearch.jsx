import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import searchService from '../services/search.service';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('search_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const { user } = useAuth();
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fuzzy search helper - tìm kiếm gần đúng
  const fuzzyMatch = (text, query) => {
    if (!text || !query) return false;
    text = text.toLowerCase();
    query = query.toLowerCase();

    // Exact match
    if (text.includes(query)) return true;

    // Remove Vietnamese accents for better matching
    const removeAccents = (str) => {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const normalizedText = removeAccents(text);
    const normalizedQuery = removeAccents(query);

    if (normalizedText.includes(normalizedQuery)) return true;

    // Fuzzy matching - allow 1-2 character differences
    let queryIndex = 0;
    let matchCount = 0;

    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
      if (normalizedText[i] === normalizedQuery[queryIndex]) {
        matchCount++;
        queryIndex++;
      }
    }

    // If matched at least 70% of the query characters
    return matchCount / normalizedQuery.length >= 0.7;
  };

  // Highlight matching text
  const highlightText = (text, query) => {
    if (!text || !query) return text;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-yellow-200 dark:bg-yellow-500/30 text-gray-900 dark:text-yellow-300 font-semibold">
          {text.substring(index, index + query.length)}
        </span>
        {text.substring(index + query.length)}
      </>
    );
  };

  // Debounced search function
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Add page shortcuts (highest priority)
    const pages = [
      { title: isEnglish ? 'Overview' : 'Tổng quan', path: '/', icon: '🏠', keywords: ['dashboard', 'tổng quan', 'home', 'tong quan', 'overview'] },
      { title: isEnglish ? 'Transactions' : 'Giao dịch', path: '/transactions', icon: '📝', keywords: ['transactions', 'giao dịch', 'giao dich', 'transaction'] },
      { title: isEnglish ? 'Categories' : 'Danh mục', path: '/categories', icon: '📂', keywords: ['categories', 'danh mục', 'danh muc', 'category'] },
      { title: isEnglish ? 'Budgets' : 'Ngân sách', path: '/budgets', icon: '💰', keywords: ['budgets', 'ngân sách', 'ngan sach', 'budget'] },
      { title: isEnglish ? 'Goals' : 'Mục tiêu', path: '/goals', icon: '🎯', keywords: ['goals', 'mục tiêu', 'muc tieu', 'target'] },
      { title: isEnglish ? 'Debt Management' : 'Quản lý nợ', path: '/debts', icon: '🤝', keywords: ['debts', 'nợ', 'no', 'vay', 'borrow', 'lend', 'quản lý nợ', 'quan ly no', 'debt'] },
      { title: isEnglish ? 'Statistics' : 'Thống kê', path: '/statistics', icon: '📊', keywords: ['statistics', 'thống kê', 'thong ke', 'stats', 'chart'] },
      { title: isEnglish ? 'Profile' : 'Tài khoản', path: '/profile', icon: '👤', keywords: ['profile', 'tài khoản', 'tai khoan', 'account'] },
    ];

    const pageResults = pages
      .filter(p => p.title.toLowerCase().includes(lowerQuery) || p.keywords.some(k => k.toLowerCase().includes(lowerQuery)))
      .slice(0, 3)
      .map(p => ({
        type: 'page',
        title: p.title,
        subtitle: isEnglish ? 'Page' : 'Trang',
        path: p.path,
        icon: p.icon,
        matchText: p.title
      }));

    try {
      const response = await searchService.globalSearch(lowerQuery, 'all', 5);
      if (response.success && response.data) {
        const { transactions = [], categories = [], budgets = [], goals = [], debts = [] } = response.data;
        
        const transactionResults = transactions.map(t => ({
          type: 'transaction', id: t.id, title: t.category,
          subtitle: (t.note || (t.type === 'income' ? (isEnglish ? 'Income' : 'Thu nhập') : (isEnglish ? 'Expense' : 'Chi tiêu'))) + ' - ' + new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(t.amount),
          path: '/transactions', icon: t.type === 'income' ? '📈' : '📉',
          date: new Date(t.date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN'), matchText: t.category || t.note || ''
        }));
        const categoryResults = categories.map(c => ({
          type: 'category', id: c.id, title: c.name,
          subtitle: (isEnglish ? 'Category ' : 'Danh mục ') + (c.type === 'income' ? (isEnglish ? 'income' : 'thu nhập') : (c.type === 'expense' ? (isEnglish ? 'expense' : 'chi tiêu') : (isEnglish ? 'both' : 'cả hai'))),
          path: '/categories', icon: c.icon || '📂', matchText: c.name || ''
        }));
        const budgetResults = budgets.map(b => ({
          type: 'budget', id: b.id, title: b.category || b.categoryName || (isEnglish ? 'Total Budget' : 'Tổng ngân sách'),
          subtitle: (isEnglish ? 'Budget ' : 'Ngân sách ') + (b.period === 'monthly' ? (isEnglish ? 'monthly' : 'tháng') : (b.period === 'weekly' ? (isEnglish ? 'weekly' : 'tuần') : (isEnglish ? 'yearly' : 'năm'))) + ' - ' + new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(b.amount),
          path: '/budgets', icon: '💰', matchText: b.category || b.categoryName || 'Tổng ngân sách'
        }));
        const goalResults = goals.map(g => ({
          type: 'goal', id: g.id, title: g.name,
          subtitle: (isEnglish ? 'Goal ' : 'Mục tiêu ') + (g.status === 'active' ? (isEnglish ? 'active' : 'đang thực hiện') : (g.status === 'completed' ? (isEnglish ? 'completed' : 'đã hoàn thành') : (isEnglish ? 'paused' : 'tạm dừng'))) + ' - ' + new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(g.currentAmount) + '/' + new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(g.targetAmount),
          path: '/goals', icon: g.status === 'completed' ? '✅' : '🎯', matchText: g.name || ''
        }));
        const debtResults = debts.map(debt => ({
          type: 'debt', id: debt.id, title: debt.personName,
          subtitle: (debt.type === 'lend' ? (isEnglish ? 'They owe me' : 'Họ nợ tôi') : (isEnglish ? 'I owe them' : 'Tôi nợ họ')) + ' - ' + new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(debt.remainingAmount ?? debt.amount ?? 0),
          path: '/debts', icon: debt.status === 'settled' ? '✅' : (debt.type === 'lend' ? '🧑‍🤝‍🧑' : '🏦'),
          matchText: (debt.personName + ' ' + (debt.description || '')).trim(),
          date: debt.dueDate ? new Date(debt.dueDate).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN') : undefined
        }));

        const allResults = [...transactionResults, ...categoryResults, ...budgetResults, ...goalResults, ...debtResults];
        setSearchResults([...pageResults, ...allResults.slice(0, 15)]);
      } else { setSearchResults(pageResults); }
    } catch (error) { console.error('Lỗi API tìm kiếm:', error); setSearchResults(pageResults); }
  }, [isEnglish, user?.currency]);

  // Save clicked result to localStorage history
  const saveSearchQuery = (result) => {
    if (!result) return;
    const item = {
      type: result.type,
      id: result.id || null,
      title: result.title,
      subtitle: result.subtitle,
      path: result.path,
      icon: result.icon,
      date: result.date || null
    };

    setSearchHistory((prev) => {
      const filtered = prev.filter((existing) => {
        const samePath = existing.path === item.path;
        const sameType = existing.type === item.type;
        const sameId = existing.id === item.id;
        const sameTitle = existing.title === item.title;
        return !(samePath && sameType && sameId && sameTitle);
      });
      const updated = [item, ...filtered].slice(0, 5);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Remove single history query
  const removeHistoryItem = (indexToRemove) => {
    setSearchHistory((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Clear all history queries
  const clearAllHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  // Debounced search with useEffect
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer (300ms delay)
    debounceTimer.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleResultClick = (result) => {
    saveSearchQuery(result);
    navigate(result.path);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim() && searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      }
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isEnglish ? 'Search...' : 'Tìm kiếm...'}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl
                   bg-gray-50 dark:bg-[#1a1a1a]
                   border border-gray-200 dark:border-[#2a2a2a]
                   text-gray-900 dark:text-white
                   placeholder:text-gray-400 dark:placeholder:text-gray-500
                   focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                   focus:border-transparent
                   transition-all duration-200"
        />
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={18} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (searchQuery || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111111]
                      rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]
                      max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {!searchQuery ? (
            /* Search History View */
            <div className="py-1">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-[#222222] text-xs font-bold text-gray-500 dark:text-gray-400">
                <span>{isEnglish ? 'Recently Visited' : 'Xem gần đây'}</span>
                <button
                  onClick={clearAllHistory}
                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  {isEnglish ? 'Clear All' : 'Xóa tất cả'}
                </button>
              </div>
              <div className="py-1">
                {searchHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] group cursor-pointer transition-colors"
                  >
                    <button
                      onClick={() => handleResultClick(item)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0"
                    >
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.25 rounded-full font-medium flex-shrink-0
                            ${item.type === 'page' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : ''}
                            ${item.type === 'transaction' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : ''}
                            ${item.type === 'category' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' : ''}
                            ${item.type === 'budget' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : ''}
                            ${item.type === 'goal' ? 'bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400' : ''}
                            ${item.type === 'debt' ? 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400' : ''}
                          `}>
                            {item.type === 'page' && (isEnglish ? 'Page' : 'Trang')}
                            {item.type === 'transaction' && (isEnglish ? 'Transaction' : 'Giao dịch')}
                            {item.type === 'category' && (isEnglish ? 'Category' : 'Danh mục')}
                            {item.type === 'budget' && (isEnglish ? 'Budget' : 'Ngân sách')}
                            {item.type === 'goal' && (isEnglish ? 'Goal' : 'Mục tiêu')}
                            {item.type === 'debt' && (isEnglish ? 'Debt' : 'Nợ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHistoryItem(index);
                      }}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all p-1"
                      title={isEnglish ? 'Remove' : 'Xóa'}
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Search Results View */
            searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((result, index) => (
                  <button
                    key={`${result.type}-${result.id || index}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 flex items-center gap-3
                             hover:bg-gray-50 dark:hover:bg-[#1a1a1a]
                             transition-colors text-left group"
                  >
                    <span className="text-2xl flex-shrink-0">{result.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {result.matchText ? highlightText(result.title, searchQuery) : result.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                          ${result.type === 'page' ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' : ''}
                          ${result.type === 'transaction' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' : ''}
                          ${result.type === 'category' ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400' : ''}
                          ${result.type === 'budget' ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400' : ''}
                          ${result.type === 'goal' ? 'bg-pink-100 dark:bg-pink-500/10 text-pink-700 dark:text-pink-400' : ''}
                          ${result.type === 'debt' ? 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400' : ''}
                        `}>
                          {result.type === 'page' && (isEnglish ? 'Page' : 'Trang')}
                          {result.type === 'transaction' && (isEnglish ? 'Transaction' : 'Giao dịch')}
                          {result.type === 'category' && (isEnglish ? 'Category' : 'Danh mục')}
                          {result.type === 'budget' && (isEnglish ? 'Budget' : 'Ngân sách')}
                          {result.type === 'goal' && (isEnglish ? 'Goal' : 'Mục tiêu')}
                          {result.type === 'debt' && (isEnglish ? 'Debt' : 'Nợ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.subtitle}
                      </p>
                      {result.date && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {result.date}
                        </p>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500">↵</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <FiSearch className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={32} />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEnglish ? `No results found for "${searchQuery}"` : `Không tìm thấy kết quả cho "${searchQuery}"`}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {isEnglish ? 'Try searching: transaction, category, budget, goal, debt...' : 'Thử tìm: giao dịch, danh mục, ngân sách, mục tiêu, nợ...'}
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
