import api from './api';

export const statsService = {
  getMonthlyStats: async (year, month) => {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;
    
    const response = await api.get('/stats/monthly', { params });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/stats/summary');
    return response.data;
  },

  getCategoryStats: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/stats/categories', { params });
    return response.data;
  },
};
