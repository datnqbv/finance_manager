import api from './api';

const debtService = {
  getDebts: (params = {}) => api.get('/debts', { params }).then(r => r.data),
  createDebt: (data) => api.post('/debts', data).then(r => r.data),
  updateDebt: (id, data) => api.put(`/debts/${id}`, data).then(r => r.data),
  deleteDebt: (id) => api.delete(`/debts/${id}`).then(r => r.data),
  addPayment: (id, amount, note) => api.post(`/debts/${id}/pay`, { amount, note }).then(r => r.data),
  settleDebt: (id) => api.patch(`/debts/${id}/settle`).then(r => r.data),
};

export default debtService;
