import api from './api';

export const transactionService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getTransaction: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  // Tách giao dịch thành nhiều danh mục
  splitTransaction: async (id, splits) => {
    const response = await api.post(`/transactions/${id}/split`, { splits });
    return response.data;
  },

  // Gỡ tách giao dịch
  unsplitTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}/split`);
    return response.data;
  },

  // Upload hóa đơn
  uploadReceipt: async (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    const response = await api.post('/upload/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Bulk Actions
  bulkDeleteTransactions: async (ids) => {
    const response = await api.post('/transactions/bulk-delete', { ids });
    return response.data;
  },

  bulkUpdateTransactions: async (ids, updateData) => {
    const response = await api.post('/transactions/bulk-update', { ids, updateData });
    return response.data;
  },
};
