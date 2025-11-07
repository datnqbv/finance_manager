import api from './api';

// Get all categories
export const getCategories = async () => {
  const response = await api.get('/categories');
  return response.data;
};

// Get single category with stats
export const getCategory = async (id) => {
  const response = await api.get(`/categories/${id}`);
  return response.data;
};

// Create new category
export const createCategory = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

// Update category
export const updateCategory = async (id, categoryData) => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

// Delete category
export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

// Get category statistics
export const getCategoryStats = async (id) => {
  const response = await api.get(`/categories/${id}/stats`);
  return response.data;
};

// Merge categories
export const mergeCategories = async (sourceId, targetId) => {
  const response = await api.post(`/categories/${sourceId}/merge`, {
    targetCategoryId: targetId
  });
  return response.data;
};

// Reorder categories
export const reorderCategories = async (categories) => {
  const response = await api.put('/categories/reorder', { categories });
  return response.data;
};

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats,
  mergeCategories,
  reorderCategories
};
