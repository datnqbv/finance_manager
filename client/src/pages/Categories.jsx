import { useEffect, useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { FiPlus, FiEdit2, FiTrash2, FiLock, FiTag } from 'react-icons/fi';
import CategoryModal from '../components/CategoryModal';
import { toast } from 'react-toastify';
import { CategoriesSkeleton } from '../components/LoadingSkeleton';

const Categories = () => {
  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterType, setFilterType] = useState('all');

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
    if (window.confirm(`Xóa danh mục "${category.name}"?`)) {
      try {
        await deleteCategory(category._id);
      } catch {}
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSave = async (formData) => {
    if (editingCategory) await updateCategory(editingCategory._id, formData);
    else await createCategory(formData);
  };

  const allIncome = categories.filter(c => c.type === 'income' || c.type === 'both');
  const allExpense = categories.filter(c => c.type === 'expense' || c.type === 'both');

  const filteredCategories = categories.filter(cat => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return cat.type === 'income' || cat.type === 'both';
    if (filterType === 'expense') return cat.type === 'expense' || cat.type === 'both';
    return true;
  });

  const incomeFiltered = filteredCategories.filter(c => c.type === 'income' || c.type === 'both');
  const expenseFiltered = filteredCategories.filter(c => c.type === 'expense' || c.type === 'both');

  if (loading && categories.length === 0) {
    return <CategoriesSkeleton />;
  }

  const CategoryCard = ({ category }) => (
    <div className="group bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ backgroundColor: (category.color || '#10b981') + '20' }}
        >
          {category.icon || '📁'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{category.name}</h3>
            {category.isDefault && (
              <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500">
                <FiLock size={10} />
              </span>
            )}
          </div>
          <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            category.type === 'income'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
              : category.type === 'expense'
              ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
          }`}>
            {category.type === 'income' ? 'Thu nhập' : category.type === 'expense' ? 'Chi tiêu' : 'Cả hai'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button
            onClick={() => handleEdit(category)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors"
            title="Chỉnh sửa"
          >
            <FiEdit2 size={12} />
          </button>
          <button
            onClick={() => handleDelete(category)}
            disabled={category.isDefault}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title={category.isDefault ? 'Không thể xóa danh mục mặc định' : 'Xóa'}
          >
            <FiTrash2 size={12} />
          </button>
        </div>
      </div>

      {/* Color accent strip */}
      <div
        className="h-0.5 mt-4 rounded-full opacity-40"
        style={{ backgroundColor: category.color || '#10b981' }}
      />
    </div>
  );

  const SectionBlock = ({ title, items, emptyText, accentColor }) => (
    <div>
      <div className={`flex items-center gap-2 mb-3`}>
        <div className={`w-1 h-4 rounded-full ${accentColor}`} />
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">{title}</h2>
        <span className="text-xs bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map(cat => <CategoryCard key={cat._id} category={cat} />)}
          {/* Add new button inline */}
          <button
            onClick={() => setShowModal(true)}
            className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-500/50 dark:hover:text-emerald-500 transition-colors group min-h-[88px]"
          >
            <FiPlus size={18} className="transition-transform group-hover:scale-110" />
            <span className="text-xs font-medium">Thêm danh mục</span>
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">{emptyText}</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <FiPlus size={12} /> Thêm ngay
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FiTag className="text-gray-500 dark:text-gray-400" size={20} />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Danh mục</h1>
            <span className="text-xs bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
              {categories.length} danh mục
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 ml-7">Quản lý và tùy chỉnh nhãn thu chi</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <FiPlus size={16} />
          Thêm danh mục
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng danh mục', value: categories.length, border: 'border-l-gray-400', icon: '🗂️', valueColor: 'text-gray-800 dark:text-gray-100' },
          { label: 'Thu nhập', value: allIncome.length, border: 'border-l-emerald-500', icon: '📈', valueColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Chi tiêu', value: allExpense.length, border: 'border-l-red-500', icon: '📉', valueColor: 'text-red-600 dark:text-red-400' },
        ].map((s, i) => (
          <div key={i} className={`bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 ${s.border} rounded-2xl px-4 py-3`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.valueColor}`}>{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5 w-fit">
        {[
          { label: `Tất cả (${categories.length})`, value: 'all' },
          { label: `Thu nhập (${allIncome.length})`, value: 'income' },
          { label: `Chi tiêu (${allExpense.length})`, value: 'expense' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filterType === f.value
                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Category sections ── */}
      {filterType === 'all' ? (
        <div className="space-y-7">
          <SectionBlock
            title="Danh mục Thu nhập"
            items={incomeFiltered}
            emptyText="Chưa có danh mục thu nhập"
            accentColor="bg-emerald-500"
          />
          <SectionBlock
            title="Danh mục Chi tiêu"
            items={expenseFiltered}
            emptyText="Chưa có danh mục chi tiêu"
            accentColor="bg-red-500"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCategories.length > 0 ? (
            <>
              {filteredCategories.map(cat => <CategoryCard key={cat._id} category={cat} />)}
              <button
                onClick={() => setShowModal(true)}
                className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-500/50 dark:hover:text-emerald-500 transition-colors group min-h-[88px]"
              >
                <FiPlus size={18} className="transition-transform group-hover:scale-110" />
                <span className="text-xs font-medium">Thêm danh mục</span>
              </button>
            </>
          ) : (
            <div className="col-span-full text-center py-14">
              <div className="w-14 h-14 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                🗂️
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Chưa có danh mục nào</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <FiPlus size={14} /> Thêm danh mục đầu tiên
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
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
