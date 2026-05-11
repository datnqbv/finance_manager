import { createContext, useContext, useState } from 'react';
import * as budgetService from '../services/budget.service';
import { toast } from 'react-toastify';

const BudgetContext = createContext();

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudgets must be used within BudgetProvider');
  return context;
};

export const BudgetProvider = ({ children }) => {
  const [budgets, setBudgets]           = useState([]);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [alerts, setAlerts]             = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const isEnglish = localStorage.getItem('language') === 'en';

  // ── Single combined fetch: replaces fetchBudgets + fetchBudgetStatus + fetchAlerts ──
  const fetchBudgetOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budgetService.getBudgetOverview();
      const d = data.data || {};
      setBudgets(d.budgets || []);
      setBudgetStatus(d.status   || null);
      setAlerts(d.alerts         || []);
    } catch (err) {
      const msg = err.response?.data?.message || (isEnglish ? 'Failed to load budgets' : 'Lỗi khi tải ngân sách');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Keep legacy methods as aliases so existing call-sites keep working
  const fetchBudgets       = fetchBudgetOverview;
  const fetchBudgetStatus  = fetchBudgetOverview;
  const fetchAlerts        = fetchBudgetOverview;

  const createBudget = async (budgetData) => {
    try {
      setLoading(true);
      const data = await budgetService.createBudget(budgetData);
      await fetchBudgetOverview();
      toast.success(data.message || (isEnglish ? 'Budget created successfully' : 'Tạo ngân sách thành công'));
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || (isEnglish ? 'Failed to create budget' : 'Lỗi khi tạo ngân sách');
      toast.error(msg); throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (id, budgetData) => {
    try {
      setLoading(true);
      const data = await budgetService.updateBudget(id, budgetData);
      await fetchBudgetOverview();
      toast.success(data.message || (isEnglish ? 'Budget updated successfully' : 'Cập nhật ngân sách thành công'));
      return data.data;
    } catch (err) {
      const msg = err.response?.data?.message || (isEnglish ? 'Failed to update budget' : 'Lỗi khi cập nhật ngân sách');
      toast.error(msg); throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (id) => {
    try {
      setLoading(true);
      const data = await budgetService.deleteBudget(id);
      await fetchBudgetOverview();
      toast.success(data.message || (isEnglish ? 'Budget deleted successfully' : 'Xóa ngân sách thành công'));
    } catch (err) {
      const msg = err.response?.data?.message || (isEnglish ? 'Failed to delete budget' : 'Lỗi khi xóa ngân sách');
      toast.error(msg); throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    budgets, budgetStatus, alerts, loading, error,
    fetchBudgets, fetchBudgetStatus, fetchAlerts, fetchBudgetOverview,
    createBudget, updateBudget, deleteBudget
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};
