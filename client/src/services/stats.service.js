import api from './api';

// ── Simple in-memory TTL cache (60 seconds) for heavy stats endpoints ──
const cache = new Map();
const TTL = 60_000;

const buildCacheKey = (url, params = {}) => {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  const qs = sorted.map(([k, v]) => `${k}=${v}`).join('&');
  return qs ? `${url}?${qs}` : url;
};

const cachedGet = async (key, url, params) => {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < TTL) return entry.data;
  const response = await api.get(url, params ? { params } : undefined);
  cache.set(key, { data: response.data, ts: Date.now() });
  return response.data;
};

export const clearStatsCache = () => cache.clear();

export const statsService = {
  // Combined dashboard call — one request instead of many
  getDashboard: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate)   params.endDate   = endDate;
    const key = `dashboard-${startDate}-${endDate}`;
    return cachedGet(key, '/stats/dashboard', params);
  },
  getMonthlyStats: async (year, month) => {
    const params = {};
    if (year) params.year = year;
    if (month) params.month = month;

    return cachedGet(buildCacheKey('/stats/monthly', params), '/stats/monthly', params);
  },

  getSummary: async () => {
    const response = await api.get('/stats/summary');
    return response.data;
  },

  getCategoryStats: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return cachedGet(buildCacheKey('/stats/categories', params), '/stats/categories', params);
  },

  // So sánh thu chi giữa các tháng/năm
  compareStats: async (type = 'month', periods = 6, refYear, refMonth) => {
    const params = { type, periods };
    if (refYear)  params.refYear  = refYear;
    if (refMonth) params.refMonth = refMonth;
    return cachedGet(buildCacheKey('/stats/compare', params), '/stats/compare', params);
  },

  // Phân tích xu hướng chi tiêu
  analyzeTrends: async (period = 12, refYear, refMonth) => {
    const params = { period };
    if (refYear)  params.refYear  = refYear;
    if (refMonth) params.refMonth = refMonth;
    return cachedGet(buildCacheKey('/stats/trends', params), '/stats/trends', params);
  },

  // Cố vấn tài chính thông minh: quy tắc 50/30/20, phát hiện bất thường, cảnh báo tiến độ ngân sách/mục tiêu
  getFinancialAdvice: async (year, month) => {
    const params = {};
    if (year)  params.year  = year;
    if (month) params.month = month;
    return cachedGet(buildCacheKey('/advisor', params), '/advisor', params);
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

    return cachedGet(buildCacheKey('/stats/daily', params), '/stats/daily', params);
  },

  // Thống kê theo tuần
  getWeeklyStats: async (weeks = 12) => {
    const response = await api.get('/stats/weekly', {
      params: { weeks }
    });
    return response.data;
  },
};
