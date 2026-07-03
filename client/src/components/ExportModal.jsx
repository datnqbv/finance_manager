import { useState, useEffect } from 'react';
import { FiX, FiDownload, FiFileText, FiCalendar, FiPieChart, FiLock } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import DatePicker from './DatePicker';

const ExportModal = ({ isOpen, onClose, transactions = [], user, onExport, totalFilteredCount, filterDateFrom = '', filterDateTo = '' }) => {
  const { language } = useLanguage();
  const isEnglish = language === 'en';
  const isVipActive = user?.isVip && (!user?.vipExpire || new Date(user.vipExpire) > new Date());
  
  const [format, setFormat] = useState('pdf'); // 'pdf' | 'excel'
  const [groupBy, setGroupBy] = useState('detail'); // 'detail' | 'day' | 'month' | 'quarter'
  const [scope, setScope] = useState('all'); // 'all' | 'current'
  const [dateFrom, setDateFrom] = useState(filterDateFrom);
  const [dateTo, setDateTo] = useState(filterDateTo);
  const [loading, setLoading] = useState(false);

  const handleGroupByChange = (mode) => {
    if (mode === 'quarter' && !isVipActive) {
      alert(isEnglish 
        ? 'Quarterly report export is a VIP feature. Please upgrade to VIP!' 
        : 'Tính năng xuất báo cáo theo quý chỉ dành cho VIP. Vui lòng nâng cấp lên tài khoản VIP!');
      return;
    }
    setGroupBy(mode);
  };

  useEffect(() => {
    if (isOpen) {
      setDateFrom(filterDateFrom || '');
      setDateTo(filterDateTo || '');
    }
  }, [isOpen, filterDateFrom, filterDateTo]);

  if (!isOpen) return null;

  const handleExportClick = async () => {
    setLoading(true);
    try {
      await onExport({ format, groupBy, scope, dateFrom, dateTo });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Pre-calculate statistics for the current scope to show the user
  const filteredTransactions = transactions.filter(t => {
    const txDate = t.date.substring(0, 10); // 'YYYY-MM-DD'
    if (dateFrom && txDate < dateFrom) return false;
    if (dateTo && txDate > dateTo) return false;
    return true;
  });

  const currentScopeCount = scope === 'all' ? totalFilteredCount : filteredTransactions.length;
  
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  
  const balance = totalIncome - totalExpense;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: user?.currency || 'VND',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-modal-fade">
      <div className="w-full max-w-md rounded-2xl bg-[#FFFCF5] p-6 shadow-2xl dark:bg-[#191d25] border border-gray-100 dark:border-gray-800 transition-all transform scale-100 max-h-[90vh] overflow-y-auto animate-modal-scale">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEnglish ? 'Export Transaction Report' : 'Xuất báo cáo giao dịch'}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {isEnglish ? 'Configure and download your transaction report' : 'Cấu hình và tải xuống báo cáo chi tiêu của bạn'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#232936] dark:hover:text-gray-300"
            disabled={loading}
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          
          {/* Format Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isEnglish ? 'File Format' : 'Định dạng file'}
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  format === 'pdf'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[#b9e4d2]'
                    : 'border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FiFileText size={16} /> PDF (.pdf)
              </button>
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  format === 'excel'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[#b9e4d2]'
                    : 'border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <FiPieChart size={16} /> Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Grouping Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isEnglish ? 'Group Report By' : 'Gom nhóm báo cáo'}
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setGroupBy('detail')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  groupBy === 'detail'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[#b9e4d2]'
                    : 'border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isEnglish ? 'Detailed List' : 'Chi tiết giao dịch'}
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('day')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  groupBy === 'day'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[#b9e4d2]'
                    : 'border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isEnglish ? 'By Day' : 'Báo cáo theo ngày'}
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('month')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                  groupBy === 'month'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[#b9e4d2]'
                    : 'border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isEnglish ? 'By Month' : 'Báo cáo theo tháng'}
              </button>
              <button
                type="button"
                onClick={() => handleGroupByChange('quarter')}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all relative ${
                  groupBy === 'quarter'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-[#b9e4d2]'
                    : 'border-gray-200 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                } ${!isVipActive ? 'opacity-75 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/10' : ''}`}
              >
                <span className="flex items-center justify-center gap-1">
                  {!isVipActive && <FiLock className="text-amber-500" size={12} />}
                  {isEnglish ? 'By Quarter' : 'Báo cáo theo quý'}
                </span>
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="relative">
            {!isVipActive && (
              <div 
                className="absolute inset-0 bg-white/60 dark:bg-[#191d25]/60 z-10 flex flex-col items-center justify-center cursor-pointer rounded-xl backdrop-blur-[1px]"
                onClick={() => {
                  alert(isEnglish 
                    ? 'Custom date range export is a VIP feature. Please upgrade to VIP!' 
                    : 'Tính năng tự chọn thời gian xuất báo cáo chỉ dành cho VIP. Vui lòng nâng cấp lên tài khoản VIP!');
                }}
              >
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm">
                  <FiLock size={12} />
                  {isEnglish ? 'Unlock VIP Custom Dates' : 'Mở khóa thời gian tùy chọn (VIP)'}
                </div>
              </div>
            )}
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FiCalendar size={13} />
              {isEnglish ? 'Export Date Range' : 'Chọn khoảng thời gian xuất'}
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1.5">
              <div>
                <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 block mb-0.5">
                  {isEnglish ? 'From Date' : 'Từ ngày'}
                </label>
                <DatePicker
                  value={dateFrom}
                  onChange={setDateFrom}
                  disabled={!isVipActive}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-400 dark:text-gray-500 block mb-0.5">
                  {isEnglish ? 'To Date' : 'Đến ngày'}
                </label>
                <DatePicker
                  value={dateTo}
                  onChange={setDateTo}
                  disabled={!isVipActive}
                />
              </div>
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {isEnglish ? 'Export Scope' : 'Phạm vi xuất'}
            </label>
            <div className="space-y-2 mt-1.5">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-500 dark:bg-[#232936] dark:border-gray-700"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {isEnglish ? 'All matching filters' : 'Tất cả giao dịch khớp bộ lọc'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {dateFrom || dateTo
                      ? (isEnglish 
                          ? 'Export matching records in selected date range' 
                          : 'Xuất các giao dịch khớp bộ lọc trong khoảng thời gian đã chọn')
                      : (isEnglish 
                          ? `Export all ${totalFilteredCount} matching records` 
                          : `Xuất toàn bộ ${totalFilteredCount} giao dịch hiện có`)}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="current"
                  checked={scope === 'current'}
                  onChange={() => setScope('current')}
                  className="w-4 h-4 text-emerald-500 border-gray-300 focus:ring-emerald-500 dark:bg-[#232936] dark:border-gray-700"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {isEnglish ? 'Current Page Only' : 'Chỉ trang hiện tại'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isEnglish 
                      ? `Export only the ${filteredTransactions.length} records shown on screen` 
                      : `Chỉ xuất ${filteredTransactions.length} giao dịch đang hiển thị`}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Quick Summary Preview (Only shown when scope is current for accuracy, or if scope is all, we display page-level totals as indicator) */}
          {filteredTransactions.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-3.5 border border-gray-100 dark:border-gray-850">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isEnglish ? 'Summary (Current Page)' : 'Tóm tắt dữ liệu trang hiện tại'}
              </p>
              <div className="grid grid-cols-3 gap-2 mt-2 pt-1">
                <div>
                  <p className="text-[10px] text-gray-400">{isEnglish ? 'Total Income' : 'Tổng thu'}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalIncome)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">{isEnglish ? 'Total Expense' : 'Tổng chi'}</p>
                  <p className="text-xs font-bold text-red-500 dark:text-red-400 mt-0.5">{formatCurrency(totalExpense)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">{isEnglish ? 'Net Balance' : 'Số dư ròng'}</p>
                  <p className={`text-xs font-bold mt-0.5 ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#232936]"
            disabled={loading}
          >
            {isEnglish ? 'Cancel' : 'Hủy bỏ'}
          </button>
          <button
            type="button"
            onClick={handleExportClick}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
            disabled={loading || currentScopeCount === 0}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isEnglish ? 'Exporting...' : 'Đang xuất...'}
              </>
            ) : (
              <>
                <FiDownload /> {isEnglish ? 'Export Report' : 'Xuất báo cáo'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExportModal;
