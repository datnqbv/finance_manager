import { createContext, useContext, useState, useEffect } from 'react';
import * as budgetService from '../services/budget.service';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const BudgetContext = createContext();

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within BudgetProvider');
  }
  return context;
};

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Auto-fetch budgets when user is logged in
  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user]);

  // Fetch budgets
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getBudgets();
      setBudgets(data.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi tải ngân sách';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch budget status
  const fetchBudgetStatus = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getBudgetStatus();
      setBudgetStatus(data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi tải trạng thái ngân sách';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      const data = await budgetService.getAlerts();
      setAlerts(data.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  // Create budget
  const createBudget = async (budgetData) => {
    try {
      setLoading(true);
      const data = await budgetService.createBudget(budgetData);
      await fetchBudgets(); // Refresh list
      await fetchBudgetStatus();
      toast.success(data.message || 'Tạo ngân sách thành công');
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi tạo ngân sách';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update budget
  const updateBudget = async (id, budgetData) => {
    try {
      setLoading(true);
      const data = await budgetService.updateBudget(id, budgetData);
      await fetchBudgets();
      await fetchBudgetStatus();
      toast.success(data.message || 'Cập nhật ngân sách thành công');
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi cập nhật ngân sách';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete budget
  const deleteBudget = async (id) => {
    try {
      setLoading(true);
      const data = await budgetService.deleteBudget(id);
      await fetchBudgets();
      await fetchBudgetStatus();
      toast.success(data.message || 'Xóa ngân sách thành công');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Lỗi khi xóa ngân sách';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    budgets,
    budgetStatus,
    alerts,
    loading,
    error,
    fetchBudgets,
    fetchBudgetStatus,
    fetchAlerts,
    createBudget,
    updateBudget,
    deleteBudget
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};
