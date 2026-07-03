import { useEffect, useState, useCallback, useRef, Fragment } from 'react';
import CurrencyInput from '../components/CurrencyInput';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useWallets } from '../context/WalletContext';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiDownload, FiList, FiCalendar, FiUpload, FiScissors, FiChevronDown, FiChevronRight, FiCornerDownRight, FiX, FiPaperclip, FiExternalLink, FiSearch } from 'react-icons/fi';
import TransactionModal from '../components/TransactionModal';
import SplitTransactionModal from '../components/SplitTransactionModal';
import TransactionCalendar from '../components/TransactionCalendar';
import ImportModal from '../components/ImportModal';
import Pagination from '../components/Pagination';
import { TransactionsPageSkeleton } from '../components/LoadingSkeleton';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import ExportModal from '../components/ExportModal';
import DatePicker from '../components/DatePicker';
import { transactionService } from '../services/transaction.service';
import BulkEditModal from '../components/BulkEditModal';

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, pagination, loading, fetchTransactions, deleteTransaction, unsplitTransaction, bulkDeleteTransactions, bulkUpdateTransactions } = useTransactions();
  const { t, language } = useLanguage();
  const { wallets, fetchWallets } = useWallets();
  const isEnglish = language === 'en';
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [splittingTransaction, setSplittingTransaction] = useState(null);
  const [expandedSplits, setExpandedSplits] = useState(new Set());
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const today = new Date();
  const [calendarMonth, setCalendarMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [filter, setFilter] = useState({
    type: '',
    category: '',
    searchText: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    walletId: '',
    tag: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(() => localStorage.getItem('tx_filter_expanded') === 'true');
  const searchDebounceRef = useRef(null);
  const advDebounceRef = useRef(null);

  const toggleFilterExpanded = () => {
    setIsFilterExpanded(prev => {
      const newVal = !prev;
      localStorage.setItem('tx_filter_expanded', String(newVal));
      return newVal;
    });
  };

  const activeFiltersCount = [
    filter.searchText,
    filter.type,
    filter.walletId,
    filter.category,
    filter.dateFrom,
    filter.dateTo,
    filter.amountFrom,
    filter.amountTo,
    filter.tag
  ].filter(Boolean).length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm(isEnglish ? `Are you sure you want to delete ${selectedIds.length} selected transactions?` : `Bạn có chắc chắn muốn xóa ${selectedIds.length} giao dịch đã chọn?`)) {
      await bulkDeleteTransactions(selectedIds);
      setSelectedIds([]);
      loadTransactions();
    }
  };

  const handleBulkUpdate = async (formData) => {
    await bulkUpdateTransactions(selectedIds, formData);
    setSelectedIds([]);
    loadTransactions();
  };

  // Local state cho advanced filter inputs (để tránh re-render khi gõ)
  const [advLocal, setAdvLocal] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
    tag: '',
  });

  // Gọi API mỗi khi filter / page / viewMode / calendarMonth thay đổi
  const loadTransactions = useCallback(() => {
    if (viewMode === 'calendar') {
      // Calendar mode: lấy toàn bộ giao dịch trong tháng đang xem
      const { year, month } = calendarMonth;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`;
      fetchTransactions({ startDate, endDate, limit: 1000, page: 1 });
      return;
    }
    // List mode: filter + pagination bình thường
    const params = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (filter.type) params.type = filter.type;
    if (filter.category) params.category = filter.category;
    if (filter.searchText) params.search = filter.searchText;
    if (filter.dateFrom) params.startDate = filter.dateFrom;
    if (filter.dateTo) params.endDate = filter.dateTo + 'T23:59:59';
    if (filter.amountFrom) params.amountMin = filter.amountFrom;
    if (filter.amountTo) params.amountMax = filter.amountTo;
    if (filter.walletId) params.walletId = filter.walletId;
    if (filter.tag) params.tag = filter.tag;
    fetchTransactions(params);
  }, [filter, currentPage, itemsPerPage, viewMode, calendarMonth]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    fetchWallets();
  }, []);

  // Thay đổi tháng calendar
  const handleCalendarMonthChange = (year, month) => {
    setCalendarMonth({ year, month });
  };

  // Chuyển view mode
  const switchViewMode = (mode) => {
    setViewMode(mode);
  };

  // Debounce cho ô tìm kiếm chính (400ms)
  const handleSearchChange = (value) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setFilter(prev => ({ ...prev, searchText: value }));
      setCurrentPage(1);
    }, 400);
  };

  // Xử lý thay đổi advanced filter với debounce 500ms để tránh reset trang khi đang gõ
  const handleAdvLocalChange = (key, value) => {
    setAdvLocal(prev => ({ ...prev, [key]: value }));
    if (advDebounceRef.current) clearTimeout(advDebounceRef.current);
    advDebounceRef.current = setTimeout(() => {
      setFilter(prev => ({ ...prev, [key]: value }));
      setCurrentPage(1);
    }, 500);
  };

  // format dữ liệu tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };
  // format số
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };
  // hàm xác nhận muốn xóa hay không
  const handleDelete = async (id) => {
    if (window.confirm(isEnglish ? 'Are you sure you want to delete this transaction?' : 'Bạn có chắc chắn muốn xóa giao dịch này?')) {
      await deleteTransaction(id);
      loadTransactions();
    }
  };
  const handleModalClose = () => {
    setShowModal(false);
    setEditingTransaction(null);
    loadTransactions();
  };
  // Mở modal tách giao dịch
  const handleSplit = (transaction) => {
    setSplittingTransaction(transaction);
    setShowSplitModal(true);
  };
  const handleSplitModalClose = () => {
    setShowSplitModal(false);
    setSplittingTransaction(null);
    loadTransactions();
  };
  // Gỡ tách giao dịch
  const handleUnsplit = async (id) => {
    if (window.confirm(isEnglish ? 'Remove split and return to original transaction?' : 'Gỡ tách và trở về giao dịch gốc?')) {
      await unsplitTransaction(id);
      loadTransactions();
    }
  };
  // Toggle mở/đóng chi tiết tách
  const toggleSplitExpand = (id) => {
    setExpandedSplits(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // Xóa toàn bộ bộ lọc (cả filter state lẫn local advanced state)
  const clearFilters = () => {
    setFilter({ type: '', category: '', searchText: '', dateFrom: '', dateTo: '', amountFrom: '', amountTo: '', walletId: '', tag: '' });
    setAdvLocal({ category: '', dateFrom: '', dateTo: '', amountFrom: '', amountTo: '', tag: '' });
    setCurrentPage(1);
  };
  // hàm dùng cho thay đổi filter type (select) — reset page ngay vì không cần debounce
  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setViewingReceipt(null);
      }
    };
    if (viewingReceipt) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewingReceipt]);

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
  // hàm dùng cho thay đổi số lượng mục hiển thị trên mỗi trang, đồng thời reset về trang đầu tiên để đảm bảo người dùng luôn bắt đầu xem danh sách giao dịch từ đầu khi thay đổi số lượng mục hiển thị trên trang giao dịch. Điều này giúp cải thiện trải nghiệm người dùng bằng cách tránh việc hiển thị một trang trống hoặc không hợp lý sau khi thay đổi số lượng mục hiển thị.  
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };
  // Hàm dùng cho xuất dữ liệu giao dịch hiện tại ra file PDF, giúp người dùng có thể lưu trữ hoặc chia sẻ thông tin giao dịch của mình một cách dễ dàng và thuận tiện trên trang giao dịch. Khi người dùng nhấn nút xuất PDF, hàm này sẽ được gọi để tạo file PDF chứa danh sách các giao dịch hiện tại và cung cấp tùy chọn tải xuống cho người dùng.
  const pageIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const pageExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const pageBalance = pageIncome - pageExpense;

  // Handle transaction report export
  const handleExport = async ({ format, groupBy, scope, dateFrom, dateTo }) => {
    let exportData = [];
    if (scope === 'all') {
      // Build filter parameters for fetching all filtered transactions (limit: -1)
      const params = { limit: -1 };
      if (filter.type) params.type = filter.type;
      if (filter.category) params.category = filter.category;
      if (filter.searchText) params.search = filter.searchText;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo + 'T23:59:59';
      if (filter.amountFrom) params.amountMin = filter.amountFrom;
      if (filter.amountTo) params.amountMax = filter.amountTo;
      if (filter.walletId) params.walletId = filter.walletId;
      if (filter.tag) params.tag = filter.tag;

      try {
        const response = await transactionService.getTransactions(params);
        exportData = response.data;
      } catch (error) {
        console.error('Failed to fetch transactions for export:', error);
        return;
      }
    } else {
      exportData = transactions;
      if (dateFrom || dateTo) {
        exportData = exportData.filter(t => {
          const txDate = t.date.substring(0, 10); // 'YYYY-MM-DD'
          if (dateFrom && txDate < dateFrom) return false;
          if (dateTo && txDate > dateTo) return false;
          return true;
        });
      }
    }

    if (format === 'pdf') {
      await exportToPDF(exportData, user, groupBy);
    } else {
      await exportToExcel(exportData, user, groupBy);
    }
  };

  if (loading && transactions.length === 0) {
    return <TransactionsPageSkeleton />;
  }

  return (
    <div className={`tx-layout-grid ${viewMode === 'list' ? 'tx-layout-list' : 'tx-layout-calendar'}`}>
      <div className="tx-area-header">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{isEnglish ? 'Transactions' : 'Giao dịch'}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{isEnglish ? 'Manage your income and expense transactions' : 'Quản lý các giao dịch thu chi'}</p>
          </div>
          <div className="tx-header-actions flex gap-2 flex-wrap">
            {/* View toggle */}
            <div className="tx-view-toggle flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5">
              <button
                onClick={() => switchViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'list'
                  ? 'bg-[#FFFCF5] dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <FiList size={15} /> {isEnglish ? 'List' : 'Danh sách'}
              </button>
              <button
                onClick={() => switchViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${viewMode === 'calendar'
                  ? 'bg-[#FFFCF5] dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                <FiCalendar size={15} /> {isEnglish ? 'Calendar' : 'Lịch'}
              </button>
            </div>

            {/* Filter Toggle Button for Mobile/Tablet */}
            {viewMode === 'list' && (
              <button
                onClick={toggleFilterExpanded}
                className="xl:hidden btn btn-secondary flex items-center gap-2 relative"
                title={isEnglish ? 'Filters' : 'Bộ lọc'}
              >
                <FiFilter size={16} />
                <span>{isEnglish ? 'Filters' : 'Bộ lọc'}</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#003d2d] dark:bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#0a0a0a]">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            )}

            {/* Export buttons */}
            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-secondary flex items-center gap-2"
              disabled={pagination.total === 0}
            >
              <FiDownload /> {isEnglish ? 'Export' : 'Xuất báo cáo'}
            </button>

            {/* Import */}
            <button
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary flex items-center gap-2"
              title={isEnglish ? 'Import from CSV/Excel' : 'Import từ CSV/Excel'}
            >
              <FiUpload size={16} /> Import
            </button>

            {/* Add Transaction — hiển thị trên mọi màn hình */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00523d] w-full sm:w-auto justify-center"
            >
              <FiPlus /> {isEnglish ? 'Add' : 'Thêm mới'}
            </button>
          </div>
        </div>
      </div>

      {/* ── CALENDAR VIEW ── */}
      {viewMode === 'calendar' && (
        <div className="tx-area-calendar">
          <TransactionCalendar
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            calendarMonth={calendarMonth}
            onMonthChange={handleCalendarMonthChange}
            formatCurrency={formatCurrency}
            loading={loading}
          />
        </div>
      )}

      {/* ── LIST VIEW: Filters ── */}
      {viewMode === 'list' && (
        <div className="tx-area-summary grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#d5e3d6] dark:border-[#243126] bg-[#FFFCF5]/95 dark:bg-[#111111] p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isEnglish ? 'Income (current page)' : 'Thu nhập (trang hiện tại)'}</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pageIncome)}</p>
          </div>
          <div className="rounded-2xl border border-[#d5e3d6] dark:border-[#243126] bg-[#FFFCF5]/95 dark:bg-[#111111] p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isEnglish ? 'Expense (current page)' : 'Chi tiêu (trang hiện tại)'}</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(pageExpense)}</p>
          </div>
          <div className="rounded-2xl border border-[#d5e3d6] dark:border-[#243126] bg-[#FFFCF5]/95 dark:bg-[#111111] p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isEnglish ? 'Balance (current page)' : 'Chênh lệch (trang hiện tại)'}</p>
            <p className={`text-lg font-bold ${pageBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(pageBalance)}
            </p>
          </div>
        </div>
      )}

      {/* ── LIST VIEW: Filters Backdrop (Mobile only) ── */}
      {viewMode === 'list' && isFilterExpanded && (
        <div 
          className="tx-filter-backdrop is-visible xl:hidden"
          onClick={toggleFilterExpanded}
        />
      )}

      {/* ── LIST VIEW: Filters ── */}
      {viewMode === 'list' && (
        <div 
          className={`tx-area-filters card tx-filter-card ${isFilterExpanded ? 'is-expanded' : 'is-collapsed'}`}
          onClick={() => {
            if (!isFilterExpanded && window.innerWidth >= 1280) {
              toggleFilterExpanded();
            }
          }}
        >
          {/* Collapsed view content (vertical stripe) */}
          <div className="tx-filter-collapsed-content">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFilterExpanded();
              }}
              className="tx-filter-toggle-btn"
              title={isEnglish ? 'Expand filters' : 'Mở rộng bộ lọc'}
            >
              <FiFilter size={18} />
              {activeFiltersCount > 0 && (
                <span className="tx-filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            {/* Search Icon indicator */}
            <div 
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer p-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleFilterExpanded();
              }}
              title={isEnglish ? 'Search & Filters' : 'Tìm kiếm & Bộ lọc'}
            >
              <FiSearch size={16} />
            </div>

            {/* Vertical text label */}
            <div 
              className="tx-filter-vertical-text text-[9px] font-extrabold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 select-none cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleFilterExpanded();
              }}
            >
              {isEnglish ? 'Search & Filters' : 'Tìm kiếm & Bộ lọc'}
            </div>
            
            <div className="tx-filter-quick-indicators">
              {filter.searchText && (
                <div 
                  className="indicator-dot" 
                  title={`${isEnglish ? 'Search text active' : 'Đang tìm kiếm'}: ${filter.searchText}`} 
                />
              )}
              {filter.type && (
                <div 
                  className="indicator-dot type" 
                  title={`${isEnglish ? 'Type' : 'Loại'}: ${filter.type === 'income' ? (isEnglish ? 'Income' : 'Thu nhập') : filter.type === 'expense' ? (isEnglish ? 'Expense' : 'Chi tiêu') : (isEnglish ? 'Transfer' : 'Chuyển khoản')}`} 
                />
              )}
              {filter.walletId && (
                <div 
                  className="indicator-dot wallet" 
                  title={isEnglish ? 'Wallet filter active' : 'Đang lọc theo ví'} 
                />
              )}
              {(filter.category || filter.dateFrom || filter.dateTo || filter.amountFrom || filter.amountTo) && (
                <div 
                  className="indicator-dot advanced" 
                  title={isEnglish ? 'Advanced filters active' : 'Bộ lọc nâng cao đang bật'} 
                />
              )}
            </div>
          </div>

          {/* Expanded view content */}
          <div className="tx-filter-expanded-content space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <FiFilter className="text-[#003d2d] dark:text-emerald-500" />
                <span className="font-bold text-gray-855 dark:text-gray-200">
                  {isEnglish ? 'Filters' : 'Bộ lọc'}
                </span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#003d2d]/10 dark:bg-emerald-500/20 text-[#003d2d] dark:text-emerald-400 text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilterExpanded();
                }}
                className="tx-filter-close-btn"
                title={isEnglish ? 'Collapse' : 'Thu gọn'}
              >
                <FiChevronRight size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="tx-filter-grid">
                <div className="tx-filter-search">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{isEnglish ? 'Search' : 'Tìm kiếm'}</label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={isEnglish ? 'Category or note...' : 'Danh mục hoặc ghi chú...'}
                      defaultValue={filter.searchText}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="input pl-10 w-full"
                    />
                  </div>
                </div>

                <div className="tx-filter-type">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{isEnglish ? 'Transaction Type' : 'Loại giao dịch'}</label>
                  <select
                    value={filter.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">{isEnglish ? 'All types' : 'Tất cả loại'}</option>
                    <option value="income">{isEnglish ? 'Income' : 'Thu nhập'}</option>
                    <option value="expense">{isEnglish ? 'Expense' : 'Chi tiêu'}</option>
                    <option value="transfer">{isEnglish ? 'Transfer' : 'Chuyển khoản'}</option>
                  </select>
                </div>

                <div className="tx-filter-wallet">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{isEnglish ? 'Wallet' : 'Tài khoản ví'}</label>
                  <select
                    value={filter.walletId}
                    onChange={(e) => handleFilterChange('walletId', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">{isEnglish ? 'All wallets' : 'Tất cả ví'}</option>
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.icon} {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="tx-filter-actions">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{isEnglish ? 'Actions' : 'Hành động'}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className="btn btn-secondary w-full"
                    >
                      {showAdvancedFilters
                        ? (isEnglish ? 'Hide advanced' : 'Ẩn nâng cao')
                        : (isEnglish ? 'Advanced filters' : 'Bộ lọc nâng cao')}
                    </button>
                    <button onClick={clearFilters} className="btn btn-secondary w-full">
                      {isEnglish ? 'Clear filters' : 'Xóa bộ lọc'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="tx-filter-advanced-grid pt-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Category text search */}
                  <div className="tx-adv-category">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isEnglish ? 'Category' : 'Danh mục'}</label>
                    <input
                      type="text"
                      placeholder={isEnglish ? 'Enter category name...' : 'Nhập tên danh mục...'}
                      value={advLocal.category}
                      onChange={(e) => handleAdvLocalChange('category', e.target.value)}
                      className="input w-full"
                    />
                  </div>

                  {/* Tag text search */}
                  <div className="tx-adv-tag">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isEnglish ? 'Tag / Label' : 'Tag / Nhãn'}</label>
                    <input
                      type="text"
                      placeholder={isEnglish ? 'Enter tag (e.g. du lịch)...' : 'Nhập tag (VD: du lịch)...'}
                      value={advLocal.tag}
                      onChange={(e) => handleAdvLocalChange('tag', e.target.value)}
                      className="input w-full"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="tx-adv-date">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isEnglish ? 'Date range' : 'Khoảng thời gian'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <DatePicker
                        value={advLocal.dateFrom}
                        onChange={(val) => handleAdvLocalChange('dateFrom', val)}
                        style={{ minWidth: '145px', flex: '1 1 145px' }}
                      />
                      <span className="self-center text-gray-500 shrink-0">-</span>
                      <DatePicker
                        value={advLocal.dateTo}
                        onChange={(val) => handleAdvLocalChange('dateTo', val)}
                        style={{ minWidth: '145px', flex: '1 1 145px' }}
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div className="tx-adv-amount">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isEnglish ? 'Amount range' : 'Khoảng số tiền'}
                    </label>
                    <div className="flex items-center gap-2 min-w-0">
                      <CurrencyInput
                        value={advLocal.amountFrom}
                        onChange={(val) => handleAdvLocalChange('amountFrom', val)}
                        placeholder={isEnglish ? 'From' : 'Từ'}
                        className="flex-1 min-w-0"
                      />
                      <span className="self-center text-gray-500 shrink-0">-</span>
                      <CurrencyInput
                        value={advLocal.amountTo}
                        onChange={(val) => handleAdvLocalChange('amountTo', val)}
                        placeholder={isEnglish ? 'To' : 'Đến'}
                        className="flex-1 min-w-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isEnglish ? 'Showing' : 'Hiển thị'}{' '}
                <span className="font-semibold">{transactions.length}</span> /{' '}
                <span className="font-semibold">{pagination.total}</span> {isEnglish ? 'transactions' : 'giao dịch'}
                {loading && <span className="ml-2 text-xs text-gray-400">{isEnglish ? '(loading...)' : '(đang tải...)'}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW: Transactions List ── */}
      {viewMode === 'list' && (
        <div className="tx-area-table card tx-table-card">
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-[#003d2d]/10 dark:bg-emerald-500/10 border border-[#003d2d]/20 dark:border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 text-sm font-semibold text-[#003d2d] dark:text-emerald-400">
                <span>{isEnglish ? `${selectedIds.length} items selected` : `Đã chọn ${selectedIds.length} giao dịch`}</span>
                <button onClick={() => setSelectedIds([])} className="text-xs underline hover:text-gray-700 dark:hover:text-gray-300">
                  {isEnglish ? 'Deselect all' : 'Bỏ chọn tất cả'}
                </button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowBulkEditModal(true)}
                  className="btn btn-secondary flex items-center gap-2 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 w-full sm:w-auto justify-center"
                >
                  <FiEdit2 size={16} /> {isEnglish ? 'Bulk Edit' : 'Sửa hàng loạt'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="btn btn-secondary flex items-center gap-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto justify-center"
                >
                  <FiTrash2 size={16} /> {isEnglish ? 'Bulk Delete' : 'Xóa hàng loạt'}
                </button>
              </div>
            </div>
          )}
          {transactions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="py-3 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={transactions.length > 0 && selectedIds.length === transactions.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded text-[#003d2d] dark:text-emerald-500 focus:ring-[#003d2d] dark:focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Date' : 'Ngày'}</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Type' : 'Loại'}</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Category' : 'Danh mục'}</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Note' : 'Ghi chú'}</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                      <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Actions' : 'Thao tác'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => {
                      const hasSplit = transaction.splitChildren && transaction.splitChildren.length > 0;
                      const isExpanded = expandedSplits.has(transaction.id);
                      const isSelected = selectedIds.includes(transaction.id);
                      let txTags = [];
                      if (transaction.tags) {
                        if (Array.isArray(transaction.tags)) txTags = transaction.tags;
                        else try { txTags = JSON.parse(transaction.tags); } catch { txTags = transaction.tags.split(',').map(t => t.trim()).filter(Boolean); }
                      }
                      return (
                        <Fragment key={transaction.id}>
                          <tr className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isSelected ? 'bg-[#003d2d]/5 dark:bg-emerald-500/10' : hasSplit ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}>
                            <td className="py-3 px-4 w-12 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectItem(transaction.id)}
                                className="w-4 h-4 rounded text-[#003d2d] dark:text-emerald-500 focus:ring-[#003d2d] dark:focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                              <div className="flex items-center gap-1.5">
                                {/* Nút expand nếu đã tách */}
                                {hasSplit && (
                                  <button onClick={() => toggleSplitExpand(transaction.id)} className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded transition">
                                    {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                                  </button>
                                )}
                                {formatDate(transaction.date)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={
                                  transaction.type === 'income'
                                    ? 'badge-income'
                                    : transaction.type === 'expense'
                                      ? 'badge-expense'
                                      : 'badge-transfer'
                                }>
                                  {transaction.type === 'income'
                                    ? (isEnglish ? 'Income' : 'Thu nhập')
                                    : transaction.type === 'expense'
                                      ? (isEnglish ? 'Expense' : 'Chi tiêu')
                                      : (isEnglish ? 'Transfer' : 'Chuyển khoản')}
                                </span>
                                {hasSplit && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                                    <FiScissors size={9} /> {isEnglish ? 'Split' : 'Đã tách'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                              <div className="flex flex-col">
                                <span className="font-medium">{transaction.category}</span>
                                {transaction.wallet && (
                                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                    <span>{transaction.wallet.icon}</span>
                                    <span>{transaction.wallet.name}</span>
                                    {transaction.type === 'transfer' && transaction.toWallet && (
                                      <>
                                        <span className="text-gray-400">→</span>
                                        <span>{transaction.toWallet.icon}</span>
                                        <span>{transaction.toWallet.name}</span>
                                      </>
                                    )}
                                  </span>
                                )}
                                {txTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {txTags.map((tag, i) => (
                                      <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className="line-clamp-2" title={transaction.note}>{transaction.note || '-'}</span>
                                {transaction.receiptUrl && (
                                  <div 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingReceipt(transaction);
                                    }} 
                                    className="cursor-pointer overflow-hidden rounded border border-gray-200 dark:border-gray-700 w-8 h-8 flex-shrink-0 hover:border-emerald-500 transition-colors" 
                                    title={isEnglish ? "View Receipt" : "Xem hóa đơn"}
                                  >
                                    <img src={transaction.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className={`py-3 px-4 text-right font-semibold ${transaction.type === 'income'
                              ? 'text-green-600 dark:text-green-400'
                              : transaction.type === 'expense'
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-blue-600 dark:text-blue-400'
                              }`}>
                              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '⇆ '}
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-1">
                                {/* Nút tách (chỉ cho income/expense chưa tách) */}
                                {!hasSplit && transaction.type !== 'transfer' && (
                                  <button
                                    onClick={() => handleSplit(transaction)}
                                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                                    title={isEnglish ? 'Split transaction' : 'Tách giao dịch'}
                                  >
                                    <FiScissors size={16} />
                                  </button>
                                )}
                                {/* Nút gỡ tách */}
                                {hasSplit && (
                                  <button
                                    onClick={() => handleUnsplit(transaction.id)}
                                    className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition"
                                    title={isEnglish ? 'Unsplit' : 'Gỡ tách'}
                                  >
                                    <FiX size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(transaction)}
                                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(transaction.id)}
                                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {/* Hiển thị các phần tách con khi expand */}
                          {hasSplit && isExpanded && transaction.splitChildren.map((child) => (
                            <tr key={child.id} className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/20">
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4"></td>
                              <td className="py-2 px-4 text-gray-600 dark:text-gray-400 text-sm">
                                <span className="flex items-center gap-1.5">
                                  <FiCornerDownRight size={12} className="text-emerald-500" />
                                  {child.category}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-gray-500 dark:text-gray-500 text-xs">
                                {child.note || '-'}
                              </td>
                              <td className={`py-2 px-4 text-right text-sm font-medium ${transaction.type === 'income' ? 'text-green-500 dark:text-green-500' : 'text-red-500 dark:text-red-500'}`}>
                                {formatCurrency(child.amount)}
                              </td>
                              <td className="py-2 px-4"></td>
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((transaction) => {
                  const hasSplit = transaction.splitChildren && transaction.splitChildren.length > 0;
                  const isExpanded = expandedSplits.has(transaction.id);
                  const isSelected = selectedIds.includes(transaction.id);
                  let txTags = [];
                  if (transaction.tags) {
                    if (Array.isArray(transaction.tags)) txTags = transaction.tags;
                    else try { txTags = JSON.parse(transaction.tags); } catch { txTags = transaction.tags.split(',').map(t => t.trim()).filter(Boolean); }
                  }
                  return (
                    <div key={transaction.id} className={`py-3 px-2 flex flex-col gap-2 rounded-xl ${isSelected ? 'bg-[#003d2d]/5 dark:bg-emerald-500/10' : hasSplit ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectItem(transaction.id)}
                            className="w-4 h-4 rounded text-[#003d2d] dark:text-emerald-500 focus:ring-[#003d2d] dark:focus:ring-emerald-500 cursor-pointer"
                          />
                          {hasSplit && (
                            <button onClick={() => toggleSplitExpand(transaction.id)} className="p-0.5 text-emerald-600 dark:text-emerald-400">
                              {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                            </button>
                          )}
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                              {transaction.note || transaction.category}
                              {hasSplit && (
                                <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-semibold">
                                  <FiScissors size={8} /> {transaction.splitChildren.length}
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-black ${transaction.type === 'income'
                          ? 'text-green-600 dark:text-green-400'
                          : transaction.type === 'expense'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                          }`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '⇆ '}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {transaction.category}
                          </span>
                          {transaction.wallet && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <span>{transaction.wallet.icon}</span>
                              <span>{transaction.wallet.name}</span>
                              {transaction.type === 'transfer' && transaction.toWallet && (
                                <>
                                  <span>→</span>
                                  <span>{transaction.toWallet.icon}</span>
                                  <span>{transaction.toWallet.name}</span>
                                </>
                              )}
                            </span>
                          )}
                          {txTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {txTags.map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-medium">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className={
                            transaction.type === 'income'
                              ? 'badge-income text-[9px] px-2 py-0.5'
                              : transaction.type === 'expense'
                                ? 'badge-expense text-[9px] px-2 py-0.5'
                                : 'badge-transfer text-[9px] px-2 py-0.5'
                          }>
                            {transaction.type === 'income'
                              ? (isEnglish ? 'Income' : 'Thu nhập')
                              : transaction.type === 'expense'
                                ? (isEnglish ? 'Expense' : 'Chi tiêu')
                                : (isEnglish ? 'Transfer' : 'Chuyển khoản')}
                          </span>
                          {transaction.receiptUrl && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingReceipt(transaction);
                              }} 
                              className="cursor-pointer overflow-hidden rounded border border-gray-200 dark:border-gray-700 w-6 h-6 flex-shrink-0 hover:border-emerald-500 transition-colors" 
                              title={isEnglish ? "View Receipt" : "Xem hóa đơn"}
                            >
                              <img src={transaction.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                            </div>
                          )}
                          {!hasSplit && transaction.type !== 'transfer' && (
                            <button onClick={() => handleSplit(transaction)} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition">
                              <FiScissors size={14} />
                            </button>
                          )}
                          {hasSplit && (
                            <button onClick={() => handleUnsplit(transaction.id)} className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition">
                              <FiX size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Chi tiết các phần tách (mobile) */}
                      {hasSplit && isExpanded && (
                        <div className="ml-4 mt-1 space-y-1.5 border-l-2 border-emerald-200 dark:border-emerald-800 pl-3">
                          {transaction.splitChildren.map((child) => (
                            <div key={child.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                <FiCornerDownRight size={10} className="text-emerald-500" />
                                {child.category}
                                {child.note && <span className="text-gray-400">- {child.note}</span>}
                              </span>
                              <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(child.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={goToPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={pagination.total}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {loading
                  ? (isEnglish ? 'Loading...' : 'Đang tải...')
                  : (isEnglish ? 'No transactions yet' : 'Chưa có giao dịch nào')}
              </p>
              {!loading && (
                <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
                  {isEnglish ? 'Add your first transaction' : 'Thêm giao dịch đầu tiên'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={handleModalClose}
          isOpen={showModal}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={loadTransactions}
      />

      {/* Split Transaction Modal */}
      {showSplitModal && (
        <SplitTransactionModal
          transaction={splittingTransaction}
          onClose={handleSplitModalClose}
          isOpen={showSplitModal}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          transactions={transactions}
          user={user}
          onExport={handleExport}
          totalFilteredCount={pagination.total}
          filterDateFrom={filter.dateFrom}
          filterDateTo={filter.dateTo}
        />
      )}

      {/* Receipt Image Preview Modal (Lightbox) */}
      {viewingReceipt && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md animate-modal-fade"
          onClick={() => setViewingReceipt(null)}
        >
          {/* Modal Content container */}
          <div 
            className="relative max-w-4xl w-[90%] md:w-auto max-h-[85vh] flex flex-col items-center justify-center animate-modal-scale"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setViewingReceipt(null)}
              className="absolute -top-12 right-0 md:-right-12 text-white hover:text-emerald-400 p-2 bg-black/40 rounded-full hover:bg-black/60 transition duration-200 flex items-center justify-center"
              title={isEnglish ? "Close" : "Đóng"}
            >
              <FiX size={24} />
            </button>

            {/* Image display */}
            <div className="relative group overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 shadow-2xl flex items-center justify-center p-1">
              <img
                src={viewingReceipt.receiptUrl}
                alt="Receipt Full View"
                className="max-h-[60vh] md:max-h-[70vh] max-w-full md:max-w-3xl object-contain rounded-lg transition-transform duration-300 hover:scale-[1.02]"
              />
            </div>

            {/* Transaction Context Card */}
            <div className="mt-4 w-full max-w-lg bg-white/10 dark:bg-black/45 backdrop-blur-lg border border-white/10 rounded-xl p-4 text-white text-center shadow-lg">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {viewingReceipt.category}
                </span>
                <span className="text-xs text-neutral-300">
                  {formatDate(viewingReceipt.date)}
                </span>
              </div>
              <p className="text-sm font-medium line-clamp-2 mb-2 text-neutral-100">
                {viewingReceipt.note || (isEnglish ? "No note details" : "Không có chi tiết ghi chú")}
              </p>
              <div className="flex justify-between items-center border-t border-white/10 pt-2">
                <span className="text-sm font-semibold text-neutral-200">
                  {formatCurrency(viewingReceipt.amount)}
                </span>
                <div className="flex gap-2">
                  <a
                    href={viewingReceipt.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-medium transition duration-200"
                  >
                    <FiExternalLink size={12} /> {isEnglish ? "Open Original" : "Mở ảnh gốc"}
                  </a>
                  <a
                    href={viewingReceipt.receiptUrl}
                    download={`receipt_${viewingReceipt.id}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#003d2d] hover:bg-[#00523d] text-white rounded-lg text-xs font-medium transition duration-200"
                  >
                    <FiDownload size={12} /> {isEnglish ? "Download" : "Tải xuống"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      <BulkEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedIds={selectedIds}
        onBulkUpdate={handleBulkUpdate}
      />
    </div>
  );
};

export default Transactions;