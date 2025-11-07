import { useEffect, useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { FiPlus, FiEdit2, FiTrash2, FiBarChart2 } from 'react-icons/fi';
import CategoryModal from '../components/CategoryModal';
import { toast } from 'react-toastify';

const Categories = () => {
  const {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, income, expense

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (category.isDefault) {
      toast.warning('Không thể xóa danh mục mặc định');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
      try {
        await deleteCategory(category._id);
      } catch (error) {
        // Error already handled in context
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSave = async (formData) => {
    if (editingCategory) {
      await updateCategory(editingCategory._id, formData);
    } else {
      await createCategory(formData);
    }
  };

  const filteredCategories = categories.filter(cat => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return cat.type === 'income' || cat.type === 'both';
    if (filterType === 'expense') return cat.type === 'expense' || cat.type === 'both';
    return true;
  });

  const incomeCategories = filteredCategories.filter(c => c.type === 'income' || c.type === 'both');
  const expenseCategories = filteredCategories.filter(c => c.type === 'expense' || c.type === 'both');

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản lý danh mục</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tùy chỉnh danh mục thu chi của bạn
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus /> Thêm danh mục
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng danh mục</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {categories.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📁</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Thu nhập</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {incomeCategories.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Chi tiêu</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                {expenseCategories.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222222]'
            }`}
          >
            Tất cả ({categories.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222222]'
            }`}
          >
            Thu nhập ({incomeCategories.length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filterType === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#222222]'
            }`}
          >
            Chi tiêu ({expenseCategories.length})
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div
              key={category._id}
              className="card hover:shadow-lg dark:hover:shadow-2xl transition-all group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: category.color + '20',
                    color: category.color
                  }}
                >
                  {category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        category.type === 'income'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : category.type === 'expense'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {category.type === 'income'
                        ? 'Thu nhập'
                        : category.type === 'expense'
                        ? 'Chi tiêu'
                        : 'Cả hai'}
                    </span>
                    {category.isDefault && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        Mặc định
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm"
                >
                  <FiEdit2 size={14} /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  disabled={category.isDefault}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiTrash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Chưa có danh mục nào</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary mt-4"
            >
              Thêm danh mục đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Categories;
