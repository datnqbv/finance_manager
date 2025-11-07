import { useEffect, useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiDownload } from 'react-icons/fi';
import TransactionModal from '../components/TransactionModal';
import Pagination from '../components/Pagination';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';

const Transactions = () => {
  const { user } = useAuth();
  const { transactions, loading, fetchTransactions, deleteTransaction } = useTransactions();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
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

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      await deleteTransaction(id);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTransaction(null);
  };

  const filteredTransactions = transactions.filter((t) => {
    // Filter by type
    if (filter.type && t.type !== filter.type) return false;
    
    // Filter by category
    if (filter.category && t.category !== filter.category) return false;
    
    // Filter by search text (search in category and note)
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      const matchCategory = t.category.toLowerCase().includes(searchLower);
      const matchNote = t.note?.toLowerCase().includes(searchLower);
      if (!matchCategory && !matchNote) return false;
    }
    
    // Filter by date range
    if (filter.dateFrom) {
      const transactionDate = new Date(t.date);
      const fromDate = new Date(filter.dateFrom);
      if (transactionDate < fromDate) return false;
    }
    if (filter.dateTo) {
      const transactionDate = new Date(t.date);
      const toDate = new Date(filter.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      if (transactionDate > toDate) return false;
    }
    
    // Filter by amount range
    if (filter.amountFrom && t.amount < parseFloat(filter.amountFrom)) return false;
    if (filter.amountTo && t.amount > parseFloat(filter.amountTo)) return false;
    
    return true;
  });

  const clearFilters = () => {
    setFilter({
      type: '',
      category: '',
      searchText: '',
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: ''
    });
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page
  };

  const categories = [...new Set(transactions.map((t) => t.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Giao dịch</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Quản lý các giao dịch thu chi</p>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <button
              onClick={() => exportToPDF(filteredTransactions, user)}
              className="btn btn-secondary flex items-center gap-2"
              disabled={filteredTransactions.length === 0}
            >
              <FiDownload /> PDF
            </button>
          </div>
          <div className="relative group">
            <button
              onClick={() => exportToExcel(filteredTransactions, user)}
              className="btn btn-secondary flex items-center gap-2"
              disabled={filteredTransactions.length === 0}
            >
              <FiDownload /> Excel
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <FiPlus /> Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="space-y-4">
          {/* Basic Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <FiFilter className="text-gray-400" />
            
            {/* Search */}
            <input
              type="text"
              placeholder="Tìm kiếm theo danh mục hoặc ghi chú..."
              value={filter.searchText}
              onChange={(e) => setFilter({ ...filter, searchText: e.target.value })}
              className="input flex-1 min-w-[200px]"
            />
            
            {/* Type Filter */}
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="input w-40"
            >
              <option value="">Tất cả loại</option>
              <option value="income">Thu nhập</option>
              <option value="expense">Chi tiêu</option>
            </select>
            
            {/* Category Filter */}
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="input w-48"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            
            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="btn btn-secondary"
            >
              {showAdvancedFilters ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao'}
            </button>
            
            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="btn btn-secondary"
            >
              Xóa bộ lọc
            </button>
          </div>
          
          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Khoảng thời gian
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filter.dateFrom}
                    onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                    className="input flex-1"
                    placeholder="Từ ngày"
                  />
                  <span className="self-center text-gray-500">-</span>
                  <input
                    type="date"
                    value={filter.dateTo}
                    onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                    className="input flex-1"
                    placeholder="Đến ngày"
                  />
                </div>
              </div>
              
              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Khoảng số tiền
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filter.amountFrom}
                    onChange={(e) => setFilter({ ...filter, amountFrom: e.target.value })}
                    className="input flex-1"
                    placeholder="Từ"
                    min="0"
                  />
                  <span className="self-center text-gray-500">-</span>
                  <input
                    type="number"
                    value={filter.amountTo}
                    onChange={(e) => setFilter({ ...filter, amountTo: e.target.value })}
                    className="input flex-1"
                    placeholder="Đến"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Results Count */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Hiển thị <span className="font-semibold">{filteredTransactions.length}</span> / {transactions.length} giao dịch
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="card">
        {filteredTransactions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Ngày</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Loại</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Danh mục</th>
                    <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Ghi chú</th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Số tiền</th>
                    <th className="text-right py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            transaction.type === 'income' ? 'badge-income' : 'badge-expense'
                          }
                        >
                          {transaction.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{transaction.category}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {transaction.note || '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}
                      >
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
              totalPages={totalPages}
              onPageChange={goToPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              totalItems={filteredTransactions.length}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Chưa có giao dịch nào</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary mt-4"
            >
              Thêm giao dịch đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={handleModalClose}
          isOpen={showModal}
        />
      )}
    </div>
  );
};

export default Transactions;
