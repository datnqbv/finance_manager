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

  // So sánh thu chi giữa các tháng/năm
  compareStats: async (type = 'month', periods = 6, refYear, refMonth) => {
    const params = { type, periods };
    if (refYear)  params.refYear  = refYear;
    if (refMonth) params.refMonth = refMonth;
    const response = await api.get('/stats/compare', { params });
    return response.data;
  },

  // Dự báo chi tiêu tháng tới
  forecastSpending: async (months = 6, refYear, refMonth) => {
    const params = { months };
    if (refYear)  params.refYear  = refYear;
    if (refMonth) params.refMonth = refMonth;
    const response = await api.get('/stats/forecast', { params });
    return response.data;
  },

  // Phân tích xu hướng chi tiêu
  analyzeTrends: async (period = 12, refYear, refMonth) => {
    const params = { period };
    if (refYear)  params.refYear  = refYear;
    if (refMonth) params.refMonth = refMonth;
    const response = await api.get('/stats/trends', { params });
    return response.data;
  },

  // Top danh mục chi tiêu
  getTopCategories: async (limit = 10, startDate, endDate, type = 'expense') => {
    const params = { limit, type };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/stats/top-categories', { params });
    return response.data;
  },

  // Thống kê theo ngày
  getDailyStats: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/stats/daily', { params });
    return response.data;
  },

  // Thống kê theo tuần
  getWeeklyStats: async (weeks = 12) => {
    const response = await api.get('/stats/weekly', {
      params: { weeks }
    });
    return response.data;
  },

  // Phân tích AI: điểm sức khỏe tài chính, phát hiện bất thường, gợi ý
  getAIInsights: async () => {
    const response = await api.get('/stats/ai-insights');
    return response.data;
  },
};
