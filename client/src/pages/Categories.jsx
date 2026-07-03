import { useEffect, useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiEdit2, FiTrash2, FiLock, FiTag } from 'react-icons/fi';
import CategoryModal from '../components/CategoryModal';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import { CategoriesSkeleton } from '../components/LoadingSkeleton';
// hàm dùng cho việc tải lại danh sách danh mục sau khi thực hiện các thao tác thêm, sửa hoặc xóa danh mục trên trang quản lý danh mục. Khi người dùng thực hiện một trong các thao tác này, hàm fetchCategories sẽ được gọi để lấy lại dữ liệu danh mục mới nhất từ server và cập nhật giao diện người dùng với thông tin mới nhất về các danh mục có sẵn. Điều này giúp đảm bảo rằng người dùng luôn thấy dữ liệu chính xác và có thể tiếp tục quản lý các danh mục của mình một cách hiệu quả sau khi thực hiện các thao tác thêm, sửa hoặc xóa. 
const Categories = () => {
  const ITEMS_PER_PAGE = 8;
  const { categories, loading, fetchCategories, createCategory, updateCategory, deleteCategory } = useCategories();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (category) => {
    if (category.isDefault) {
      toast.warning(isEnglish ? 'Default category cannot be deleted' : 'Không thể xóa danh mục mặc định');
      return;
    }
    if (window.confirm(isEnglish ? `Delete category "${category.name}"?` : `Xóa danh mục "${category.name}"?`)) {
      try {
        await deleteCategory(category.id);
      } catch {}
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSave = async (formData) => {
    if (editingCategory) await updateCategory(editingCategory.id, formData);
    else await createCategory(formData);
  };

  const allIncome = categories.filter(c => c.type === 'income' || c.type === 'both');
  const allExpense = categories.filter(c => c.type === 'expense' || c.type === 'both');
// hàm tìm kiếm 
  const filteredCategories = categories.filter(cat => {
    if (filterType === 'all') return true;
    if (filterType === 'income') return cat.type === 'income' || cat.type === 'both';
    if (filterType === 'expense') return cat.type === 'expense' || cat.type === 'both';
    return true;
  });

  const incomeOnly = categories.filter(c => c.type === 'income').length;
  const expenseOnly = categories.filter(c => c.type === 'expense').length;
  const bothType = categories.filter(c => c.type === 'both').length;
  const defaultCount = categories.filter(c => c.isDefault).length;
  const customCount = categories.length - defaultCount;

  const pct = (value) => (categories.length > 0 ? (value / categories.length) * 100 : 0);
  // Sắp xếp danh mục theo thứ tự tùy chỉnh (order) và sau đó theo tên để đảm bảo rằng các danh mục được hiển thị theo thứ tự mong muốn của người dùng, đồng thời giúp người dùng dễ dàng tìm thấy danh mục mình cần trong danh sách danh mục trên trang quản lý danh mục. Việc sắp xếp này giúp cải thiện trải nghiệm người dùng bằng cách tổ chức các danh mục một cách hợp lý và dễ dàng truy cập.   
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0);
    if (orderDiff !== 0) return orderDiff;
    return (a.name || '').localeCompare((b.name || ''), isEnglish ? 'en' : 'vi');
  });

  const totalItems = sortedCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedCategories = sortedCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading && categories.length === 0) {
    return <CategoriesSkeleton />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiTag size={18} className="text-[#b8e4d6]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Category Management' : 'Quản lý danh mục'}</p>
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{categories.length}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
              <FiLock size={12} /> {defaultCount} {isEnglish ? 'default' : 'mặc định'} • {customCount} {isEnglish ? 'custom' : 'tùy chỉnh'}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Income Categories' : 'Danh mục thu nhập'}</p>
                <p className="mt-1 text-2xl font-bold">{allIncome.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Expense Categories' : 'Danh mục chi tiêu'}</p>
                <p className="mt-1 text-2xl font-bold">{allExpense.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Used for both' : 'Dùng cho cả hai'}</p>
                <p className="mt-1 text-2xl font-bold">{bothType}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl bg-[#FFFCF5] p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Category Distribution' : 'Phân bổ danh mục'}</h3>
              <button
                onClick={() => setShowModal(true)}
                className="text-xs font-semibold text-[#3a4a62] hover:underline dark:text-[#b9c3d0]"
              >
                {isEnglish ? 'Add New' : 'Thêm mới'}
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: isEnglish ? 'Income only' : 'Chỉ thu nhập', value: incomeOnly, color: 'bg-emerald-600 dark:bg-emerald-500' },
                { label: isEnglish ? 'Expense only' : 'Chỉ chi tiêu', value: expenseOnly, color: 'bg-red-500 dark:bg-red-400' },
                { label: isEnglish ? 'Both' : 'Cả hai', value: bothType, color: 'bg-blue-500 dark:bg-blue-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#586074] dark:text-[#a9afbb]">
                    <span className="font-semibold">{item.label}</span>
                    <span className="font-bold">{pct(item.value).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct(item.value)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-[#F3EBD8] p-3 dark:bg-[#222935]">
              <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{isEnglish ? 'Smart Suggestion' : 'Gợi ý tối ưu'}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                {categories.length < 8 
                  ? (isEnglish ? 'You can add more detailed categories for better analytics.' : 'Bạn có thể thêm danh mục chi tiết hơn để thống kê chính xác.')
                  : (isEnglish ? 'Your categories are in good shape. Consider merging duplicates.' : 'Danh mục đang đủ tốt, hãy rà soát và gộp các mục trùng lặp.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[#FFFCF5] shadow-sm dark:bg-[#191d25]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4 dark:border-[#2b313d]">
          <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Category List' : 'Danh sách danh mục'}</h3>
          <div className="flex items-center gap-2">
            {[
              { label: `${isEnglish ? 'All' : 'Tất cả'} (${categories.length})`, value: 'all' },
              { label: `${isEnglish ? 'Income' : 'Thu nhập'} (${allIncome.length})`, value: 'income' },
              { label: `${isEnglish ? 'Expense' : 'Chi tiêu'} (${allExpense.length})`, value: 'expense' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filterType === f.value
                    ? 'bg-[#F3EBD8] text-[#1f2733] dark:bg-[#303746] dark:text-[#f1f4f8]'
                    : 'bg-[#FFFCF5] text-[#6f7480] hover:bg-[#F3EBD8] dark:bg-[#232936] dark:text-[#a4acba] dark:hover:bg-[#2d3442]'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#003d2d] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00523d]"
            >
              <FiPlus size={13} /> {isEnglish ? 'Add Category' : 'Thêm danh mục'}
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
            <thead>
                <tr className="border-b border-[#eceff4] bg-[#FFFCF5] text-left text-xs font-bold uppercase tracking-wider text-[#7a808c] dark:border-[#2b313d] dark:bg-[#232936] dark:text-[#9fa7b4]">
                <th className="px-5 py-3">{isEnglish ? 'Description' : 'Mô tả'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Type' : 'Loại'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Color' : 'Màu'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Order' : 'Thứ tự'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                <th className="px-5 py-3 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.length > 0 ? paginatedCategories.map((category, idx) => (
                <tr key={category.id} className={`border-b border-[#eef1f6] dark:border-[#2a303b] ${idx % 2 === 1 ? 'bg-[#FFFCF5] dark:bg-[#1d222c]' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${category.color || '#10b981'}1f` }}>
                        {category.icon || '📁'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#1d2430] dark:text-[#eef1f5]">{category.name}</p>
                        <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'Code' : 'Mã'}: {category.id?.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      category.type === 'income'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : category.type === 'expense'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {category.type === 'income' ? (isEnglish ? 'Income' : 'Thu nhập') : category.type === 'expense' ? (isEnglish ? 'Expense' : 'Chi tiêu') : (isEnglish ? 'Both' : 'Cả hai')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#4b5361] dark:text-[#b3bbc8]">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color || '#10b981' }} />
                      {category.color || '#10b981'}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#303846] dark:text-[#c9d1db]">{category.order || 0}</td>
                  <td className="px-5 py-4">
                    {category.isDefault ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#edf0f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5b6474] dark:bg-[#313846] dark:text-[#bac4d3]">
                        <FiLock size={10} /> {isEnglish ? 'Default' : 'Mặc định'}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#e4f8ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#12724e] dark:bg-[#213c33] dark:text-[#80d6b4]">
                        {isEnglish ? 'Custom' : 'Tùy chỉnh'}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(category)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc] dark:hover:bg-[#364050]"
                        title={isEnglish ? 'Edit' : 'Chỉnh sửa'}
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={category.isDefault}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8eceb] text-[#a55d56] hover:bg-[#f4dedc] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#3b2a2c] dark:text-[#e0a29a] dark:hover:bg-[#4a3336]"
                        title={category.isDefault ? (isEnglish ? 'Default category cannot be deleted' : 'Không thể xóa danh mục mặc định') : (isEnglish ? 'Delete' : 'Xóa')}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No categories match the current filter.' : 'Không có danh mục phù hợp với bộ lọc hiện tại.'}</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00523d]"
                    >
                      <FiPlus size={14} /> {isEnglish ? 'Add your first category' : 'Thêm danh mục đầu tiên'}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
          {paginatedCategories.length > 0 ? paginatedCategories.map((category) => (
            <div key={category.id} className="py-4 px-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: `${category.color || '#10b981'}1f` }}>
                    {category.icon || '📁'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1d2430] dark:text-[#eef1f5] text-sm">{category.name}</p>
                    <p className="text-[11px] text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'Code' : 'Mã'}: {category.id?.slice(-6)}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                    category.type === 'income'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : category.type === 'expense'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {category.type === 'income' ? (isEnglish ? 'Income' : 'Thu nhập') : category.type === 'expense' ? (isEnglish ? 'Expense' : 'Chi tiêu') : (isEnglish ? 'Both' : 'Cả hai')}
                  </span>
                  {category.isDefault ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#edf0f5] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#5b6474] dark:bg-[#313846] dark:text-[#bac4d3]">
                      <FiLock size={9} /> {isEnglish ? 'Default' : 'Mặc định'}
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#e4f8ef] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#12724e] dark:bg-[#213c33] dark:text-[#80d6b4]">
                      {isEnglish ? 'Custom' : 'Tùy chỉnh'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color || '#10b981' }} />
                    <span className="font-semibold text-gray-800 dark:text-gray-250">{category.color || '#10b981'}</span>
                  </div>
                  <div>
                    <span>{isEnglish ? 'Order: ' : 'Thứ tự: '}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-250">{category.order || 0}</span>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleEdit(category)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc]"
                  >
                    <FiEdit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    disabled={category.isDefault}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8eceb] text-[#a55d56] hover:bg-[#f4dedc] disabled:opacity-40 dark:bg-[#3b2a2c] dark:text-[#e0a29a]"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-sm text-gray-500">
              {isEnglish ? 'No categories match the current filter.' : 'Không có danh mục phù hợp với bộ lọc hiện tại.'}
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <div className="px-5 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              onItemsPerPageChange={() => {}}
              totalItems={totalItems}
              showItemsPerPageSelector={false}
            />
          </div>
        )}
      </div>

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
