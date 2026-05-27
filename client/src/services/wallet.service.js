import api from './api';

export const getWallets = async () => {
  const response = await api.get('/wallets');
  return response.data;
};

export const createWallet = async (walletData) => {
  const response = await api.post('/wallets', walletData);
  return response.data;
};

export const updateWallet = async (id, walletData) => {
  const response = await api.put(`/wallets/${id}`, walletData);
  return response.data;
};

export const deleteWallet = async (id) => {
  const response = await api.delete(`/wallets/${id}`);
  return response.data;
};

export const transferFunds = async (transferData) => {
  const response = await api.post('/wallets/transfer', transferData);
  return response.data;
};

export default {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
  transferFunds
};
