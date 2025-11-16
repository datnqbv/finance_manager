import { createContext, useState, useContext } from 'react';
import { transactionService } from '../services/transaction.service';
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
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async (params = {}) => {
    setLoading(true);
    try {
      const data = await transactionService.getTransactions(params);
      setTransactions(data.data);
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
        transactions.map((t) => (t._id === id ? data.data : t))
      );
      toast.success(data.message || 'Cập nhật thành công!');
      return { success: true, data: data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Cập nhật thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };
  // Delete transaction by id
  const deleteTransaction = async (id) => {
    try {
      const data = await transactionService.deleteTransaction(id);
      setTransactions(transactions.filter((t) => t._id !== id));
      toast.success(data.message || 'Xóa thành công!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Xóa thất bại';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    transactions,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
