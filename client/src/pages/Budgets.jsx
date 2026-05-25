import { useEffect, useState } from 'react';
import { useBudgets } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiShield, FiTrendingUp } from 'react-icons/fi';
import BudgetModal from '../components/BudgetModal';
import Pagination from '../components/Pagination';
import { BudgetsSkeleton } from '../components/LoadingSkeleton';

const Budgets = () => {
  const ITEMS_PER_PAGE = 8;
  const { user } = useAuth();
  const { budgets, budgetStatus, alerts, loading, fetchBudgetOverview, createBudget, updateBudget, deleteBudget } = useBudgets();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';

  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBudgetOverview();
  }, []);
  // hàm formatCurrency được sử dụng để định dạng số tiền theo định dạng tiền tệ của người dùng, giúp hiển thị số tiền một cách dễ đọc và phù hợp với ngôn ngữ và đơn vị tiền tệ mà người dùng đang sử dụng trong ứng dụng quản lý chi tiêu cá nhân. Điều này cải thiện trải nghiệm người dùng bằng cách cung cấp thông tin tài chính rõ ràng và dễ hiểu, giúp họ quản lý ngân sách và chi tiêu hiệu quả hơn.
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', { style: 'currency', currency: user?.currency || 'VND' }).format(amount);
  };
  // hàm getStatus được sử dụng để xác định trạng thái của một ngân sách dựa trên phần trăm đã sử dụng, giúp người dùng nhanh chóng nhận biết tình trạng ngân sách của mình (vượt mức, cảnh báo hoặc an toàn) thông qua các chỉ báo màu sắc và nhãn tương ứng, từ đó hỗ trợ họ trong việc quản lý và điều chỉnh chi tiêu một cách hiệu quả hơn.
  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };
  // hàm handleDelete được sử dụng để xử lý việc xóa một ngân sách khi người dùng nhấn nút xóa, nó sẽ hiển thị một hộp thoại xác nhận để đảm bảo rằng người dùng thực sự muốn xóa ngân sách đó, giúp tránh những thao tác nhầm lẫn có thể dẫn đến việc mất dữ liệu quan trọng. Nếu người dùng xác nhận, hàm sẽ gọi API deleteBudget để xóa ngân sách khỏi hệ thống và cập nhật lại danh sách ngân sách trên giao diện người dùng.
  const handleDelete = async (budget) => {
    if (window.confirm(isEnglish ? `Delete budget "${budget.categoryName || 'Total'}"?` : `Xóa ngân sách "${budget.categoryName || 'Tổng'}"?`)) {
      try { await deleteBudget(budget.id); } catch {}
    }
  };
  // hàm handleSave được sử dụng để xử lý việc lưu một ngân sách mới hoặc cập nhật một ngân sách hiện có khi người dùng hoàn thành việc nhập thông tin trong modal, nó sẽ kiểm tra xem đang ở chế độ chỉnh sửa hay tạo mới và gọi API tương ứng (updateBudget hoặc createBudget) để lưu dữ liệu vào hệ thống, sau đó đóng modal và tải lại danh sách ngân sách để cập nhật thông tin mới nhất trên trang ngân sách, giúp người dùng quản lý các ngân sách của mình một cách hiệu quả sau khi thực hiện các thao tác thêm hoặc chỉnh sửa.
  const handleModalClose = () => {
    setShowModal(false);
    setEditingBudget(null);
  };
  // hàm handleSave được sử dụng để xử lý việc lưu một ngân sách mới hoặc cập nhật một ngân sách hiện có khi người dùng hoàn thành việc nhập thông tin trong modal, nó sẽ kiểm tra xem đang ở chế độ chỉnh sửa hay tạo mới và gọi API tương ứng (updateBudget hoặc createBudget) để lưu dữ liệu vào hệ thống, sau đó đóng modal và tải lại danh sách ngân sách để cập nhật thông tin mới nhất trên trang ngân sách, giúp người dùng quản lý các ngân sách của mình một cách hiệu quả sau khi thực hiện các thao tác thêm hoặc chỉnh sửa. Đồng thời, hàm này cũng sẽ hiển thị thông báo thành công hoặc lỗi cho người dùng sau khi thực hiện thao tác lưu ngân sách mới hoặc cập nhật ngân sách hiện có trên trang ngân sách, giúp cải thiện trải nghiệm người dùng bằng cách cung cấp phản hồi rõ ràng về kết quả của hành động của họ, giúp họ hiểu rằng thao tác đã được thực hiện thành công hoặc nếu có lỗi xảy ra, họ sẽ biết để có thể thử lại hoặc điều chỉnh thông tin nhập vào cho phù hợp.
  const handleSave = async (formData) => {
    if (editingBudget) await updateBudget(editingBudget.id, formData);
    else await createBudget(formData);
  };

  // hàm dùng để đóng modal sau khi thêm/sửa ngân sách, đồng thời reset trạng thái chỉnh sửa và tải lại danh sách ngân sách để cập nhật thông tin mới nhất trên trang ngân sách. Điều này giúp đảm bảo rằng người dùng luôn thấy dữ liệu chính xác và có thể tiếp tục quản lý các ngân sách của mình một cách hiệu quả sau khi thực hiện các thao tác thêm hoặc chỉnh sửa.
  // đồng thời thông báo thành công hoặc lỗi cho người dùng sau khi thực hiện thao tác lưu ngân sách mới hoặc cập nhật ngân sách hiện có trên trang ngân sách. Điều này giúp cải thiện trải nghiệm người dùng bằng cách cung cấp phản hồi rõ ràng về kết quả của hành động của họ, giúp họ hiểu rằng thao tác đã được thực hiện thành công hoặc nếu có lỗi xảy ra, họ sẽ biết để có thể thử lại hoặc điều chỉnh thông tin nhập vào cho phù hợp. 
  const getStatus = (pct) => {
    if (pct >= 100) return { level: 'over',    bar: 'bg-red-500',   text: 'text-red-600 dark:text-red-400',   border: 'border-l-red-500',   bg: 'bg-red-50 dark:bg-red-500/10',   label: isEnglish ? 'Over budget' : 'Vượt ngân sách' };
    if (pct >= 80)  return { level: 'warning',  bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', border: 'border-l-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', label: isEnglish ? 'Near limit' : 'Sắp vượt' };
    return              { level: 'safe',    bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: isEnglish ? 'Safe' : 'Ổn' };
  };

  const periodLabel = (p) => p === 'monthly' ? (isEnglish ? 'Month' : 'Tháng') : p === 'weekly' ? (isEnglish ? 'Week' : 'Tuần') : (isEnglish ? 'Year' : 'Năm');

  if (loading && budgets.length === 0) {
    return <BudgetsSkeleton />;
  }

  const overCount = budgetStatus?.summary?.overBudgetCount || 0;
  // tính toán tổng ngân sách, tổng chi tiêu và tổng còn lại dựa trên dữ liệu ngân sách hiện có, giúp người dùng có cái nhìn tổng quan về tình hình tài chính của mình trong kỳ ngân sách hiện tại. Điều này hỗ trợ họ trong việc quản lý và điều chỉnh chi tiêu một cách hiệu quả hơn để đạt được mục tiêu tài chính cá nhân của mình. 
  const totalBudget = budgetStatus?.summary?.totalBudget || budgets.reduce((sum, b) => sum + (b.effectiveAmount ?? b.amount ?? 0), 0);
  const totalSpending = budgetStatus?.summary?.totalSpending || budgets.reduce((sum, b) => sum + (b.currentSpending || 0), 0);
  const totalRemaining = budgetStatus?.summary?.totalRemaining ?? (totalBudget - totalSpending);
  const spendPercent = totalBudget > 0 ? Math.min((totalSpending / totalBudget) * 100, 100) : 0;

  const sortedByRisk = [...budgets].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
  const progressBudgets = sortedByRisk.slice(0, 3);
  const analysisBudgets = sortedByRisk.slice(0, 6);
  // ưu tiên hiển thị những ngân sách có phần trăm đã sử dụng cao nhất để người dùng dễ dàng nhận biết và quản lý những ngân sách đang có nguy cơ vượt mức, từ đó giúp họ có thể điều chỉnh chi tiêu kịp thời và hiệu quả hơn. Đồng thời, phần biến động ngân sách sẽ ưu tiên hiển thị những ngân sách có số tiền lớn hoặc phần trăm đã sử dụng cao để người dùng dễ dàng theo dõi và quản lý các ngân sách quan trọng nhất của họ.
  const filteredBudgets = budgets.filter((budget) => {
    if (budgetFilter === 'over') return budget.percentage >= 100;
    if (budgetFilter === 'warning') return budget.percentage >= 80 && budget.percentage < 100;
    if (budgetFilter === 'safe') return budget.percentage < 80;
    return true;
  });

  const totalItems = filteredBudgets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedBudgets = filteredBudgets.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiShield size={18} className="text-[#b8e4d6]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Budget Management' : 'Quản lý ngân sách'}</p>
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{formatCurrency(totalBudget)}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
              <FiTrendingUp size={12} /> {spendPercent.toFixed(1)}% {isEnglish ? 'budget used' : 'ngân sách đã sử dụng'}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Spent' : 'Đã chi tiêu'}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalSpending)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Remaining' : 'Còn lại'}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalRemaining)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Over budget' : 'Vượt ngân sách'}</p>
                <p className="mt-1 text-2xl font-bold">{overCount} {isEnglish ? 'items' : 'mục'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Budget Progress' : 'Tiến độ ngân sách'}</h3>
              <button onClick={() => setShowModal(true)} className="text-xs font-semibold text-[#3a4a62] hover:underline dark:text-[#b9c3d0]">
                {isEnglish ? 'Add New' : 'Thêm mới'}
              </button>
            </div>

            <div className="space-y-3">
              {progressBudgets.length > 0 ? progressBudgets.map((budget) => {
                const pct = Math.min(budget.percentage || 0, 100);
                return (
                  <div key={budget.id}>
                    <div className="mb-1 flex items-center justify-between text-xs text-[#586074] dark:text-[#a9afbb]">
                      <span className="font-semibold truncate pr-3">{budget.categoryName || (isEnglish ? 'Total expense' : 'Tổng chi tiêu')}</span>
                      <span className="font-bold">{budget.percentage || 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                      <div className={`h-full rounded-full ${budget.percentage >= 100 ? 'bg-red-500' : budget.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'You do not have any budgets yet.' : 'Bạn chưa có ngân sách nào.'}</p>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-[#f1f4f8] p-3 dark:bg-[#222935]">
              <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{isEnglish ? 'Smart Suggestion' : 'Gợi ý thông minh'}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                {overCount > 0
                  ? (isEnglish ? `${overCount} budgets are over limit. Prioritize adjustments now.` : `Có ${overCount} ngân sách vượt mức, nên ưu tiên điều chỉnh ngay.`)
                  : (isEnglish ? 'Things are stable; consider increasing your savings target.' : 'Tình hình ổn định, bạn có thể cân nhắc tăng mục tiêu tiết kiệm.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Budget Trend' : 'Biến động ngân sách'}</h3>
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'Compare usage by category' : 'So sánh mức sử dụng theo từng danh mục'}</p>
            </div>
            <div className="text-xs font-semibold text-[#5e6573] dark:text-[#a7afbc]">{isEnglish ? 'Top 6 categories' : 'Top 6 danh mục'}</div>
          </div>

          {analysisBudgets.length > 0 ? (
            <div className="flex items-end gap-4 h-[220px] px-2">
              {analysisBudgets.map((budget) => {
                const cap = Math.min(budget.percentage || 0, 100);
                const spentHeight = Math.max(cap, 8);
                const remainingHeight = Math.max(100 - cap, 8);
                return (
                  <div key={budget.id} className="flex-1 min-w-0">
                    <div className="h-[170px] flex items-end justify-center gap-2">
                      <div className="w-4 rounded-t-md bg-[#003d2d]" style={{ height: `${spentHeight}%` }} />
                      <div className="w-4 rounded-t-md bg-[#b7c4d8]" style={{ height: `${remainingHeight}%` }} />
                    </div>
                    <p className="mt-2 truncate text-center text-[11px] font-semibold text-[#6a7280] dark:text-[#aeb5c2]">
                      {budget.categoryName || (isEnglish ? 'Total' : 'Tổng')}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">
              {isEnglish ? 'No budget data yet.' : 'Chưa có dữ liệu ngân sách.'}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Recent Alerts' : 'Cảnh báo gần đây'}</h3>
            <span className="text-xs font-semibold text-[#3a4a62] dark:text-[#b9c3d0]">{alerts.length} {isEnglish ? 'alerts' : 'cảnh báo'}</span>
          </div>

          <div className="space-y-3">
            {alerts.length > 0 ? alerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl bg-[#f4f6f9] p-3 dark:bg-[#232936]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${alert.isOverBudget ? 'bg-[#f3d7d2] text-[#7b3e35]' : 'bg-[#f6eccf] text-[#8a6a2f]'}`}>
                    <FiAlertCircle size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1f2733] dark:text-[#e8edf4]">{alert.categoryName || (isEnglish ? 'Total budget' : 'Ngân sách tổng')}</p>
                    <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{alert.message}</p>
                  </div>
                </div>
                <p className="text-sm font-black text-[#1a1f29] dark:text-[#eff2f6]">{alert.percentage}%</p>
              </div>
            )) : (
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No alerts in this period.' : 'Không có cảnh báo nào trong kỳ này.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4 dark:border-[#2b313d]">
          <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Budget List' : 'Danh sách ngân sách'}</h3>
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: `${isEnglish ? 'All' : 'Tất cả'} (${budgets.length})` },
              { key: 'warning', label: isEnglish ? 'Warning' : 'Cảnh báo' },
              { key: 'over', label: isEnglish ? 'Over limit' : 'Vượt mức' },
              { key: 'safe', label: isEnglish ? 'Safe' : 'An toàn' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => {
                  setBudgetFilter(f.key);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  budgetFilter === f.key
                    ? 'bg-[#eceff4] text-[#1f2733] dark:bg-[#303746] dark:text-[#f1f4f8]'
                    : 'bg-[#f8f9fb] text-[#6f7480] hover:bg-[#edf1f6] dark:bg-[#232936] dark:text-[#a4acba] dark:hover:bg-[#2d3442]'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setShowModal(true)}
              className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#003d2d] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00523d]"
            >
              <FiPlus size={13} /> {isEnglish ? 'Add Budget' : 'Thêm ngân sách'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#eceff4] bg-[#f8f9fb] text-left text-xs font-bold uppercase tracking-wider text-[#7a808c] dark:border-[#2b313d] dark:bg-[#232936] dark:text-[#9fa7b4]">
                <th className="px-5 py-3">{isEnglish ? 'Description' : 'Mô tả'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Period' : 'Chu kỳ'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Spent' : 'Đã chi'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Budget' : 'Ngân sách'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Remaining' : 'Còn lại'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                <th className="px-5 py-3 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBudgets.length > 0 ? paginatedBudgets.map((budget, idx) => {
                const status = getStatus(budget.percentage || 0);
                const effectiveAmount = budget.effectiveAmount ?? budget.amount;
                const remaining = effectiveAmount - budget.currentSpending;
                return (
                  <tr key={budget.id} className={`border-b border-[#eef1f6] dark:border-[#2a303b] ${idx % 2 === 1 ? 'bg-[#fcfdff] dark:bg-[#1d222c]' : ''}`}>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1d2430] dark:text-[#eef1f5]">{budget.categoryName || (isEnglish ? 'Total expense' : 'Tổng chi tiêu')}</p>
                      <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{budget.percentage}% {isEnglish ? 'used' : 'đã sử dụng'}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#303846] dark:text-[#c9d1db]">{periodLabel(budget.period)}</td>
                    <td className="px-5 py-4 text-[#8a4340] dark:text-[#e4a5a0] font-semibold">{formatCurrency(budget.currentSpending)}</td>
                    <td className="px-5 py-4 text-[#303846] dark:text-[#c9d1db] font-semibold">{formatCurrency(effectiveAmount)}</td>
                    <td className={`px-5 py-4 font-semibold ${remaining >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {formatCurrency(remaining)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc] dark:hover:bg-[#364050]"
                          title={isEnglish ? 'Edit' : 'Chỉnh sửa'}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(budget)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8eceb] text-[#a55d56] hover:bg-[#f4dedc] dark:bg-[#3b2a2c] dark:text-[#e0a29a] dark:hover:bg-[#4a3336]"
                          title={isEnglish ? 'Delete' : 'Xóa'}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No budgets match the current filter.' : 'Không có ngân sách phù hợp với bộ lọc hiện tại.'}</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00523d]"
                    >
                      <FiPlus size={14} /> {isEnglish ? 'Add your first budget' : 'Thêm ngân sách đầu tiên'}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="px-5 pb-4">
            <Pagination
              currentPage={safeCurrentPage}
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
        <BudgetModal
          budget={editingBudget}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Budgets;
