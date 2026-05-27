import { createContext, useContext, useState } from 'react';
import * as walletService from '../services/wallet.service';
import { toast } from 'react-toastify';

const WalletContext = createContext();

export const useWallets = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallets must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEnglish = localStorage.getItem('language') === 'en';

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await walletService.getWallets();
      setWallets(data.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to load wallets' : 'Lỗi khi tải danh sách ví');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (walletData) => {
    try {
      setLoading(true);
      const data = await walletService.createWallet(walletData);
      await fetchWallets();
      toast.success(data.message || (isEnglish ? 'Wallet created successfully' : 'Tạo ví thành công'));
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to create wallet' : 'Lỗi khi tạo ví');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWallet = async (id, walletData) => {
    try {
      setLoading(true);
      const data = await walletService.updateWallet(id, walletData);
      await fetchWallets();
      toast.success(data.message || (isEnglish ? 'Wallet updated successfully' : 'Cập nhật ví thành công'));
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to update wallet' : 'Lỗi khi cập nhật ví');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWallet = async (id) => {
    try {
      setLoading(true);
      const data = await walletService.deleteWallet(id);
      await fetchWallets();
      toast.success(data.message || (isEnglish ? 'Wallet deleted successfully' : 'Xóa ví thành công'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to delete wallet' : 'Lỗi khi xóa ví');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const transferFunds = async (transferData) => {
    try {
      setLoading(true);
      const data = await walletService.transferFunds(transferData);
      await fetchWallets();
      toast.success(data.message || (isEnglish ? 'Funds transferred successfully' : 'Chuyển khoản thành công'));
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to transfer funds' : 'Lỗi khi chuyển khoản');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    wallets,
    loading,
    error,
    fetchWallets,
    createWallet,
    updateWallet,
    deleteWallet,
    transferFunds
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
