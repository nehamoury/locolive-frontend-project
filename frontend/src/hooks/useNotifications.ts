import { useState, useEffect, useCallback, useRef } from 'react';
import api, { WS_BASE_URL } from '../services/api';
import toast from 'react-hot-toast';
import { useSound } from '../context/SoundContext';
import { 
  requestNotificationPermission as requestFCMPermission,
  onMessageListener
} from '../services/firebase';


const WS_RECONNECT_BASE_MS = 3000;
const WS_RECONNECT_MAX_MS = 30000;
const UNREAD_POLL_INTERVAL = 180000; // Poll unread counts every 3 minutes as fallback

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatActiveEventDetail {
  userId?: string;
}

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: Record<string, string>;
}

type BrowserNotificationOptions = NotificationOptions & {
  vibrate?: number[];
};

type NotificationMap = Map<string, Notification>;

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
  const seenNotifIds = useRef<Set<string>>(new Set());
  const reconnectAttemptRef = useRef(0);
  const activeChatUserId = useRef<string | null>(null);

  useEffect(() => {
    const handleActive = (e: Event) => {
      activeChatUserId.current = ((e as CustomEvent<ChatActiveEventDetail>).detail?.userId) || null;
    };
    const handleInactive = () => { activeChatUserId.current = null; };
    window.addEventListener('locolive_chat_active', handleActive);
    window.addEventListener('locolive_chat_inactive', handleInactive);
    return () => {
      window.removeEventListener('locolive_chat_active', handleActive);
      window.removeEventListener('locolive_chat_inactive', handleInactive);
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    
    // Use the FCM-enabled permission request
    const token = await requestFCMPermission();
    
    setNotificationPermission(Notification.permission);
    if (Notification.permission === 'granted') {
      toast.success(token ? 'Notifications enabled! 🔔' : 'Notifications enabled (browser only)');
    }
  }, []);

  const showSystemNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    // Only show system notification if the page is hidden
    if (document.visibilityState === 'hidden') {
      const defaultOptions: BrowserNotificationOptions = {
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        ...options
      };
      
      try {
        new Notification(title, defaultOptions);
      } catch {
        // Fallback for devices that require service worker registration for notifications
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then(registration => {
            if (registration && registration.showNotification) {
              registration.showNotification(title, defaultOptions);
            }
          }).catch(() => {});
        }
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const data = res.data || [];

      // Deduplicate notifications exactly like in NotificationsView
      const seenMessages: NotificationMap = new Map();
      for (const notif of data as Notification[]) {
        const key = `${notif.type}_${notif.message}`;
        if (!seenMessages.has(key)) {
          seenMessages.set(key, notif);
        }
      }
      const uniqueNotifications = Array.from(seenMessages.values());
      const uniqueUnreadCount = uniqueNotifications.filter((n) => !n.is_read).length;

      setUnreadCount(uniqueUnreadCount);
      setNotifications(uniqueNotifications);
    } catch (err) {
      console.error('[Notifications] Failed to fetch unread count:', err);
    }
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new CustomEvent('notifications_updated'));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const markRead = async (id: string, relatedUserId?: string, onUserSelect?: (id: string) => void) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      window.dispatchEvent(new CustomEvent('notifications_updated'));
      
      // If it's a social notification, navigate to profile
      if (relatedUserId && onUserSelect) {
        onUserSelect(relatedUserId);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

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

  const { alertsEnabled, toggleAlerts } = useSound();
  const soundCooldowns = useRef<Record<string, number>>({});
  const soundCounts = useRef<Record<string, number>>({});
  const soundHourStart = useRef<number>(0);

  // Sound preloader/manager
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playSound = useCallback((soundFile: string, priority: 'high' | 'low' = 'low') => {
    if (!alertsEnabled) return;

    // Mapping for fallbacks if local files are missing or for initial setup
    const soundFallbacks: Record<string, string> = {
      'chat_pop.wav': 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
      'soft_ping.wav': 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      'badge_unlock.wav': 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
      'streak_fire.wav': 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      'coin_reward.wav': 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    };

    // Smart Rules: Max 3 non-critical sounds per hour
    const now = Date.now();
    if (now - soundHourStart.current > 3600000) {
      soundHourStart.current = now;
      soundCounts.current = {};
    }

    if (priority === 'low') {
      const totalSounds = Object.values(soundCounts.current).reduce((a, b) => a + b, 0);
      if (totalSounds >= 3) {
        console.log('[Sounds] Anti-spam: skipping non-critical sound');
        return;
      }
    }

    // Cooldown: 2 seconds per sound type to avoid overlap
    if (soundCooldowns.current[soundFile] && now - soundCooldowns.current[soundFile] < 2000) {
      return;
    }

    let audio = audioCache.current[soundFile];
    if (!audio) {
      // Use local file if exists, otherwise fallback to external URL
      let url = soundFile.startsWith('http') ? soundFile : `/sounds/${soundFile}`;
      
      // If it's one of our known files, we can use the fallback URL to be safe
      if (soundFallbacks[soundFile]) {
        url = soundFallbacks[soundFile];
      }

      audio = new Audio(url);
      audioCache.current[soundFile] = audio;
    }

    audio.currentTime = 0;
    audio.play().catch(e => {
      console.warn(`[Sounds] Play failed for ${soundFile}:`, e);
      // If it failed and we haven't tried the fallback yet, try it now
      if (!soundFile.startsWith('http') && soundFallbacks[soundFile] && audioCache.current[soundFile]?.src !== soundFallbacks[soundFile]) {
        const fallbackAudio = new Audio(soundFallbacks[soundFile]);
        audioCache.current[soundFile] = fallbackAudio;
        fallbackAudio.play().catch(iErr => console.error('[Sounds] Fallback also failed:', iErr));
      }
    });

    soundCooldowns.current[soundFile] = now;
    soundCounts.current[soundFile] = (soundCounts.current[soundFile] || 0) + 1;
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
    const timer = setTimeout(() => {
      void fetchUnreadMessagesCount();
      void fetchPendingRequestsCount();
    }, 0);

    // Automatically request/refresh FCM token if permission was previously granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      void requestFCMPermission();
    }
    return () => clearTimeout(timer);
  }, [fetchUnreadMessagesCount, fetchPendingRequestsCount]);

  // Periodic polling fallback
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (wsStatus !== 'connected') fetchUnreadCount();
      if (wsStatus !== 'connected') fetchUnreadMessagesCount();
      if (wsStatus !== 'connected') fetchPendingRequestsCount();
    }, UNREAD_POLL_INTERVAL); // 3 minutes fallback when disconnected
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount, fetchUnreadMessagesCount, fetchPendingRequestsCount, wsStatus]);

  // FCM Foreground listener
  useEffect(() => {
    onMessageListener((payload: NotificationPayload) => {
      console.log('[useNotifications] FCM Message in foreground:', payload);
      
      const { title, body } = payload.notification || {};
      const data = payload.data || {};

      // If it's a message and we are already in that chat, don't show toast
      if (data.type === 'new_message' && activeChatUserId.current === data.sender_id) {
        return;
      }

      // Refresh relevant counts based on notification type
      if (data.type === 'new_message') {
        fetchUnreadMessagesCount();
      } else if (data.type === 'connection_request' || data.type === 'connection_accepted') {
        fetchPendingRequestsCount();
      } else {
        fetchUnreadCount();
      }

      // Show toast if we have a title/body and it's not a duplicate
      if (title && body) {
        toast(`${title}: ${body}`, {
          icon: '🔔',
          style: {
            borderRadius: '20px',
            background: '#FFF',
            color: '#333',
            fontWeight: 'bold',
            border: '1px solid #E5E7EB'
          },
        });
        
        // Play sound
        const sound = data.sound || 'soft_ping.wav';
        playSound(sound, 'high');
      }
    });
  }, [fetchUnreadCount, fetchUnreadMessagesCount, fetchPendingRequestsCount, playSound]);

  // WebSocket connection with exponential backoff

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}/api/ws/chat?token=${encodeURIComponent(token)}`;

    let isSubscribed = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let initialConnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!isSubscribed) return;

      setWsStatus('connecting');
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        if (reconnectAttemptRef.current > 0) {
          fetchUnreadCount();
          fetchUnreadMessagesCount();
          fetchPendingRequestsCount();
        }
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Universal Event Deduplication
          const eventId = data.msg_id || data.id || data.payload?.id || `${data.type}_${data.created_at}`;
          if (seenNotifIds.current.has(eventId)) return;
          seenNotifIds.current.add(eventId);

          if (data.type === 'new_message') {
            fetchUnreadMessagesCount();

            let isMe = false;
            try {
              if (token) {
                const payloadStr = atob(token.split('.')[1]);
                const jwtPayload = JSON.parse(payloadStr);
                if (jwtPayload.user_id === data.sender_id) isMe = true;
              }
            } catch {
              // ignore invalid local token payload
            }

            if (isMe) return;

            // Skip sound and toast if user is already looking at this chat
            if (activeChatUserId.current === data.sender_id) {
              console.log('[Notifications] Skipping alert - chat is active');
              return;
            }

            // Play the sound from backend or fallback to chat_pop.wav
            playSound(data.sound || 'chat_pop.wav', 'high');
            
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
            playSound(data.sound || 'soft_ping.wav', 'low');
            showSystemNotification('Locolive Crossing', {
              body: notif.message,
              tag: 'crossing'
            });

            setNotifications(prev => {
              const key = `${notif.type}_${notif.message}`;
              const exists = prev.some(n => `${n.type}_${n.message}` === key);
              if (exists) return prev;

              const newList = [notif, ...prev];
              setUnreadCount(newList.filter(n => !n.is_read).length);
              return newList;
            });
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
            playSound(data.sound || 'chat_pop.wav', 'high');
            showSystemNotification('New Connection Request', {
              body: 'Someone wants to connect with you!',
              tag: 'connection-request'
            });
            return;
          }

          if (data.type === 'connection_accepted') {
            fetchPendingRequestsCount();
            toast.success(`You are now connected! 🤝`);
            playSound(data.sound || 'badge_unlock.wav', 'high');
            showSystemNotification('Connection Accepted', {
              body: 'Your connection request was accepted!',
              tag: 'connection-accepted'
            });
            window.dispatchEvent(new CustomEvent('connection_accepted', { detail: data.payload }));
            return;
          }

          if (data.type === 'force_logout') {
            console.warn('[WS] Force logout received:', data.payload.reason);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            toast.error(`Session terminated: ${data.payload.reason || 'Security event'}`, { duration: 5000 });
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            return;
          }

          // Generic handler for other types with sounds (Gamification, etc.)
          if (data.sound) {
            playSound(data.sound, data.priority === 'high' ? 'high' : 'low');
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

    const handleUpdate = () => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
      fetchPendingRequestsCount();
    };
    window.addEventListener('notifications_updated', handleUpdate);

    return () => {
      isSubscribed = false;
      window.removeEventListener('notifications_updated', handleUpdate);
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
    playSendSound: () => playSound('chat_pop.wav', 'high'),
    refreshUnread: () => {
      fetchUnreadCount();
      fetchUnreadMessagesCount();
      fetchPendingRequestsCount();
    },
    markRead,
    markAllRead
  };
};
