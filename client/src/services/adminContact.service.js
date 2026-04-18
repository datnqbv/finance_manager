import api from './api';

export const adminContactService = {
  getMessages: async (params = {}) => {
    const response = await api.get('/contact/messages', { params });
    return response.data;
  },

  updateMessage: async (id, payload) => {
    const response = await api.put(`/contact/messages/${id}`, payload);
    return response.data;
  },

  deleteMessage: async (id) => {
    const response = await api.delete(`/contact/messages/${id}`);
    return response.data;
  },
};
