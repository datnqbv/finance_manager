import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../services/admin.service';
import { useLanguage } from '../context/LanguageContext';
import { FiActivity, FiClock, FiSearch, FiRotateCcw } from 'react-icons/fi';
import Pagination from '../components/Pagination';

const AdminVisits = () => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 20 });
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadVisits = async (page = 1, params = {}) => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        limit: params.limit !== undefined ? params.limit : pagination.limit,
        search: params.search !== undefined ? params.search : search,
        startDate: params.startDate !== undefined ? params.startDate : startDate,
        endDate: params.endDate !== undefined ? params.endDate : endDate,
      };

      // Clean up empty params
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      const response = await adminService.getVisits(queryParams);
      if (response.success) {
        setItems(response.data.items || []);
        setPagination(response.data.pagination || { total: 0, page: 1, totalPages: 1, limit: queryParams.limit });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Cannot load traffic logs' : 'Không thể tải lịch sử truy cập'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVisits(1);
  };

  const handleReset = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    loadVisits(1, { search: '', startDate: '', endDate: '' });
  };

  const parseUserAgent = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
      if (ua.includes('iPhone')) return 'iPhone (Mobile)';
      if (ua.includes('Android')) return 'Android Mobile';
      return 'Mobile Device';
    }
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'Mac PC';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Desktop';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Traffic Logs' : 'Nhật ký hệ thống'}</p>
        <h1 className="mt-2 text-4xl font-black flex items-center gap-3">
          <FiActivity className="animate-pulse" />
          {isEnglish ? 'Visitor Traffic' : 'Lịch sử truy cập'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-[#cfe9df]">
          {isEnglish
            ? 'Track real-time access logs showing who is visiting the website and when.'
            : 'Theo dõi chi tiết thời gian thực lịch sử người dùng truy cập và hoạt động trên hệ thống.'}
        </p>
      </div>

      {/* Filter Form Card */}
      <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-[#171a21] border border-gray-150 dark:border-gray-800">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-[2fr_1.2fr_1.2fr_auto] gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isEnglish ? 'Search keyword' : 'Từ khóa tìm kiếm'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                <FiSearch size={16} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isEnglish ? 'Search visitor, email, OS...' : 'Tìm khách truy cập, email, OS...'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#d8dde5] dark:border-gray-800 dark:bg-gray-850 dark:text-white outline-none focus:border-[#6aa386] transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isEnglish ? 'Start Date' : 'Từ ngày'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#d8dde5] dark:border-gray-800 dark:bg-gray-850 dark:text-white outline-none focus:border-[#6aa386] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {isEnglish ? 'End Date' : 'Đến ngày'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#d8dde5] dark:border-gray-800 dark:bg-gray-850 dark:text-white outline-none focus:border-[#6aa386] transition-colors"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="submit"
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#003d2d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00523d] transition-colors"
            >
              <FiSearch size={16} />
              {isEnglish ? 'Search' : 'Tìm'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-850 dark:hover:bg-gray-800 dark:text-gray-200 px-4 py-2.5 text-sm font-semibold transition-colors"
              title={isEnglish ? 'Clear all filters' : 'Xóa bộ lọc'}
            >
              <FiRotateCcw size={16} />
              {isEnglish ? 'Reset' : 'Đặt lại'}
            </button>
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl bg-white shadow-sm dark:bg-[#171a21] overflow-hidden border border-gray-150 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] text-xs font-semibold text-[#5f6e82] dark:bg-[#1b202a] dark:text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-16 text-center">{isEnglish ? 'STT' : 'STT'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Date' : 'Ngày'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Time' : 'Giờ'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'User name' : 'Tên'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Email' : 'Email'}</th>
                <th className="px-5 py-3.5">{isEnglish ? 'Device / OS' : 'Thiết bị'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1f5] dark:divide-gray-800 dark:text-[#d1d5db]">
              {loading ? (
                // Table skeleton loader
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-44" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
                  </tr>
                ))
              ) : items.length > 0 ? (
                items.map((item, index) => {
                  const globalIndex = (pagination.page - 1) * pagination.limit + index + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1c2230]/30 transition-colors">
                      <td className="px-5 py-4 text-center text-gray-400 font-medium">{globalIndex}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">{formatDate(item.visitedAt)}</td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md text-xs font-medium">
                          <FiClock size={12} />
                          {formatTime(item.visitedAt)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.user?.name || (isEnglish ? 'Guest' : 'Khách')}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{item.user?.email || 'N/A'}</td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400" title={item.userAgent}>
                          {parseUserAgent(item.userAgent)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // Empty state
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-[#9ea3ae] dark:text-gray-500">
                    <FiActivity size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-sm font-semibold">{isEnglish ? 'No visitor records found.' : 'Chưa có lịch sử truy cập.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination.total > 0 && (
          <div className="px-5 pb-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => loadVisits(p)}
              itemsPerPage={pagination.limit}
              onItemsPerPageChange={(l) => loadVisits(1, { limit: l })}
              totalItems={pagination.total}
              showItemsPerPageSelector={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVisits;
