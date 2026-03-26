import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { useTransactions } from '../context/TransactionContext';
import { useCategories } from '../context/CategoryContext';
import { useBudgets } from '../context/BudgetContext';
import { useGoal } from '../context/GoalContext';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const { goals } = useGoal();

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
  const performSearch = useCallback((query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Debug: Log data availability
    console.log('=== GLOBAL SEARCH DEBUG ===');
    console.log('Search Query:', lowerQuery);
    console.log('Budgets:', budgets?.length || 0, budgets);
    console.log('Goals:', goals?.length || 0, goals);
    console.log('Transactions:', transactions?.length || 0);
    console.log('Categories:', categories?.length || 0);
    console.log('===========================');

    // Add page shortcuts (highest priority)
    const pages = [
      { title: 'Tổng quan', path: '/', icon: '🏠', keywords: ['dashboard', 'tổng quan', 'home', 'tong quan'] },
      { title: 'Giao dịch', path: '/transactions', icon: '📝', keywords: ['transactions', 'giao dịch', 'giao dich', 'transaction'] },
      { title: 'Danh mục', path: '/categories', icon: '📁', keywords: ['categories', 'danh mục', 'danh muc', 'category'] },
      { title: 'Ngân sách', path: '/budgets', icon: '💰', keywords: ['budgets', 'ngân sách', 'ngan sach', 'budget'] },
      { title: 'Mục tiêu', path: '/goals', icon: '🎯', keywords: ['goals', 'mục tiêu', 'muc tieu', 'target'] },
      { title: 'Thống kê', path: '/statistics', icon: '📊', keywords: ['statistics', 'thống kê', 'thong ke', 'stats', 'chart'] },
      { title: 'Tài khoản', path: '/profile', icon: '👤', keywords: ['profile', 'tài khoản', 'tai khoan', 'account'] },
    ];

    const pageResults = pages
      .filter(p => 
        fuzzyMatch(p.title, lowerQuery) ||
        p.keywords.some(k => fuzzyMatch(k, lowerQuery))
      )
      .slice(0, 3)
      .map(p => ({
        type: 'page',
        title: p.title,
        subtitle: 'Trang',
        path: p.path,
        icon: p.icon,
        matchText: p.title
      }));

    // Search in transactions with relevance scoring
    const transactionResults = (transactions || [])
      .map(t => {
        const categoryLower = (t.category || '').toLowerCase();
        const noteLower = (t.note || '').toLowerCase();
        
        let score = 0;
        
        // Exact match (highest priority)
        if (categoryLower === lowerQuery) score += 100;
        else if (noteLower === lowerQuery) score += 90;
        
        // Starts with (high priority)
        else if (categoryLower.startsWith(lowerQuery)) score += 80;
        else if (noteLower.startsWith(lowerQuery)) score += 70;
        
        // Contains (medium priority)
        else if (categoryLower.includes(lowerQuery)) score += 50;
        else if (noteLower.includes(lowerQuery)) score += 40;
        
        // Fuzzy match (lower priority)
        else if (fuzzyMatch(t.category, lowerQuery)) score += 20;
        else if (fuzzyMatch(t.note, lowerQuery)) score += 15;
        
        // Amount match
        if (t.amount?.toString().includes(lowerQuery)) score += 10;
        
        // Type match
        if (t.type === 'income' && (fuzzyMatch('thu nhập', lowerQuery) || fuzzyMatch('income', lowerQuery))) score += 5;
        if (t.type === 'expense' && (fuzzyMatch('chi tiêu', lowerQuery) || fuzzyMatch('expense', lowerQuery))) score += 5;
        
        return {
          ...t,
          relevanceScore: score
        };
      })
      .filter(t => t.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map(t => ({
        type: 'transaction',
        id: t._id,
        title: t.category,
        subtitle: `${t.note || (t.type === 'income' ? 'Thu nhập' : 'Chi tiêu')} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}`,
        path: '/transactions',
        icon: t.type === 'income' ? '📈' : '📉',
        date: new Date(t.date).toLocaleDateString('vi-VN'),
        matchText: t.category || t.note,
        relevanceScore: t.relevanceScore
      }));

    // Search in categories with relevance scoring
    const categoryResults = (categories || [])
      .map(c => {
        const nameLower = (c.name || '').toLowerCase();
        let score = 0;
        
        if (nameLower === lowerQuery) score += 100;
        else if (nameLower.startsWith(lowerQuery)) score += 80;
        else if (nameLower.includes(lowerQuery)) score += 50;
        else if (fuzzyMatch(c.name, lowerQuery)) score += 20;
        
        if (c.type === 'income' && fuzzyMatch('thu nhập', lowerQuery)) score += 5;
        if (c.type === 'expense' && fuzzyMatch('chi tiêu', lowerQuery)) score += 5;
        
        return { ...c, relevanceScore: score };
      })
      .filter(c => c.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3)
      .map(c => ({
        type: 'category',
        id: c._id,
        title: c.name,
        subtitle: `Danh mục ${c.type === 'income' ? 'thu nhập' : c.type === 'expense' ? 'chi tiêu' : 'cả hai'}`,
        path: '/categories',
        icon: c.icon || '📁',
        matchText: c.name,
        relevanceScore: c.relevanceScore
      }));

    // Search in budgets
    const isBudgetKeyword = fuzzyMatch('ngân sách', lowerQuery) || 
                            fuzzyMatch('budget', lowerQuery) ||
                            fuzzyMatch('chi tiêu', lowerQuery) ||
                            fuzzyMatch('tổng chi', lowerQuery);
    
    const budgetResults = (budgets || [])
      .filter(b => {
        if (isBudgetKeyword) return true;
        const categoryMatch = fuzzyMatch(b.category, lowerQuery) || fuzzyMatch(b.categoryName, lowerQuery);
        const amountMatch = b.amount?.toString().includes(lowerQuery);
        const periodMatch = fuzzyMatch(b.period, lowerQuery);
        return categoryMatch || amountMatch || periodMatch;
      })
      .slice(0, isBudgetKeyword ? 5 : 3)
      .map(b => ({
        type: 'budget',
        id: b._id,
        title: b.category || b.categoryName || 'Tổng ngân sách',
        subtitle: `Ngân sách ${b.period === 'monthly' ? 'tháng' : b.period === 'weekly' ? 'tuần' : 'năm'} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(b.amount)}`,
        path: '/budgets',
        icon: '💰',
        matchText: b.category || b.categoryName || 'Tổng ngân sách'
      }));

    // Search in goals
    const isGoalKeyword = fuzzyMatch('mục tiêu', lowerQuery) || fuzzyMatch('goal', lowerQuery);
    
    const goalResults = (goals || [])
      .filter(g => {
        if (isGoalKeyword) return true;
        const nameMatch = fuzzyMatch(g.name, lowerQuery);
        const amountMatch = g.targetAmount?.toString().includes(lowerQuery) || 
                           g.currentAmount?.toString().includes(lowerQuery);
        const statusMatch = fuzzyMatch(g.status, lowerQuery);
        return nameMatch || amountMatch || statusMatch;
      })
      .slice(0, isGoalKeyword ? 5 : 3)
      .map(g => ({
        type: 'goal',
        id: g._id,
        title: g.name,
        subtitle: `Mục tiêu ${g.status === 'active' ? 'đang thực hiện' : g.status === 'completed' ? 'đã hoàn thành' : 'tạm dừng'} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(g.currentAmount)}/${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(g.targetAmount)}`,
        path: '/goals',
        icon: g.status === 'completed' ? '✅' : '🎯',
        matchText: g.name
      }));

    // Combine results and sort by relevance score
    const allResults = [
      ...transactionResults,
      ...categoryResults,
      ...budgetResults,
      ...goalResults
    ];
    
    // Sort all results by relevance score
    allResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    // Pages always at top if matched
    const finalResults = [
      ...pageResults,
      ...allResults.slice(0, 15) // Limit total results
    ];
    
    console.log('Search Results:', {
      pages: pageResults.length,
      transactions: transactionResults.length,
      categories: categoryResults.length,
      budgets: budgetResults.length,
      goals: goalResults.length,
      total: finalResults.length
    });
    
    setSearchResults(finalResults);
  }, [transactions, categories, budgets, goals]);

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
    navigate(result.path);
    setIsOpen(false);
    setSearchQuery('');
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
          placeholder="Tìm kiếm..."
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
      {isOpen && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111111]
                      rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a2a2a]
                      max-h-96 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {searchResults.length > 0 ? (
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
                      `}>
                        {result.type === 'page' && 'Trang'}
                        {result.type === 'transaction' && 'Giao dịch'}
                        {result.type === 'category' && 'Danh mục'}
                        {result.type === 'budget' && 'Ngân sách'}
                        {result.type === 'goal' && 'Mục tiêu'}
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
                Không tìm thấy kết quả cho "{searchQuery}"
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Thử tìm: giao dịch, danh mục, ngân sách, mục tiêu...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
