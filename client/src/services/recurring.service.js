import api from './api';

// Get all recurring transactions
export const getRecurringTransactions = async (isActive) => {
  const params = isActive !== undefined ? { isActive } : {};
  const response = await api.get('/recurring', { params });
  return response.data;
};

// Get single recurring transaction
export const getRecurringTransaction = async (id) => {
  const response = await api.get(`/recurring/${id}`);
  return response.data;
};

// Create recurring transaction
export const createRecurringTransaction = async (data) => {
  const response = await api.post('/recurring', data);
  return response.data;
};

// Update recurring transaction
export const updateRecurringTransaction = async (id, data) => {
  const response = await api.put(`/recurring/${id}`, data);
  return response.data;
};

// Delete recurring transaction
export const deleteRecurringTransaction = async (id) => {
  const response = await api.delete(`/recurring/${id}`);
  return response.data;
};

// Execute recurring transaction manually
export const executeRecurringTransaction = async (id) => {
  const response = await api.post(`/recurring/${id}/execute`);
  return response.data;
};

// Get upcoming recurring transactions
export const getUpcomingRecurringTransactions = async (days = 30) => {
  const response = await api.get('/recurring/upcoming', { params: { days } });
  return response.data;
};

export default {
  getRecurringTransactions,
  getRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  executeRecurringTransaction,
  getUpcomingRecurringTransactions
};
