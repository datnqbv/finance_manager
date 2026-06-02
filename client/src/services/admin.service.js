import api from './api';

export const adminService = {
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  updateUserVip: async (id, payload) => {
    const response = await api.patch(`/admin/users/${id}/vip`, payload);
    return response.data;
  },

  toggleUserBan: async (id, payload) => {
    const response = await api.patch(`/admin/users/${id}/ban`, payload);
    return response.data;
  },

  resetUserPassword: async (id, payload) => {
    const response = await api.patch(`/admin/users/${id}/password`, payload);
    return response.data;
  },
};
