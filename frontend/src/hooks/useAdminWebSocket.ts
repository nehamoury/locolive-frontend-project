import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminStore } from '../stores/adminStore';
import type { LiveActivity, AdminUser } from '../types/admin';

export const useAdminWebSocket = () => {
  const { addActivity } = useAdminStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Get WebSocket URL from HTTP base URL
    const baseUrl = import.meta.env.VITE_API_URL || (
      typeof window !== 'undefined' 
        ? (window.location.hostname === 'localhost' ? 'http://localhost:8080' : `http://${window.location.hostname}:8080`)
        : 'http://localhost:8080'
    );
    const wsBaseUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    // Pass token in query string since WS doesn't support headers for auth easily
    const socket = new WebSocket(`${wsBaseUrl}/admin/activity?token=${token}`);

    socket.onopen = () => {
      console.log('Admin Activity WebSocket Connected');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'activity') {
          const activity = data.payload as LiveActivity;
          addActivity(activity);

          // SMART CACHE UPDATES
          switch (activity.type) {
            case 'user_created':
              queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
              queryClient.setQueryData(['admin', 'stats'], (old: any) => {
                if (!old) return old;
                return { ...old, totalUsers: (old.totalUsers || 0) + 1, newUsers24h: (old.newUsers24h || 0) + 1 };
              });
              break;

            case 'comment_created':
              queryClient.invalidateQueries({ queryKey: ['admin', 'comments'] });
              break;

            case 'report_created':
              queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
              break;

            case 'user_online':
              queryClient.setQueriesData<any>({ queryKey: ['admin', 'users'] }, (old: any) => {
                if (!old || !old.items) return old;
                return {
                  ...old,
                  items: old.items.map((user: AdminUser) =>
                    user.id === (activity.payload as any).user_id ? { ...user, status: 'online' } : user
                  ),
                };
              });
              queryClient.setQueryData(['admin', 'stats'], (old: any) => {
                if (!old) return old;
                return { ...old, activeUsers: (old.activeUsers || 0) + 1 };
              });
              break;

            case 'post_liked':
            case 'reel_liked':
              // Optional: Update some live counter if we had it
              break;

            case 'crossing_detected':
              queryClient.setQueryData(['admin', 'stats'], (old: any) => {
                if (!old) return old;
                return { ...old, crossingsToday: (old.crossingsToday || 0) + 1 };
              });
              break;

            case 'reel_uploaded':
              queryClient.setQueryData(['admin', 'stats'], (old: any) => {
                if (!old) return old;
                return { ...old, reelsToday: (old.reelsToday || 0) + 1 };
              });
              break;
          }
        }
      } catch (err) {
        console.error('Failed to parse admin activity:', err);
      }
    };

    socket.onclose = () => {
      console.log('Admin Activity WebSocket Disconnected. Reconnecting in 5s...');
      socketRef.current = null;
      reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
    };

    socket.onerror = (err) => {
      console.error('Admin WebSocket Error:', err);
      socket.close();
    };

    socketRef.current = socket;
  };

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return socketRef.current;
};

