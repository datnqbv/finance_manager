import { createContext, useContext, useState } from 'react';
import goalService from '../services/goal.service';
import { toast } from 'react-toastify';

const GoalContext = createContext();

export const useGoal = () => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoal must be used within a GoalProvider');
  }
  return context;
};

export const GoalProvider = ({ children }) => {
  const [goals, setGoals] = useState([]);
  const [goalStats, setGoalStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isEnglish = localStorage.getItem('language') === 'en';

  // Fetch all goals
  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.getGoals();
      setGoals(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch goals');
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch goal statistics
  const fetchGoalStats = async () => {
    try {
      const data = await goalService.getGoalStats();
      setGoalStats(data.data);
    } catch (err) {
      console.error('Error fetching goal stats:', err);
    }
  };

  // Create goal
  const createGoal = async (goalData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.createGoal(goalData);
      setGoals([...goals, data.data]);
      await fetchGoalStats();
      toast.success(isEnglish ? 'Goal created successfully' : 'Tạo mục tiêu thành công');
      return { success: true, data: data.data };

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create goal';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update goal
  const updateGoal = async (id, goalData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.updateGoal(id, goalData);
      setGoals(goals.map(g => g.id === id ? data.data : g));
      await fetchGoalStats();
      toast.success(isEnglish ? 'Goal updated successfully!' : 'Mục tiêu đã được cập nhật thành công!');
       return { success: true, data: data.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update goal';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Delete goal
  const deleteGoal = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await goalService.deleteGoal(id);
      setGoals(goals.filter(g => g.id !== id));
      await fetchGoalStats();
      toast.success(isEnglish ? 'Goal deleted successfully!' : 'Mục tiêu đã được xóa thành công!');
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete goal';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Add amount to goal
  const addAmountToGoal = async (id, amount, note = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.addAmountToGoal(id, amount, note);
      setGoals(goals.map(g => g.id === id ? data.data : g));
      await fetchGoalStats();
      return { success: true, data: data.data, message: data.message };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add amount';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    goals,
    goalStats,
    loading,
    error,
    fetchGoals,
    fetchGoalStats,
    createGoal,
    updateGoal,
    deleteGoal,
    addAmountToGoal
  };

  return (
    <GoalContext.Provider value={value}>
      {children}
    </GoalContext.Provider>
  );
};
