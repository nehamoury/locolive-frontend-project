import api from './api';

export const chatService = {
  getConversations: () => api.get('/chats'),
  getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId: string, text: string) => 
    api.post(`/chats/${chatId}/messages`, { text }),
};

export default chatService;
