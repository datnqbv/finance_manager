import { useState } from 'react';
import { useGoal } from '../context/GoalContext';
import GoalModal from '../components/GoalModal';
import { FiPlus, FiEdit2, FiTrash2, FiTarget, FiClock } from 'react-icons/fi';
import { GoalsSkeleton } from '../components/LoadingSkeleton';
import CurrencyInput from '../components/CurrencyInput';

const Goals = () => {
  const { goals, goalStats, loading, createGoal, updateGoal, deleteGoal, addAmountToGoal } = useGoal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showAddAmount, setShowAddAmount] = useState(null);
  const [addAmountValue, setAddAmountValue] = useState('');
  const [addAmountNote, setAddAmountNote] = useState('');
  const [showHistory, setShowHistory] = useState(null); // goal._id
  const [filter, setFilter] = useState('all'); // all, active, achieved

  const handleCreateGoal = async (goalData) => {
    const result = await createGoal(goalData);
    if (result.success) {
      setIsModalOpen(false);
      setSelectedGoal(null);
    }
  };

  const handleUpdateGoal = async (goalData) => {
    const result = await updateGoal(selectedGoal._id, goalData);
    if (result.success) {
      setIsModalOpen(false);
      setSelectedGoal(null);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục tiêu này?')) {
      await deleteGoal(id);
    }
  };

  const handleAddAmount = async (goalId) => {
    const amount = parseFloat(addAmountValue);
    if (isNaN(amount) || amount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    const result = await addAmountToGoal(goalId, amount, addAmountNote.trim());
    if (result.success) {
      setShowAddAmount(null);
      setAddAmountValue('');
      setAddAmountNote('');
      if (result.message && result.message.includes('achieved')) {
        alert('🎉 ' + result.message);
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
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low:    { bg: 'bg-gray-100 dark:bg-[#2a2a2a]',   text: 'text-gray-500 dark:text-gray-400',   label: 'Thấp',      dot: '⚪' },
      medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Trung bình', dot: '🟡' },
      high:   { bg: 'bg-red-50 dark:bg-red-500/10',    text: 'text-red-600 dark:text-red-400',     label: 'Cao',       dot: '🔴' },
    };
    return badges[priority] || badges.medium;
  };

  const getDaysRemaining = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0)  return { text: 'Quá hạn',       color: 'text-red-600 dark:text-red-400' };
    if (days === 0) return { text: 'Hôm nay',       color: 'text-red-600 dark:text-red-400' };
    if (days === 1) return { text: 'Còn 1 ngày',    color: 'text-amber-600 dark:text-amber-400' };
    if (days <= 7)  return { text: `Còn ${days} ngày`, color: 'text-amber-600 dark:text-amber-400' };
    if (days <= 30) return { text: `Còn ${days} ngày`, color: 'text-yellow-600 dark:text-yellow-400' };
    return              { text: `Còn ${days} ngày`, color: 'text-emerald-600 dark:text-emerald-400' };
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active')   return !goal.isAchieved;
    if (filter === 'achieved') return goal.isAchieved;
    return true;
  });

  if (loading && goals.length === 0) {
    return <GoalsSkeleton />;
  }

  const activeCount   = goals.filter(g => !g.isAchieved).length;
  const achievedCount = goals.filter(g => g.isAchieved).length;

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FiTarget className="text-gray-500 dark:text-gray-400" size={20} />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mục tiêu tài chính</h1>
            <span className="text-xs bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
              {goals.length} mục tiêu
            </span>
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 ml-7">Theo dõi và đạt được ước mơ tài chính của bạn</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
        >
          <FiPlus size={16} /> Tạo mục tiêu
        </button>
      </div>

      {/* ── Stats ── */}
      {goalStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Tổng mục tiêu',    value: goalStats.totalGoals,     border: 'border-l-gray-400',    icon: '🏆', valueColor: 'text-gray-800 dark:text-gray-100' },
            { label: 'Đang thực hiện',   value: goalStats.activeGoals,    border: 'border-l-amber-500',   icon: '🔥', valueColor: 'text-amber-600 dark:text-amber-400' },
            { label: 'Đã hoàn thành',    value: goalStats.achievedGoals,  border: 'border-l-emerald-500', icon: '✅', valueColor: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Tiến độ tổng',     value: `${goalStats.overallProgress}%`, border: 'border-l-blue-500', icon: '📊', valueColor: 'text-blue-600 dark:text-blue-400' },
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
      )}

      {/* ── Filter tabs ── */}
      <div className="flex items-center bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded-xl gap-0.5 w-fit">
        {[
          { label: `Tất cả (${goals.length})`,           value: 'all' },
          { label: `Đang thực hiện (${activeCount})`,    value: 'active' },
          { label: `Hoàn thành (${achievedCount})`,      value: 'achieved' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              filter === f.value
                ? 'bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Goal Cards ── */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🏆
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Chưa có mục tiêu nào</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Bắt đầu đặt mục tiêu tài chính để theo dõi tiến độ</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <FiPlus size={15} /> Tạo mục tiêu đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => {
            const progress      = Math.min(goal.progressPercentage || 0, 100);
            const priorityBadge = getPriorityBadge(goal.priority);
            const daysInfo      = getDaysRemaining(goal.deadline);
            const remaining     = goal.targetAmount - goal.currentAmount;

            return (
              <div
                key={goal._id}
                className={`group bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] border-l-4 rounded-2xl p-5 hover:shadow-md transition-all duration-200 ${
                  goal.isAchieved ? 'border-l-emerald-500' : 'border-l-blue-500'
                }`}
              >
                {/* Top: icon + name + badges + actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: (goal.color || '#3b82f6') + '20' }}
                    >
                      {goal.icon || '🎯'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        {goal.name}
                        {goal.isAchieved && <span className="text-emerald-500 text-base">✓</span>}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadge.bg} ${priorityBadge.text}`}>
                          {priorityBadge.label}
                        </span>
                        {!goal.isAchieved && (
                          <span className={`text-xs font-medium ${daysInfo.color}`}>
                            {daysInfo.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover-reveal action buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0 ml-2">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-500/20 dark:hover:text-blue-400 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400 transition-colors"
                      title="Xóa"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                    {goal.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Tiến độ</span>
                    <span className="text-sm font-black" style={{ color: goal.color || '#3b82f6' }}>
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: goal.color || '#3b82f6' }}
                    />
                  </div>
                </div>

                {/* Amount stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Hiện tại</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Mục tiêu</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 leading-tight">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl py-2.5 px-1">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Còn thiếu</p>
                    <p className={`text-xs font-bold leading-tight ${
                      remaining <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {remaining <= 0 ? 'Đủ rồi!' : formatCurrency(remaining)}
                    </p>
                  </div>
                </div>

                {/* Achieved banner or Add amount */}
                {goal.isAchieved ? (
                  <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                    <span className="text-base">🎉</span>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Đã hoàn thành mục tiêu!</p>
                  </div>
                ) : showAddAmount === goal._id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <CurrencyInput
                        value={addAmountValue}
                        onChange={v => setAddAmountValue(v)}
                        placeholder="Số tiền"
                        baseClass="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-xl dark:bg-[#1a1a1a] dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        onClick={() => handleAddAmount(goal._id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setShowAddAmount(null); setAddAmountValue(''); setAddAmountNote(''); }}
                        className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-400 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                    <input
                      type="text"
                      value={addAmountNote}
                      onChange={(e) => setAddAmountNote(e.target.value)}
                      placeholder="Ghi chú (tùy chọn)..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#2a2a2a] rounded-xl dark:bg-[#1a1a1a] dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddAmount(goal._id)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 transition-colors"
                  >
                    + Thêm tiền tích lũy
                  </button>
                )}

                {/* History button */}
                {(goal.depositHistory?.length ?? 0) > 0 && (
                  <button
                    onClick={() => setShowHistory(showHistory === goal._id ? null : goal._id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border border-gray-100 dark:border-[#2a2a2a] transition-colors mt-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <FiClock size={12} />
                      Lịch sử nạp tiền
                    </span>
                    <span className="bg-gray-100 dark:bg-[#2a2a2a] text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                      {goal.depositHistory.length}
                    </span>
                  </button>
                )}

                {/* History drawer */}
                {showHistory === goal._id && (
                  <div className="mt-2 border border-gray-100 dark:border-[#2a2a2a] rounded-xl overflow-hidden">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Lịch sử nạp tiền
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-[#222]">
                      {[...goal.depositHistory].reverse().map((entry, i) => (
                        <div key={i} className="flex items-start justify-between gap-2 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(entry.amount)}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{entry.note}</p>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                            {new Date(entry.date).toLocaleDateString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric'
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new goal card */}
          <button
            onClick={openCreateModal}
            className="border-2 border-dashed border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600 hover:border-emerald-400 hover:text-emerald-500 dark:hover:border-emerald-500/50 dark:hover:text-emerald-500 transition-colors group min-h-[200px]"
          >
            <FiPlus size={22} className="transition-transform group-hover:scale-110" />
            <span className="text-sm font-medium">Thêm mục tiêu</span>
          </button>
        </div>
      )}

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
