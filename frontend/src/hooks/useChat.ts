import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
  media_url?: string;
  media_type?: string;
}

export const useChat = (targetUserId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  const fetchHistory = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const response = await api.get('/messages', {
        params: { user_id: targetUserId }
      });
      setMessages(response.data || []);
      
      // Mark messages as read since we just opened the chat
      await api.put(`/messages/read/${targetUserId}`);
    } catch (err: any) {
      if (err.response?.status === 403) {
        console.warn('Chat history forbidden: Not connected to user');
        setMessages([]);
      } else {
        console.error('Failed to fetch chat history or mark read:', err);
      }
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket using the environment API_URL or fallback to 8080
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const wsBaseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${wsBaseUrl}/ws/chat?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('WS Connected');
      setOnline(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WS Message received:', data);

      switch (data.type) {
        case 'new_message':
          // Add to messages if current conversation matches
          const msg = data.payload;
          if (msg.sender_id === targetUserId || msg.receiver_id === targetUserId) {
             setMessages(prev => [...prev, msg]);
          }
          break;
        case 'typing':
          if (data.payload.user_id === targetUserId) {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
          }
          break;
      }
    };

    ws.onclose = () => {
      console.log('WS Disconnected');
      setOnline(false);
    };

    return () => {
      ws.close();
    };
  }, [targetUserId]);

  const sendMessage = async (content: string) => {
    if (!targetUserId) return;
    try {
      await api.post('/messages', {
        receiver_id: targetUserId,
        content: content
      });
      // Logic handled via WS echo in backend
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const sendTyping = () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN || !targetUserId) return;
    socketRef.current.send(JSON.stringify({
      type: 'typing',
      receiver_id: targetUserId
    }));
  };

  return {
    messages,
    sendMessage,
    sendTyping,
    isTyping,
    online,
    refreshHistory: fetchHistory
  };
};
