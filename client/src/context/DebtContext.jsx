import { createContext, useContext, useState, useEffect } from 'react';
import debtService from '../services/debt.service';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const DebtContext = createContext();

export const useDebt = () => {
  const ctx = useContext(DebtContext);
  if (!ctx) throw new Error('useDebt must be used within DebtProvider');
  return ctx;
};

export const DebtProvider = ({ children }) => {
  const [debts, setDebts]   = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchDebts = async (params = {}) => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await debtService.getDebts(params);
      setDebts(res.data || []);
      setStats(res.stats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createDebt = async (data) => {
    try {
      const res = await debtService.createDebt(data);
      setDebts(prev => [res.data, ...prev]);
      toast.success('Đã tạo khoản nợ');
      await refreshStats();
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi tạo khoản nợ';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const updateDebt = async (id, data) => {
    try {
      const res = await debtService.updateDebt(id, data);
      setDebts(prev => prev.map(d => d._id === id ? res.data : d));
      toast.success('Đã cập nhật');
      await refreshStats();
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi cập nhật';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const deleteDebt = async (id) => {
    try {
      await debtService.deleteDebt(id);
      setDebts(prev => prev.filter(d => d._id !== id));
      toast.success('Đã xóa khoản nợ');
      await refreshStats();
      return { success: true };
    } catch (err) {
      toast.error('Lỗi khi xóa');
      return { success: false };
    }
  };

  const addPayment = async (id, amount, note) => {
    try {
      const res = await debtService.addPayment(id, amount, note);
      setDebts(prev => prev.map(d => d._id === id ? res.data : d));
      toast.success(res.message || 'Đã ghi nhận thanh toán');
      await refreshStats();
      return { success: true, data: res.data, message: res.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi';
      toast.error(msg);
      return { success: false };
    }
  };

  const settleDebt = async (id) => {
    try {
      const res = await debtService.settleDebt(id);
      setDebts(prev => prev.map(d => d._id === id ? res.data : d));
      toast.success('Đã tất toán khoản nợ ✅');
      await refreshStats();
      return { success: true };
    } catch (err) {
      toast.error('Lỗi');
      return { success: false };
    }
  };

  const refreshStats = async () => {
    try {
      const res = await debtService.getDebts();
      setStats(res.stats || null);
    } catch {}
  };

  useEffect(() => {
    if (user) fetchDebts();
    else { setDebts([]); setStats(null); }
  }, [user]);

  return (
    <DebtContext.Provider value={{ debts, stats, loading, fetchDebts, createDebt, updateDebt, deleteDebt, addPayment, settleDebt }}>
      {children}
    </DebtContext.Provider>
  );
};
