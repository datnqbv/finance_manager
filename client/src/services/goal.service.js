import api from './api';

const goalService = {
  // Get all goals
  getGoals: async () => {
    const response = await api.get('/goals');
    return response.data;
  },

  // Get a single goal
  getGoal: async (id) => {
    const response = await api.get(`/goals/${id}`);
    return response.data;
  },

  // Create a new goal
  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  // Update a goal
  updateGoal: async (id, goalData) => {
    const response = await api.put(`/goals/${id}`, goalData);
    return response.data;
  },

  // Delete a goal
  deleteGoal: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  },

  // Add amount to goal
  addAmountToGoal: async (id, amount) => {
    const response = await api.post(`/goals/${id}/add-amount`, { amount });
    return response.data;
  },

  // Get goal statistics
  getGoalStats: async () => {
    const response = await api.get('/goals/stats');
    return response.data;
  }
};

export default goalService;
