import { createContext, useContext, useState, useEffect } from 'react';
import * as recurringService from '../services/recurring.service';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const RecurringContext = createContext();

export const useRecurring = () => {
  const context = useContext(RecurringContext);
  if (!context) {
    throw new Error('useRecurring must be used within RecurringProvider');
  }
  return context;
};

export const RecurringProvider = ({ children }) => {
  const [recurringList, setRecurringList] = useState([]);
  const [upcomingList, setUpcomingList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Auto-fetch recurring transactions when user is logged in
  useEffect(() => {
    if (user) {
      fetchRecurringTransactions();
    }
  }, [user]);

  // Fetch recurring transactions
  const fetchRecurringTransactions = async (isActive) => {
    try {
      setLoading(true);
      setError(null);
      const data = await recurringService.getRecurringTransactions(isActive);
      setRecurringList(data.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi tải giao dịch định kỳ';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch upcoming
  const fetchUpcoming = async (days = 30) => {
    try {
      const data = await recurringService.getUpcomingRecurringTransactions(days);
      setUpcomingList(data.data || []);
    } catch (err) {
      console.error('Error fetching upcoming:', err);
    }
  };

  // Create recurring transaction
  const createRecurringTransaction = async (recurringData) => {
    try {
      setLoading(true);
      const data = await recurringService.createRecurringTransaction(recurringData);
      await fetchRecurringTransactions();
      await fetchUpcoming();
      toast.success(data.message || 'Tạo giao dịch định kỳ thành công');
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi tạo giao dịch định kỳ';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update recurring transaction
  const updateRecurringTransaction = async (id, recurringData) => {
    try {
      setLoading(true);
      const data = await recurringService.updateRecurringTransaction(id, recurringData);
      await fetchRecurringTransactions();
      await fetchUpcoming();
      toast.success(data.message || 'Cập nhật giao dịch định kỳ thành công');
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật giao dịch định kỳ';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete recurring transaction
  const deleteRecurringTransaction = async (id) => {
    try {
      setLoading(true);
      const data = await recurringService.deleteRecurringTransaction(id);
      await fetchRecurringTransactions();
      await fetchUpcoming();
      toast.success(data.message || 'Xóa giao dịch định kỳ thành công');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi xóa giao dịch định kỳ';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Execute manually
  const executeRecurringTransaction = async (id) => {
    try {
      setLoading(true);
      const data = await recurringService.executeRecurringTransaction(id);
      await fetchRecurringTransactions();
      await fetchUpcoming();
      toast.success(data.message || 'Thực hiện giao dịch thành công');
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi thực hiện giao dịch';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    recurringList,
    upcomingList,
    loading,
    error,
    fetchRecurringTransactions,
    fetchUpcoming,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    executeRecurringTransaction
  };

  return (
    <RecurringContext.Provider value={value}>
      {children}
    </RecurringContext.Provider>
  );
};
