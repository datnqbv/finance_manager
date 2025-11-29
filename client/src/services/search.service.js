import api from './api';

const searchService = {
  /**
   * Global search - Tìm kiếm toàn bộ hệ thống
   * @param {string} query - Search query
   * @param {string} type - Type filter: 'all', 'transaction', 'category', 'budget', 'goal', 'recurring'
   * @param {number} limit - Number of results per type
   */
  globalSearch: async (query, type = 'all', limit = 20) => {
    const response = await api.get('/search', {
      params: { q: query, type, limit }
    });
    return response.data;
  },

  /**
   * Advanced search - Tìm kiếm nâng cao với filters
   * @param {Object} searchParams
   * @param {string} searchParams.query - Search query
   * @param {string} searchParams.type - Collection type
   * @param {Object} searchParams.filters - Additional filters
   */
  advancedSearch: async (searchParams) => {
    const response = await api.post('/search/advanced', searchParams);
    return response.data;
  },

  /**
   * Get search suggestions - Autocomplete
   * @param {string} query - Partial query (minimum 2 characters)
   */
  getSuggestions: async (query) => {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }
    const response = await api.get('/search/suggestions', {
      params: { q: query }
    });
    return response.data;
  },

  /**
   * Search transactions with filters
   */
  searchTransactions: async (query, filters = {}) => {
    return await searchService.advancedSearch({
      query,
      type: 'transaction',
      filters
    });
  },

  /**
   * Search budgets
   */
  searchBudgets: async (query, filters = {}) => {
    return await searchService.advancedSearch({
      query,
      type: 'budget',
      filters
    });
  }
};

export default searchService;
