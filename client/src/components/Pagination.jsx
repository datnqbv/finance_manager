import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage, 
  onItemsPerPageChange,
  totalItems,
  showItemsPerPageSelector = true,
  itemsPerPageOptions = [5, 10, 20, 50, 100],
}) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
      {/* Items per page selector */}
      {showItemsPerPageSelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{isEnglish ? 'Show' : 'Hiển thị'}</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="input w-20 py-1"
          >
            {itemsPerPageOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isEnglish ? '/ page' : '/ trang'}
          </span>
        </div>
      )}

      {/* Page info */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {isEnglish ? 'Showing' : 'Hiển thị'} <span className="font-semibold">{startItem}</span> - <span className="font-semibold">{endItem}</span> {isEnglish ? 'of' : 'trong tổng số'} <span className="font-semibold">{totalItems}</span>
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-[#F3EBD8] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={isEnglish ? 'Previous page' : 'Trang trước'}
        >
          <FiChevronLeft />
        </button>

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] px-3 py-2 rounded-lg border transition-colors ${
                currentPage === page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-[#F3EBD8] dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          )
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-[#F3EBD8] dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={isEnglish ? 'Next page' : 'Trang sau'}
        >
          <FiChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
