import { createContext, useState, useContext, useEffect } from 'react';
import { transactionService } from '../services/transaction.service';
import { useAuth } from './AuthContext';
import { clearStatsCache } from '../services/stats.service';
import { toast } from 'react-toastify';

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};
// Hàm cung cấp ngữ cảnh giao dịch để các thành phần con sử dụng
// bao gồm các chức năng để lấy, tạo, cập nhật và xóa giao dịch.
// Quản lý trạng thái giao dịch và trạng thái tải trong toàn bộ ứng dụng 

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const { user, refreshUser } = useAuth();

  const invalidateTransactionStats = () => {
    clearStatsCache();
    setRevision((current) => current + 1);
  };

  const fetchTransactions = async (params = {}) => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions(params);
      setTransactions(data.data);
      setPagination({
        total: data.total ?? data.count ?? 0,
        page: data.page ?? 1,
        totalPages: data.totalPages ?? 1,
      });
      return { success: true, data: data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Không thể tải giao dịch';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };
  // Create new transaction 
  const createTransaction = async (transactionData) => {
    try {
      const data = await transactionService.createTransaction(transactionData);
      setTransactions([data.data, ...transactions]);
      invalidateTransactionStats();
      await refreshUser();
      toast.success(data.message || 'Thêm giao dịch thành công!');
      return { success: true, data: data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Thêm giao dịch thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };
  // Update transaction by id
  const updateTransaction = async (id, transactionData) => {
    try {
      const data = await transactionService.updateTransaction(id, transactionData);
      setTransactions(
        transactions.map((t) => (t.id === id ? data.data : t))
      );
      invalidateTransactionStats();
      toast.success(data.message || 'Cập nhật thành công!');
      return { success: true, data: data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };
  // Tách giao dịch thành nhiều danh mục
  const splitTransaction = async (id, splits) => {
    try {
      const data = await transactionService.splitTransaction(id, splits);
      invalidateTransactionStats();
      toast.success(data.message || 'Tách giao dịch thành công!');
      return { success: true, data: data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Tách giao dịch thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Gỡ tách giao dịch
  const unsplitTransaction = async (id) => {
    try {
      const data = await transactionService.unsplitTransaction(id);
      invalidateTransactionStats();
      toast.success(data.message || 'Đã gỡ tách giao dịch!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Gỡ tách thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Delete transaction by id
  const deleteTransaction = async (id) => {
    try {
      const data = await transactionService.deleteTransaction(id);
      setTransactions(transactions.filter((t) => t.id !== id));
      invalidateTransactionStats();
      await refreshUser();
      toast.success(data.message || 'Xóa thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Xóa thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Bulk Delete Transactions
  const bulkDeleteTransactions = async (ids) => {
    try {
      const data = await transactionService.bulkDeleteTransactions(ids);
      setTransactions(transactions.filter((t) => !ids.includes(t.id)));
      invalidateTransactionStats();
      await refreshUser();
      toast.success(data.message || `Đã xóa ${ids.length} giao dịch thành công!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Xóa hàng loạt thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  // Bulk Update Transactions
  const bulkUpdateTransactions = async (ids, updateData) => {
    try {
      const data = await transactionService.bulkUpdateTransactions(ids, updateData);
      invalidateTransactionStats();
      await refreshUser();
      toast.success(data.message || `Đã cập nhật ${ids.length} giao dịch thành công!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật hàng loạt thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    transactions,
    pagination,
    loading,
    revision,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    splitTransaction,
    unsplitTransaction,
    bulkDeleteTransactions,
    bulkUpdateTransactions,
  };

  useEffect(() => {
    if (user) return;

    setTransactions([]);
    setPagination({ total: 0, page: 1, totalPages: 1 });
    setLoading(false);
  }, [user]);

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
