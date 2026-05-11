import { useEffect, useState, useCallback, useRef } from 'react';
import CurrencyInput from '../components/CurrencyInput';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiDownload, FiList, FiCalendar, FiUpload } from 'react-icons/fi';
import TransactionModal from '../components/TransactionModal';
import TransactionCalendar from '../components/TransactionCalendar';
import ImportModal from '../components/ImportModal';
import Pagination from '../components/Pagination';
import { TransactionsPageSkeleton } from '../components/LoadingSkeleton';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, pagination, loading, fetchTransactions, deleteTransaction } = useTransactions();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
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
    amountTo: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const searchDebounceRef = useRef(null);
  const advDebounceRef = useRef(null);

  // Local state cho advanced filter inputs (để tránh re-render khi gõ)
  const [advLocal, setAdvLocal] = useState({
    category: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: '',
  });

  // Gọi API mỗi khi filter / page / viewMode / calendarMonth thay đổi
  const loadTransactions = useCallback(() => {
    if (viewMode === 'calendar') {
      // Calendar mode: lấy toàn bộ giao dịch trong tháng đang xem
      const { year, month } = calendarMonth;
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay   = new Date(year, month, 0).getDate();
      const endDate   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59`;
      fetchTransactions({ startDate, endDate, limit: 1000, page: 1 });
      return;
    }
    // List mode: filter + pagination bình thường
    const params = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (filter.type)        params.type       = filter.type;
    if (filter.category)    params.category   = filter.category;
    if (filter.searchText)  params.search     = filter.searchText;
    if (filter.dateFrom)    params.startDate  = filter.dateFrom;
    if (filter.dateTo)      params.endDate    = filter.dateTo + 'T23:59:59';
    if (filter.amountFrom)  params.amountMin  = filter.amountFrom;
    if (filter.amountTo)    params.amountMax  = filter.amountTo;
    fetchTransactions(params);
  }, [filter, currentPage, itemsPerPage, viewMode, calendarMonth]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

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
  // Xóa toàn bộ bộ lọc (cả filter state lẫn local advanced state)
  const clearFilters = () => {
    setFilter({ type: '', category: '', searchText: '', dateFrom: '', dateTo: '', amountFrom: '', amountTo: '' });
    setAdvLocal({ category: '', dateFrom: '', dateTo: '', amountFrom: '', amountTo: '' });
    setCurrentPage(1);
  };
  // hàm dùng cho thay đổi filter type (select) — reset page ngay vì không cần debounce
  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, pagination.totalPages)));
// hàm dùng cho thay đổi số lượng mục hiển thị trên mỗi trang, đồng thời reset về trang đầu tiên để đảm bảo người dùng luôn bắt đầu xem danh sách giao dịch từ đầu khi thay đổi số lượng mục hiển thị trên trang giao dịch. Điều này giúp cải thiện trải nghiệm người dùng bằng cách tránh việc hiển thị một trang trống hoặc không hợp lý sau khi thay đổi số lượng mục hiển thị.  
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };
  // Hàm dùng cho xuất dữ liệu giao dịch hiện tại ra file PDF, giúp người dùng có thể lưu trữ hoặc chia sẻ thông tin giao dịch của mình một cách dễ dàng và thuận tiện trên trang giao dịch. Khi người dùng nhấn nút xuất PDF, hàm này sẽ được gọi để tạo file PDF chứa danh sách các giao dịch hiện tại và cung cấp tùy chọn tải xuống cho người dùng.
  const pageIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const pageExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const pageBalance = pageIncome - pageExpense;

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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <FiList size={15} /> {isEnglish ? 'List' : 'Danh sách'}
              </button>
              <button
                onClick={() => switchViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <FiCalendar size={15} /> {isEnglish ? 'Calendar' : 'Lịch'}
              </button>
            </div>

            {/* Export buttons */}
            <div className="tx-export-group flex gap-2">
              <button
                onClick={() => exportToPDF(transactions, user)}
                className="btn btn-secondary flex items-center gap-2"
                disabled={transactions.length === 0}
              >
                <FiDownload /> PDF
              </button>
              <button
                onClick={() => exportToExcel(transactions, user)}
                className="btn btn-secondary flex items-center gap-2"
                disabled={transactions.length === 0}
              >
                <FiDownload /> Excel
              </button>
            </div>

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
        <div className="rounded-2xl border border-[#d5e3d6] dark:border-[#243126] bg-white/95 dark:bg-[#111111] p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isEnglish ? 'Income (current page)' : 'Thu nhập (trang hiện tại)'}</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pageIncome)}</p>
        </div>
        <div className="rounded-2xl border border-[#d5e3d6] dark:border-[#243126] bg-white/95 dark:bg-[#111111] p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isEnglish ? 'Expense (current page)' : 'Chi tiêu (trang hiện tại)'}</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(pageExpense)}</p>
        </div>
        <div className="rounded-2xl border border-[#d5e3d6] dark:border-[#243126] bg-white/95 dark:bg-[#111111] p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isEnglish ? 'Balance (current page)' : 'Chênh lệch (trang hiện tại)'}</p>
          <p className={`text-lg font-bold ${pageBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(pageBalance)}
          </p>
        </div>
      </div>
      )}

      {/* ── LIST VIEW: Filters ── */}
      {viewMode === 'list' && (
      <div className="tx-area-filters card tx-filter-card">
        <div className="space-y-4">
          <div className="tx-filter-grid">
            <div className="tx-filter-search">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{isEnglish ? 'Search' : 'Tìm kiếm'}</label>
              <div className="relative">
                <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
              </select>
            </div>

            <div className="tx-filter-actions">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{isEnglish ? 'Actions' : 'Hành động'}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

              {/* Date Range */}
              <div className="tx-adv-date">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isEnglish ? 'Date range' : 'Khoảng thời gian'}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={advLocal.dateFrom}
                    onChange={(e) => handleAdvLocalChange('dateFrom', e.target.value)}
                    className="input"
                    style={{ minWidth: '145px', flex: '1 1 145px' }}
                  />
                  <span className="self-center text-gray-500 shrink-0">-</span>
                  <input
                    type="date"
                    value={advLocal.dateTo}
                    onChange={(e) => handleAdvLocalChange('dateTo', e.target.value)}
                    className="input"
                    style={{ minWidth: '145px', flex: '1 1 145px' }}
                  />
                </div>
              </div>

              {/* Amount Range — dùng CurrencyInput để hiển thị định dạng 1.111.111đ */}
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
      )}

      {/* ── LIST VIEW: Transactions List ── */}
      {viewMode === 'list' && (
      <div className="tx-area-table card tx-table-card">
        {transactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Date' : 'Ngày'}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Type' : 'Loại'}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Category' : 'Danh mục'}</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Note' : 'Ghi chú'}</th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Amount' : 'Số tiền'}</th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">{isEnglish ? 'Actions' : 'Thao tác'}</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={transaction.type === 'income' ? 'badge-income' : 'badge-expense'}>
                          {transaction.type === 'income'
                            ? (isEnglish ? 'Income' : 'Thu nhập')
                            : (isEnglish ? 'Expense' : 'Chi tiêu')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{transaction.category}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {transaction.note || '-'}
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${
                        transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction._id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
    </div>
  );
};

export default Transactions;