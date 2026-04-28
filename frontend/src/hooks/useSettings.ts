import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'react-hot-toast';

export const useSettings = () => {
  const queryClient = useQueryClient();

  // ─── Queries ────────────────────────────────────────────────────────────────
  const usePreferences = () => useQuery({
    queryKey: ['settings', 'preferences'],
    queryFn: async () => {
      const { data } = await api.get('/settings/preferences');
      return data;
    }
  });

  const useNotificationSettings = () => useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      const { data } = await api.get('/settings/notifications');
      return data;
    }
  });

  const useSupportTickets = () => useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: async () => {
      const { data } = await api.get('/support/tickets');
      return data;
    }
  });

  const useDataExportStatus = () => useQuery({
    queryKey: ['account', 'data-export'],
    queryFn: async () => {
      const { data } = await api.get('/account/data-export');
      return data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === 'pending' || status === 'processing') ? 5000 : false;
    }
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const updatePreferences = useMutation({
    mutationFn: (payload: any) => api.put('/settings/preferences', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'preferences'] });
      toast.success('Preferences updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update preferences')
  });

  const updateNotifications = useMutation({
    mutationFn: (payload: any) => api.put('/settings/notifications', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
      toast.success('Notification settings updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update notifications')
  });

  const changePassword = useMutation({
    mutationFn: (payload: any) => api.put('/account/password', payload),
    onSuccess: (res: any) => {
      toast.success(res.data || 'Password updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update password')
  });

  const verifyPassword = useMutation({
    mutationFn: (password: string) => api.post('/account/verify-password', { password }),
    onError: (err: any) => toast.error(err.response?.data?.error || 'Verification failed')
  });

  const logoutAllDevices = useMutation({
    mutationFn: () => api.post('/account/logout-all'),
    onSuccess: () => {
      toast.success('All other sessions signed out');
      window.location.replace('/login');
    }
  });

  const requestDataExport = useMutation({
    mutationFn: () => api.post('/account/data-export'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', 'data-export'] });
      toast.success('Data export requested');
    }
  });

  const submitSupportTicket = useMutation({
    mutationFn: (payload: any) => api.post('/support/tickets', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] });
      toast.success('Support ticket submitted');
    }
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.delete('/account'),
    onSuccess: () => {
      toast.success('Account deactivated');
      window.location.replace('/login');
    }
  });

  return {
    queries: {
      preferences: usePreferences(),
      notifications: useNotificationSettings(),
      tickets: useSupportTickets(),
      exportStatus: useDataExportStatus()
    },
    mutations: {
      updatePreferences,
      updateNotifications,
      changePassword,
      logoutAllDevices,
      requestDataExport,
      submitSupportTicket,
      deleteAccount,
      verifyPassword
    }
  };
};
