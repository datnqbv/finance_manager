import { createContext, useContext, useState, useEffect } from 'react';
import goalService from '../services/goal.service';
import { useAuth } from './AuthContext';
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
  const { user } = useAuth();

  // Fetch all goals
  const fetchGoals = async () => {
    if (!user) return;
    
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
    if (!user) return;
    
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
      toast.success('Tạo mục tiêu thành công');
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
      setGoals(goals.map(g => g._id === id ? data.data : g));
      await fetchGoalStats();
      toast.success('Mục tiêu đã được cập nhật thành công!');
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
      setGoals(goals.filter(g => g._id !== id));
      await fetchGoalStats();
      toast.success('Mục tiêu đã được xóa thành công!');
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
  const addAmountToGoal = async (id, amount) => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalService.addAmountToGoal(id, amount);
      setGoals(goals.map(g => g._id === id ? data.data : g));
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

  // Load goals when user changes
  useEffect(() => {
    if (user) {
      fetchGoals();
      fetchGoalStats();
    } else {
      setGoals([]);
      setGoalStats(null);
    }
  }, [user]);

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
