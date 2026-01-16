import api from './api';

export const sendChatMessage = async (message, userContext = null) => {
  try {
    const response = await api.post('/chat/message', { 
      message,
      context: userContext
    });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};
