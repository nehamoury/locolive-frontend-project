import { useState, useEffect, useCallback, useRef } from 'react';
import api, { WS_BASE_URL } from '../services/api';

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

export const useChat = (targetUserId?: string, isGroup: boolean = false) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Notify system about active chat to suppress redundant notifications
  useEffect(() => {
    if (targetUserId) {
      window.dispatchEvent(new CustomEvent('locolive_chat_active', { detail: { userId: targetUserId } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('locolive_chat_inactive'));
    };
  }, [targetUserId]);

  const fetchHistory = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const endpoint = isGroup ? `/groups/${targetUserId}/messages` : '/messages';
      const response = await api.get(endpoint, {
        params: !isGroup ? { user_id: targetUserId } : {}
      });
      setMessages(response.data || []);
      
      if (!isGroup) {
        // Mark messages as read since we just opened the chat
        await api.put(`/messages/read/${targetUserId}`);
      }
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

    let isSubscribed = true;
    const wsUrl = `${WS_BASE_URL}/api/ws/chat?token=${encodeURIComponent(token)}`;
    let initialConnectTimeout: any = null;

    const connect = () => {
      if (!isSubscribed) return;
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isSubscribed) {
          ws.close();
          return;
        }
        console.log('WS Connected');
        setOnline(true);
      };

      ws.onmessage = (event) => {
        if (!isSubscribed) return;
        try {
          const data = JSON.parse(event.data);
          console.log('WS Message received:', data);

          if (data.type === 'new_message' || data.type === 'new_group_message') {
            // Play sound if message is not from me
            let isMe = false;
            try {
              const token = localStorage.getItem('token');
              if (token) {
                const payloadStr = atob(token.split('.')[1]);
                const jwtPayload = JSON.parse(payloadStr);
                if (jwtPayload.user_id === data.sender_id) isMe = true;
              }
            } catch(e) {}

            if (!isMe) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            }
          }
          
          switch (data.type) {
            case 'new_message':
              const msg = data.payload;
              if (msg.sender_id === targetUserId || msg.receiver_id === targetUserId) {
                 setMessages(prev => [...prev, msg]);
              }
              break;
            case 'new_group_message':
              const groupMsg = data.payload;
              if (groupMsg.group_id === targetUserId) {
                 setMessages(prev => [...prev, groupMsg]);
              }
              break;
            case 'typing':
              if (data.payload.user_id === targetUserId) {
                setIsTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
              }
              break;
            case 'messages_read':
              if (data.payload.reader_id === targetUserId) {
                setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
              }
              break;
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WS Disconnected');
        setOnline(false);
      };
    };

    initialConnectTimeout = setTimeout(connect, 50);

    return () => {
      isSubscribed = false;
      if (initialConnectTimeout) clearTimeout(initialConnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [targetUserId]);

  const sendMessage = async (content: string) => {
    if (!targetUserId) return;
    try {
      await api.post('/messages', {
        receiver_id: !isGroup ? targetUserId : undefined,
        group_id: isGroup ? targetUserId : undefined,
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
