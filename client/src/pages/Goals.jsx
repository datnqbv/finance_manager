import { useState } from 'react';
import { useGoal } from '../context/GoalContext';
import GoalModal from '../components/GoalModal';
import { FaPlus, FaEdit, FaTrash, FaCoins, FaTrophy, FaChartLine, FaFire } from 'react-icons/fa';

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
          className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FaPlus />
          <span>Tạo Mục Tiêu</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {goalStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card hover:shadow-lg dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Tổng Mục Tiêu</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {goalStats.totalGoals}
                </p>
              </div>
              <FaTrophy className="text-4xl text-blue-500 transition-transform group-hover:scale-110" />
            </div>
          </div>

          <div className="card hover:shadow-lg dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Đang Thực Hiện</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {goalStats.activeGoals}
                </p>
              </div>
              <FaFire className="text-4xl text-orange-500 transition-transform group-hover:scale-110" />
            </div>
          </div>

          <div className="card hover:shadow-lg dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Đã Hoàn Thành</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {goalStats.achievedGoals}
                </p>
              </div>
              <FaChartLine className="text-4xl text-green-500 transition-transform group-hover:scale-110" />
            </div>
          </div>

          <div className="card hover:shadow-lg dark:hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Tiến Độ Tổng</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {goalStats.overallProgress}%
                </p>
              </div>
              <div className="text-4xl transition-transform group-hover:scale-110">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'all'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Tất Cả ({goals.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'active'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Đang Thực Hiện ({goals.filter(g => !g.isAchieved).length})
        </button>
        <button
          onClick={() => setFilter('achieved')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'achieved'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Đã Hoàn Thành ({goals.filter(g => g.isAchieved).length})
        </button>
      </div>

      {/* Goals List */}
      {filteredGoals.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <FaTrophy className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Chưa có mục tiêu nào
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bắt đầu đặt mục tiêu tài chính để theo dõi tiến độ
          </p>
          <button
            onClick={openCreateModal}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Tạo Mục Tiêu Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const progress = Math.min(goal.progressPercentage || 0, 100);
            const priorityBadge = getPriorityBadge(goal.priority);
            const daysInfo = getDaysRemaining(goal.deadline);

            return (
              <div
                key={goal._id}
                className={`card hover:shadow-lg dark:hover:shadow-2xl transition-all ${
                  goal.isAchieved ? 'border-2 border-green-500' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {goal.name}
                        {goal.isAchieved && <span className="text-2xl">🏆</span>}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${priorityBadge.color}`}>
                          {priorityBadge.icon} {goal.priority}
                        </span>
                        <span className={`text-xs font-medium ${daysInfo.color}`}>
                          {daysInfo.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="text-red-500 hover:text-red-600 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <FaTrash size={18} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {goal.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {goal.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Tiến độ</span>
                    <span className="font-bold text-gray-900 dark:text-white">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color
                      }}
                    />
                  </div>
                </div>

                {/* Amount Info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Hiện tại</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Mục tiêu</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                {/* Remaining Amount */}
                {!goal.isAchieved && goal.remainingAmount > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Còn lại:</span> {formatCurrency(goal.remainingAmount)}
                    </p>
                  </div>
                )}

                {/* Add Amount Section */}
                {!goal.isAchieved && (
                  <div>
                    {showAddAmount === goal._id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={addAmountValue}
                          onChange={(e) => setAddAmountValue(e.target.value)}
                          placeholder="Nhập số tiền"
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                          min="0"
                          step="1000"
                        />
                        <button
                          onClick={() => handleAddAmount(goal._id)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all hover:scale-105"
                        >
                          Thêm
                        </button>
                        <button
                          onClick={() => {
                            setShowAddAmount(null);
                            setAddAmountValue('');
                          }}
                          className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddAmount(goal._id)}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all hover:scale-[1.02]"
                      >
                        <FaCoins />
                        <span>Thêm Tiền</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Achievement Badge */}
                {goal.isAchieved && (
                  <div className="bg-green-100 dark:bg-green-900 border-2 border-green-500 rounded-lg p-3 text-center animate-pulse">
                    <p className="text-green-700 dark:text-green-300 font-bold">
                      🎉 Đã Hoàn Thành Mục Tiêu! 🎉
                    </p>
                  </div>
                )}
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
