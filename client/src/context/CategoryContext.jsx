import { createContext, useContext, useState, useEffect } from 'react';
import * as categoryService from '../services/category.service';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CategoryContext = createContext();

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const isEnglish = localStorage.getItem('language') === 'en';

  useEffect(() => {
    if (user) {
      fetchCategories();
      return;
    }

    setCategories([]);
    setError(null);
  }, [user]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getCategories();
      setCategories(data.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to load categories' : 'Lỗi khi tải danh mục');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create category
  const createCategory = async (categoryData) => {
    try {
      setLoading(true);
      const data = await categoryService.createCategory(categoryData);
      setCategories([...categories, data.data]);
      toast.success(data.message || (isEnglish ? 'Category created successfully' : 'Tạo danh mục thành công'));
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to create category' : 'Lỗi khi tạo danh mục');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update category
  const updateCategory = async (id, categoryData) => {
    try {
      setLoading(true);
      const data = await categoryService.updateCategory(id, categoryData);
      setCategories(categories.map(cat => cat._id === id ? data.data : cat));
      toast.success(data.message || (isEnglish ? 'Category updated successfully' : 'Cập nhật danh mục thành công'));
      return data.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to update category' : 'Lỗi khi cập nhật danh mục');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete category
  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      const data = await categoryService.deleteCategory(id);
      setCategories(categories.filter(cat => cat._id !== id));
      toast.success(data.message || (isEnglish ? 'Category deleted successfully' : 'Xóa danh mục thành công'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to delete category' : 'Lỗi khi xóa danh mục');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Merge categories
  const mergeCategories = async (sourceId, targetId) => {
    try {
      setLoading(true);
      const data = await categoryService.mergeCategories(sourceId, targetId);
      setCategories(categories.filter(cat => cat._id !== sourceId));
      toast.success(data.message || (isEnglish ? 'Categories merged successfully' : 'Gộp danh mục thành công'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to merge categories' : 'Lỗi khi gộp danh mục');
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reorder categories
  const reorderCategories = async (reorderedCategories) => {
    try {
      await categoryService.reorderCategories(reorderedCategories);
      setCategories(reorderedCategories);
      toast.success(isEnglish ? 'Categories reordered successfully' : 'Sắp xếp danh mục thành công');
    } catch (err) {
      const errorMessage = err.response?.data?.message || (isEnglish ? 'Failed to reorder categories' : 'Lỗi khi sắp xếp danh mục');
      toast.error(errorMessage);
      throw err;
    }
  };

  // Get categories by type
  const getCategoriesByType = (type) => {
    return categories.filter(cat => cat.type === type || cat.type === 'both');
  };

  // Get income categories
  const getIncomeCategories = () => getCategoriesByType('income');

  // Get expense categories
  const getExpenseCategories = () => getCategoriesByType('expense');

  const value = {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    mergeCategories,
    reorderCategories,
    getCategoriesByType,
    getIncomeCategories,
    getExpenseCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};
