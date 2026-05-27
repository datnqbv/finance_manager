import { useEffect, useState } from 'react';
import { useGoal } from '../context/GoalContext';
import { useLanguage } from '../context/LanguageContext';
import GoalModal from '../components/GoalModal';
import { FiPlus, FiEdit2, FiTrash2, FiTarget, FiClock } from 'react-icons/fi';
import { GoalsSkeleton } from '../components/LoadingSkeleton';
import CurrencyInput from '../components/CurrencyInput';
import Pagination from '../components/Pagination';

const Goals = () => {
  const ITEMS_PER_PAGE = 8;
  const { goals, goalStats, loading, fetchGoals, fetchGoalStats, createGoal, updateGoal, deleteGoal, addAmountToGoal } = useGoal();
  const { t, language } = useLanguage();
  const isEnglish = language === 'en';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showAddAmount, setShowAddAmount] = useState(null);
  const [addAmountValue, setAddAmountValue] = useState('');
  const [addAmountNote, setAddAmountNote] = useState('');
  const [showHistory, setShowHistory] = useState(null); // goal.id
  const [filter, setFilter] = useState('all'); // all, active, achieved
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchGoals();
    fetchGoalStats();
  }, []);

  const handleCreateGoal = async (goalData) => {
    const result = await createGoal(goalData);
    if (result.success) {
      setIsModalOpen(false);
      setSelectedGoal(null);
    }
  };

  const handleUpdateGoal = async (goalData) => {
    const result = await updateGoal(selectedGoal.id, goalData);
    if (result.success) {
      setIsModalOpen(false);
      setSelectedGoal(null);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm(isEnglish ? 'Are you sure you want to delete this goal?' : 'Bạn có chắc chắn muốn xóa mục tiêu này?')) {
      await deleteGoal(id);
    }
  };

  const handleAddAmount = async (goalId) => {
    const amount = parseFloat(addAmountValue);
    if (isNaN(amount) || amount <= 0) {
      alert(isEnglish ? 'Please enter a valid amount' : 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    const result = await addAmountToGoal(goalId, amount, addAmountNote.trim());
    if (result.success) {
      setShowAddAmount(null);
      setAddAmountValue('');
      setAddAmountNote('');
      if (result.message && result.message.includes('achieved')) {
        alert((isEnglish ? '🎉 ' : '🎉 ') + result.message);
      }
    }
  };

  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedGoal(null);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(isEnglish ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low:    { bg: 'bg-gray-100 dark:bg-[#2a2a2a]',   text: 'text-gray-500 dark:text-gray-400',   label: isEnglish ? 'Low' : 'Thấp',      dot: '⚪' },
      medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: isEnglish ? 'Medium' : 'Trung bình', dot: '🟡' },
      high:   { bg: 'bg-red-50 dark:bg-red-500/10',    text: 'text-red-600 dark:text-red-400',     label: isEnglish ? 'High' : 'Cao',       dot: '🔴' },
    };
    return badges[priority] || badges.medium;
  };

  const getDaysRemaining = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0)  return { text: isEnglish ? 'Overdue' : 'Quá hạn',       color: 'text-red-600 dark:text-red-400' };
    if (days === 0) return { text: isEnglish ? 'Today' : 'Hôm nay',       color: 'text-red-600 dark:text-red-400' };
    if (days === 1) return { text: isEnglish ? '1 day left' : 'Còn 1 ngày',    color: 'text-amber-600 dark:text-amber-400' };
    if (days <= 7)  return { text: isEnglish ? `${days} days left` : `Còn ${days} ngày`, color: 'text-amber-600 dark:text-amber-400' };
    if (days <= 30) return { text: isEnglish ? `${days} days left` : `Còn ${days} ngày`, color: 'text-yellow-600 dark:text-yellow-400' };
    return              { text: isEnglish ? `${days} days left` : `Còn ${days} ngày`, color: 'text-emerald-600 dark:text-emerald-400' };
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active')   return !goal.isAchieved;
    if (filter === 'achieved') return goal.isAchieved;
    return true;
  });

  const totalItems = filteredGoals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedGoals = filteredGoals.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );

  if (loading && goals.length === 0) {
    return <GoalsSkeleton />;
  }
  // tiến độ chung: tổng mục tiêu, đã đạt, còn thiếu, % hoàn thành
  const activeCount   = goals.filter(g => !g.isAchieved).length;
  const achievedCount = goals.filter(g => g.isAchieved).length;
  const totalTarget = goals.reduce((sum, g) => sum + (parseFloat(g.targetAmount) || 0), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + (parseFloat(g.currentAmount) || 0), 0);
  const totalRemaining = totalTarget - totalCurrent;
  const overallProgress = totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;
  const topProgressGoals = [...goals]
    .filter(g => !g.isAchieved)
    .sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0))
    .slice(0, 3);
  const deadlineGoals = [...goals]
    .filter(g => !g.isAchieved)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);
  const chartGoals = [...goals]
    .sort((a, b) => (b.targetAmount || 0) - (a.targetAmount || 0))
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-[#004b38] p-6 text-white shadow-[0_14px_40px_rgba(1,56,42,0.28)] relative overflow-hidden">
          <div className="absolute -right-8 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-[#4c8f7a] opacity-35" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <FiTarget size={18} className="text-[#b8e4d6]" />
              <p className="text-xs uppercase tracking-[0.18em] text-[#9ed3c3]">{isEnglish ? 'Financial Goals' : 'Mục tiêu tài chính'}</p>
            </div>
            <h1 className="mt-3 text-5xl font-black tracking-tight">{formatCurrency(totalTarget)}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#d8fff2]">
              {overallProgress.toFixed(1)}% {isEnglish ? 'of goals completed' : 'tổng mục tiêu đã hoàn thành'}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#1e6b57] pt-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Currently saved' : 'Đang tích lũy'}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCurrent)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Remaining' : 'Còn thiếu'}</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(Math.max(totalRemaining, 0))}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#9ed3c3]">{isEnglish ? 'Completed' : 'Hoàn thành'}</p>
                <p className="mt-1 text-2xl font-bold">{achievedCount}/{goals.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
          <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Goal Progress' : 'Tiến độ mục tiêu'}</h3>
              <button onClick={openCreateModal} className="text-xs font-semibold text-[#3a4a62] hover:underline dark:text-[#b9c3d0]">
                {isEnglish ? 'Add New' : 'Thêm mới'}
              </button>
            </div>

            <div className="space-y-3">
              {topProgressGoals.length > 0 ? topProgressGoals.map((goal) => (
                <div key={goal.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-[#586074] dark:text-[#a9afbb]">
                    <span className="font-semibold truncate pr-3">{goal.name}</span>
                    <span className="font-bold">{(goal.progressPercentage || 0).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(goal.progressPercentage || 0, 100)}%`, backgroundColor: goal.color || '#0f766e' }} />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'You do not have any goals yet.' : 'Bạn chưa có mục tiêu nào.'}</p>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-[#f1f4f8] p-3 dark:bg-[#222935]">
              <p className="text-xs font-semibold text-[#5a6374] dark:text-[#adb5c3]">{isEnglish ? 'Smart Suggestion' : 'Gợi ý thông minh'}</p>
              <p className="mt-1 text-sm font-semibold text-[#1f2733] dark:text-[#e8edf4]">
                {activeCount > 0
                  ? (isEnglish ? 'Prioritize regular deposits for near-deadline goals to improve completion rate.' : 'Ưu tiên nạp đều cho mục tiêu gần hạn để tăng tỷ lệ hoàn thành.')
                  : (isEnglish ? 'Great! You have completed all your current goals.' : 'Tuyệt vời! Bạn đã hoàn thành mọi mục tiêu hiện tại.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-8 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Goal Trend' : 'Biến động mục tiêu'}</h3>
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'Reached vs remaining for each goal' : 'Đã đạt và còn lại theo từng mục tiêu'}</p>
            </div>
            <div className="text-xs font-semibold text-[#5e6573] dark:text-[#a7afbc]">{isEnglish ? 'Top 6 goals' : 'Top 6 mục tiêu'}</div>
          </div>

          {chartGoals.length > 0 ? (
            <div className="flex items-end gap-4 h-[220px] px-2">
              {chartGoals.map((goal) => {
                const progress = Math.min(goal.progressPercentage || 0, 100);
                const reachedHeight = Math.max(progress, 8);
                const remainHeight = Math.max(100 - progress, 8);
                return (
                  <div key={goal.id} className="flex-1 min-w-0">
                    <div className="h-[170px] flex items-end justify-center gap-2">
                      <div className="w-4 rounded-t-md bg-[#003d2d]" style={{ height: `${reachedHeight}%` }} />
                      <div className="w-4 rounded-t-md bg-[#b7c4d8]" style={{ height: `${remainHeight}%` }} />
                    </div>
                    <p className="mt-2 truncate text-center text-[11px] font-semibold text-[#6a7280] dark:text-[#aeb5c2]">
                      {goal.name}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#6f7480] dark:text-[#a4acba]">
              {isEnglish ? 'No goal data yet.' : 'Chưa có dữ liệu mục tiêu.'}
            </div>
          )}
        </div>

        <div className="xl:col-span-4 rounded-xl bg-white p-5 shadow-sm dark:bg-[#191d25]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Upcoming Deadlines' : 'Hạn sắp tới'}</h3>
            <span className="text-xs font-semibold text-[#3a4a62] dark:text-[#b9c3d0]">{isEnglish ? 'Goal timeline' : 'Lịch mục tiêu'}</span>
          </div>

          <div className="space-y-3">
            {deadlineGoals.length > 0 ? deadlineGoals.map((goal) => {
              const daysInfo = getDaysRemaining(goal.deadline);
              return (
                <div key={goal.id} className="flex items-center justify-between rounded-xl bg-[#f4f6f9] p-3 dark:bg-[#232936]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#dfe8f6] text-[#476082] flex items-center justify-center font-bold">
                      <FiClock size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1f2733] dark:text-[#e8edf4]">{goal.name}</p>
                      <p className={`text-xs ${daysInfo.color}`}>{daysInfo.text}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#1a1f29] dark:text-[#eff2f6]">{(goal.progressPercentage || 0).toFixed(0)}%</p>
                </div>
              );
            }) : (
              <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No active goals.' : 'Không có mục tiêu đang chạy.'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm dark:bg-[#191d25]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceff4] px-5 py-4 dark:border-[#2b313d]">
          <h3 className="text-2xl font-bold text-[#181c24] dark:text-[#eef1f5]">{isEnglish ? 'Goal List' : 'Danh sách mục tiêu'}</h3>
          <div className="flex items-center gap-2">
            {[
              { label: `${isEnglish ? 'All' : 'Tất cả'} (${goals.length})`, value: 'all' },
              { label: `${isEnglish ? 'Active' : 'Đang thực hiện'} (${activeCount})`, value: 'active' },
              { label: `${isEnglish ? 'Completed' : 'Hoàn thành'} (${achievedCount})`, value: 'achieved' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? 'bg-[#eceff4] text-[#1f2733] dark:bg-[#303746] dark:text-[#f1f4f8]'
                    : 'bg-[#f8f9fb] text-[#6f7480] hover:bg-[#edf1f6] dark:bg-[#232936] dark:text-[#a4acba] dark:hover:bg-[#2d3442]'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={openCreateModal}
              className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#003d2d] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#00523d]"
            >
              <FiPlus size={13} /> {isEnglish ? 'Create Goal' : 'Tạo mục tiêu'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#eceff4] bg-[#f8f9fb] text-left text-xs font-bold uppercase tracking-wider text-[#7a808c] dark:border-[#2b313d] dark:bg-[#232936] dark:text-[#9fa7b4]">
                <th className="px-5 py-3">{isEnglish ? 'Goal' : 'Mục tiêu'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Progress' : 'Tiến độ'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Saved' : 'Đã đạt'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Target' : 'Mục tiêu'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Deadline' : 'Hạn'}</th>
                <th className="px-5 py-3">{isEnglish ? 'Status' : 'Trạng thái'}</th>
                <th className="px-5 py-3 text-right">{isEnglish ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGoals.length > 0 ? paginatedGoals.map((goal, idx) => {
                const progress = Math.min(goal.progressPercentage || 0, 100);
                const remaining = goal.targetAmount - goal.currentAmount;
                const daysInfo = getDaysRemaining(goal.deadline);
                const priority = getPriorityBadge(goal.priority);
                return [
                    <tr key={`row-${goal.id}`} className={`border-b border-[#eef1f6] dark:border-[#2a303b] ${idx % 2 === 1 ? 'bg-[#fcfdff] dark:bg-[#1d222c]' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${goal.color || '#3b82f6'}1f` }}>
                            {goal.icon || '🎯'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[#1d2430] dark:text-[#eef1f5]">{goal.name}</p>
                            <p className="text-xs text-[#6f7480] dark:text-[#a4acba]">{goal.description || (isEnglish ? 'Personal financial goal' : 'Mục tiêu tài chính cá nhân')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-28">
                          <p className="text-xs font-semibold text-[#4f596b] dark:text-[#b9c3d1] mb-1">{progress.toFixed(1)}%</p>
                          <div className="h-2 rounded-full bg-[#e3e7ee] dark:bg-[#2d3340]">
                            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: goal.color || '#3b82f6' }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-[#303846] dark:text-[#c9d1db] font-semibold">{formatCurrency(goal.currentAmount)}</td>
                      <td className="px-5 py-4 text-[#303846] dark:text-[#c9d1db] font-semibold">{formatCurrency(goal.targetAmount)}</td>
                      <td className="px-5 py-4 text-xs font-semibold">
                        <span className={daysInfo.color}>{daysInfo.text}</span>
                      </td>
                      <td className="px-5 py-4">
                        {goal.isAchieved ? (
                          <span className="rounded-full bg-[#e4f8ef] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#12724e] dark:bg-[#213c33] dark:text-[#80d6b4]">
                            {isEnglish ? 'Completed' : 'Hoàn thành'}
                          </span>
                        ) : (
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${priority.bg} ${priority.text}`}>
                            {priority.label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {!goal.isAchieved && (
                            <button
                              onClick={() => {
                                setShowAddAmount(showAddAmount === goal.id ? null : goal.id);
                                setShowHistory(null);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#e7f6ee] text-[#1f7d55] hover:bg-[#d7f0e4] dark:bg-[#204236] dark:text-[#8edbbb] dark:hover:bg-[#285344]"
                              title={isEnglish ? 'Add amount' : 'Nạp thêm'}
                            >
                              <FiPlus size={14} />
                            </button>
                          )}
                          {(goal.depositHistory?.length ?? 0) > 0 && (
                            <button
                              onClick={() => {
                                setShowHistory(showHistory === goal.id ? null : goal.id);
                                setShowAddAmount(null);
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc] dark:hover:bg-[#364050]"
                              title={isEnglish ? 'History' : 'Lịch sử'}
                            >
                              <FiClock size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(goal)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef2f7] text-[#5c6676] hover:bg-[#dfe6ef] dark:bg-[#2a303b] dark:text-[#b8c0cc] dark:hover:bg-[#364050]"
                            title={isEnglish ? 'Edit' : 'Chỉnh sửa'}
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f8eceb] text-[#a55d56] hover:bg-[#f4dedc] dark:bg-[#3b2a2c] dark:text-[#e0a29a] dark:hover:bg-[#4a3336]"
                            title={isEnglish ? 'Delete' : 'Xóa'}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>,

                    showAddAmount === goal.id ? (
                      <tr key={`add-${goal.id}`} className="border-b border-[#eef1f6] dark:border-[#2a303b] bg-[#f8fbfa] dark:bg-[#1f2d29]">
                        <td colSpan={7} className="px-5 py-3">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            <div className="md:w-64">
                              <CurrencyInput
                                value={addAmountValue}
                                onChange={v => setAddAmountValue(v)}
                                placeholder={isEnglish ? 'Additional amount' : 'Số tiền nạp thêm'}
                                baseClass="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#334640] rounded-xl dark:bg-[#18231f] dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                            <input
                              type="text"
                              value={addAmountNote}
                              onChange={(e) => setAddAmountNote(e.target.value)}
                              placeholder={isEnglish ? 'Note (optional)...' : 'Ghi chú (tùy chọn)...'}
                              className="md:flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#334640] rounded-xl dark:bg-[#18231f] dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAddAmount(goal.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                              >
                                {isEnglish ? 'Confirm' : 'Xác nhận'}
                              </button>
                              <button
                                onClick={() => { setShowAddAmount(null); setAddAmountValue(''); setAddAmountNote(''); }}
                                className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                              >
                                {isEnglish ? 'Cancel' : 'Hủy'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null,

                    showHistory === goal.id ? (
                      <tr key={`history-${goal.id}`} className="border-b border-[#eef1f6] dark:border-[#2a303b] bg-[#f9fafc] dark:bg-[#212734]">
                        <td colSpan={7} className="px-5 py-3">
                          <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-[#2b3241] rounded-xl border border-[#e8edf4] dark:border-[#2f3748]">
                            {[...goal.depositHistory].reverse().map((entry, i) => (
                              <div key={i} className="flex items-start justify-between gap-2 px-3 py-2.5">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(entry.amount)}</p>
                                  {entry.note && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{entry.note}</p>}
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                                  {new Date(entry.date).toLocaleDateString(isEnglish ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null,
                ];
              }) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <p className="text-sm text-[#6f7480] dark:text-[#a4acba]">{isEnglish ? 'No goals match the current filter.' : 'Không có mục tiêu phù hợp với bộ lọc hiện tại.'}</p>
                    <button
                      onClick={openCreateModal}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#003d2d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00523d]"
                    >
                      <FiPlus size={14} /> {isEnglish ? 'Create your first goal' : 'Tạo mục tiêu đầu tiên'}
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
      <GoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedGoal(null);
        }}
        onSubmit={selectedGoal ? handleUpdateGoal : handleCreateGoal}
        goal={selectedGoal}
      />
    </div>
  );
};

export default Goals;
