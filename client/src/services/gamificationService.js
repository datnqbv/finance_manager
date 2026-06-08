import api from './api';

export const gamificationService = {
  getLeaderboard: async (limit = 10) => {
    const response = await api.get(`/gamification/leaderboard?limit=${limit}`);
    return response.data;
  }
};
