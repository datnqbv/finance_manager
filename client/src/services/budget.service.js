import api from './api';

// Get all budgets
export const getBudgets = async () => {
  const response = await api.get('/budgets');
  return response.data;
};

// Get single budget
export const getBudget = async (id) => {
  const response = await api.get(`/budgets/${id}`);
  return response.data;
};

// Create new budget
export const createBudget = async (budgetData) => {
  const response = await api.post('/budgets', budgetData);
  return response.data;
};

// Update budget
export const updateBudget = async (id, budgetData) => {
  const response = await api.put(`/budgets/${id}`, budgetData);
  return response.data;
};

// Delete budget
export const deleteBudget = async (id) => {
  const response = await api.delete(`/budgets/${id}`);
  return response.data;
};

// Get budget status/overview
export const getBudgetStatus = async () => {
  const response = await api.get('/budgets/status');
  return response.data;
};

// Get alerts
export const getAlerts = async () => {
  const response = await api.get('/budgets/alerts');
  return response.data;
};

export default {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatus,
  getAlerts
};
