import api from './api';

export const recurringService = {
  getRecurring: async (page = 1, limit = 10) => {
    const response = await api.get(`/recurring-transactions?page=${page}&limit=${limit}`);
    return response.data;
  },

  createRecurring: async (payload) => {
    const response = await api.post('/recurring-transactions', payload);
    return response.data;
  },

  updateRecurring: async (id, payload) => {
    const response = await api.put(`/recurring-transactions/${id}`, payload);
    return response.data;
  },

  deleteRecurring: async (id) => {
    const response = await api.delete(`/recurring-transactions/${id}`);
    return response.data;
  },
};
export default recurringService;
