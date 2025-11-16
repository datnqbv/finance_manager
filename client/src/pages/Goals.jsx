import { useState } from 'react';
import { useGoal } from '../context/GoalContext';
import GoalModal from '../components/GoalModal';
import { FaPlus, FaEdit, FaTrash, FaTrophy, FaFire, FaCheck } from 'react-icons/fa';

const Goals = () => {
  const { goals, goalStats, loading, createGoal, updateGoal, deleteGoal, addAmountToGoal } = useGoal();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showAddAmount, setShowAddAmount] = useState(null);
  const [addAmountValue, setAddAmountValue] = useState('');
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

    const result = await addAmountToGoal(goalId, amount);
    if (result.success) {
      setShowAddAmount(null);
      setAddAmountValue('');
      
      // Show celebration if goal is achieved
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
      low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: '⚪' },
      medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: '🟡' },
      high: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: '🔴' }
    };
    return badges[priority] || badges.medium;
  };

  const getDaysRemaining = (deadline) => {
    const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Quá hạn', color: 'text-red-500' };
    if (days === 0) return { text: 'Hôm nay', color: 'text-red-500' };
    if (days === 1) return { text: 'Còn 1 ngày', color: 'text-orange-500' };
    if (days <= 7) return { text: `Còn ${days} ngày`, color: 'text-orange-500' };
    if (days <= 30) return { text: `Còn ${days} ngày`, color: 'text-yellow-600' };
    return { text: `Còn ${days} ngày`, color: 'text-green-600' };
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'active') return !goal.isAchieved;
    if (filter === 'achieved') return goal.isAchieved;
    return true;
  });

  if (loading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Đang tải mục tiêu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FaTrophy className="text-yellow-500" />
            Mục Tiêu Tài Chính
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Theo dõi và đạt được ước mơ tài chính của bạn
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl hover:bg-primary-600 transition-all hover:scale-105 shadow-lg shadow-primary-500/30"
        >
          <FaPlus />
          <span>Tạo Mục Tiêu</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {goalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tổng Mục Tiêu</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goalStats.totalGoals}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center transition-transform group-hover:scale-110">
                <FaTrophy className="text-2xl text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Đang Thực Hiện</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goalStats.activeGoals}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center transition-transform group-hover:scale-110">
                <FaFire className="text-2xl text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Đã Hoàn Thành</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goalStats.achievedGoals}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                <FaCheck className="text-2xl text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111111] rounded-xl p-5 border border-gray-200 dark:border-[#2a2a2a] hover:shadow-xl dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Tiến Độ Tổng</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {goalStats.overallProgress}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-2xl transition-transform group-hover:scale-110">
                📊
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white dark:bg-[#111111] rounded-xl p-2 border border-gray-200 dark:border-[#2a2a2a]">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
            filter === 'all'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
          }`}
        >
          Tất Cả ({goals.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
            filter === 'active'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
          }`}
        >
          Đang Thực Hiện ({goals.filter(g => !g.isAchieved).length})
        </button>
        <button
          onClick={() => setFilter('achieved')}
          className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-all ${
            filter === 'achieved'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]'
          }`}
        >
          Đã Hoàn Thành ({goals.filter(g => g.isAchieved).length})
        </button>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-[#2a2a2a] p-12 text-center">
          <FaTrophy className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Chưa có mục tiêu nào
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bắt đầu đặt mục tiêu tài chính để theo dõi tiến độ
          </p>
          <button
            onClick={openCreateModal}
            className="bg-primary-500 text-white px-6 py-2 rounded-xl hover:bg-primary-600 transition-all hover:scale-105"
          >
            Tạo Mục Tiêu Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGoals.map((goal) => {
            const progress = Math.min(goal.progressPercentage || 0, 100);
            const priorityBadge = getPriorityBadge(goal.priority);
            const daysInfo = getDaysRemaining(goal.deadline);

            return (
              <div
                key={goal._id}
                className={`bg-white dark:bg-[#111111] rounded-2xl border ${
                  goal.isAchieved 
                    ? 'border-green-500 shadow-xl shadow-green-500/20' 
                    : 'border-gray-200 dark:border-[#2a2a2a]'
                } hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
              >
                {/* Card Header with Icon */}
                <div className="relative p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transition-transform group-hover:scale-110"
                        style={{ 
                          backgroundColor: goal.color + '20',
                          border: `2px solid ${goal.color}40`
                        }}
                      >
                        {goal.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          {goal.name}
                          {goal.isAchieved && <FaCheck className="text-green-500" />}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityBadge.color}`}>
                            {goal.priority === 'low' && 'Thấp'}
                            {goal.priority === 'medium' && 'Trung bình'}
                            {goal.priority === 'high' && 'Cao'}
                          </span>
                          <span className={`text-xs font-semibold ${daysInfo.color}`}>
                            {daysInfo.text}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-all"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Progress Section */}
                <div className="px-6 pb-6">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Tiến độ</span>
                      <span className="font-bold text-xl" style={{ color: goal.color }}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-200 dark:bg-[#1a1a1a] rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                        style={{
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${goal.color} 0%, ${goal.color}dd 100%)`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 border border-gray-200 dark:border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hiện tại</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-3 border border-gray-200 dark:border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mục tiêu</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Achievement Badge or Add Amount */}
                  {goal.isAchieved ? (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-center shadow-lg">
                      <p className="text-white font-bold flex items-center justify-center gap-2">
                        <FaCheck className="text-xl" />
                        Đã Hoàn Thành Mục Tiêu!
                      </p>
                    </div>
                  ) : (
                    <>
                      {showAddAmount === goal._id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={addAmountValue}
                            onChange={(e) => setAddAmountValue(e.target.value)}
                            placeholder="Nhập số tiền"
                            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-[#2a2a2a] rounded-xl dark:bg-[#1a1a1a] dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                            min="0"
                            step="1000"
                          />
                          <button
                            onClick={() => handleAddAmount(goal._id)}
                            className="bg-green-500 text-white px-4 py-2.5 rounded-xl hover:bg-green-600 transition-all hover:scale-105 font-medium"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setShowAddAmount(null);
                              setAddAmountValue('');
                            }}
                            className="bg-gray-300 dark:bg-[#2a2a2a] text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-400 dark:hover:bg-[#333333] transition-all"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddAmount(goal._id)}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-[1.02] font-medium shadow-lg shadow-green-500/30"
                        >
                          + Thêm Tiền
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
