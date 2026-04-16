import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSound } from '../context/SoundContext';

const CROSSING_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
const MSG_RECEIVE_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';
const MSG_SEND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

const WS_RECONNECT_BASE_MS = 3000;
const WS_RECONNECT_MAX_MS = 30000;
const UNREAD_POLL_INTERVAL = 30000; // Poll unread counts every 30s as fallback

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const socketRef = useRef<WebSocket | null>(null);
  const crossingAudioRef = useRef<HTMLAudioElement | null>(null);
  const receiveAudioRef = useRef<HTMLAudioElement | null>(null);
  const sendAudioRef = useRef<HTMLAudioElement | null>(null);

  const seenNotifIds = useRef<Set<string>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const { alertsEnabled, toggleAlerts } = useSound();

  useEffect(() => {
    crossingAudioRef.current = new Audio(CROSSING_SOUND_URL);
    receiveAudioRef.current = new Audio(MSG_RECEIVE_URL);
    sendAudioRef.current = new Audio(MSG_SEND_URL);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast.success('Notifications enabled! 🔔');
    }
  }, []);

  const showSystemNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    // Only show system notification if the page is hidden
    if (document.visibilityState === 'hidden') {
      const defaultOptions: any = {
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        ...options
      };
      
      try {
        new Notification(title, defaultOptions);
      } catch (err) {
        // Fallback for devices that require service worker registration for notifications
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, defaultOptions);
          });
        }
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('[Notifications] Failed to fetch unread count:', err);
    }
  }, []);

  const fetchUnreadMessagesCount = useCallback(async () => {
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadMessagesCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('[Notifications] Failed to fetch unread messages count:', err);
    }
  }, []);

  const fetchPendingRequestsCount = useCallback(async () => {
    try {
      const res = await api.get('/connections/requests');
      setPendingRequestsCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch (err) {
      console.error('[Notifications] Failed to fetch pending requests:', err);
    }
  }, []);

  const playSound = useCallback((type: 'crossing' | 'receive' | 'send') => {
    if (!alertsEnabled) return;

    let audio: HTMLAudioElement | null = null;
    if (type === 'crossing') audio = crossingAudioRef.current;
    if (type === 'receive') audio = receiveAudioRef.current;
    if (type === 'send') audio = sendAudioRef.current;

    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(e => {
        console.log(`[Notifications] Audio play failed (${type}):`, e);
        if (e.name === 'NotAllowedError') {
          toast.error('Enable sound in settings', { id: 'audio-blocked' });
        }
      });
    }
  }, [alertsEnabled]);

  const toggleAudio = useCallback(() => {
    toggleAlerts();
    if (!alertsEnabled) {
      toast.success('Audio alerts enabled!', { id: 'audio-toggle' });
    } else {
      toast.success('Audio alerts disabled', { id: 'audio-toggle' });
    }
  }, [alertsEnabled, toggleAlerts]);

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount();
    fetchUnreadMessagesCount();
    fetchPendingRequestsCount();
  }, [fetchUnreadCount, fetchUnreadMessagesCount, fetchPendingRequestsCount]);

  // Periodic polling fallback
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
      fetchPendingRequestsCount();
    }, UNREAD_POLL_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount, fetchUnreadMessagesCount, fetchPendingRequestsCount]);

  // WebSocket connection with exponential backoff
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const fallbackUrl = isLocalhost ? 'http://localhost:8080' : `http://${hostname}:8080`;

    const baseUrl = import.meta.env.VITE_API_URL || fallbackUrl;
    const wsBaseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${wsBaseUrl}/ws/chat?token=${encodeURIComponent(token)}`;

    let isSubscribed = true;
    let reconnectTimeout: any = null;
    let initialConnectTimeout: any = null;

    const connect = () => {
      if (!isSubscribed) return;

      setWsStatus('connecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'new_message') {
            fetchUnreadMessagesCount();

            let isMe = false;
            try {
              if (token) {
                const payloadStr = atob(token.split('.')[1]);
                const jwtPayload = JSON.parse(payloadStr);
                if (jwtPayload.user_id === data.sender_id) isMe = true;
              }
            } catch (e) { }

            if (isMe) return;

            playSound('receive');
            toast(`New message received! 💬`, {
              duration: 3000,
              style: {
                borderRadius: '20px',
                background: '#FFF',
                color: '#333',
                fontWeight: 'bold',
                border: '1px solid #E5E7EB'
              },
            });

            showSystemNotification('New Message', {
              body: data.content || 'You have a new message on Locolive',
              tag: 'new-message'
            });
            return;
          }

          if (data.type === 'crossing_detected') {
            const notif = data.payload;
            const notifId = notif?.id || notif?.message;
            if (notifId && seenNotifIds.current.has(notifId)) return;
            if (notifId) seenNotifIds.current.add(notifId);

            toast(notif.message, {
              id: notifId,
              icon: '📍',
              style: {
                borderRadius: '20px',
                background: '#FFF',
                color: '#333',
                fontWeight: 'bold',
                border: '1px solid #FBCFE8'
              }
            });
            playSound('crossing');
            showSystemNotification('Locolive Crossing', {
              body: notif.message,
              tag: 'crossing'
            });

            setUnreadCount(prev => prev + 1);
            setNotifications(prev => [notif, ...prev]);
            window.dispatchEvent(new CustomEvent('crossing_detected', { detail: notif }));
            return;
          }

          if (data.type === 'connection_request') {
            fetchPendingRequestsCount();
            toast('New Connection Request! 🤝', {
              icon: '✨',
              style: {
                borderRadius: '20px',
                background: '#FFF',
                color: '#333',
                fontWeight: 'bold',
                border: '1px solid #E5E7EB'
              }
            });
            playSound('receive');
            showSystemNotification('New Connection Request', {
              body: 'Someone wants to connect with you!',
              tag: 'connection-request'
            });
            return;
          }

          if (data.type === 'connection_accepted') {
            fetchPendingRequestsCount();
            toast.success(`You are now connected! 🤝`);
            showSystemNotification('Connection Accepted', {
              body: 'Your connection request was accepted!',
              tag: 'connection-accepted'
            });
            window.dispatchEvent(new CustomEvent('connection_accepted', { detail: data.payload }));
            return;
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        if (!isSubscribed) return;
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(WS_RECONNECT_BASE_MS * Math.pow(2, attempt), WS_RECONNECT_MAX_MS);
        reconnectAttemptRef.current = attempt + 1;
        reconnectTimeout = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    };

    // Give React StrictMode a tiny window to unmount before creating the socket, 
    // which prevents the pesky 'WebSocket is closed before the connection is established' warning.
    initialConnectTimeout = setTimeout(connect, 50);

    return () => {
      isSubscribed = false;
      if (initialConnectTimeout) clearTimeout(initialConnectTimeout);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, [fetchUnreadCount, fetchUnreadMessagesCount, fetchPendingRequestsCount, playSound, showSystemNotification]);

  return {
    unreadCount,
    unreadMessagesCount,
    pendingRequestsCount,
    notifications,
    wsStatus,
    audioEnabled: alertsEnabled,
    notificationPermission,
    toggleAudio,
    requestPermission,
    playSendSound: () => playSound('send'),
    refreshUnread: () => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
      fetchPendingRequestsCount();
    }
  };
};