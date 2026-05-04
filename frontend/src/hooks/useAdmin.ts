import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../services/adminApi';


export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
    refetchInterval: 30000,
  });
};

export const useAdminUsers = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'users', page, pageSize],
    queryFn: () => adminApi.getUsers(page, pageSize),
  });
};

export const useAdminUserDetail = (userId: string) => {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => adminApi.getUserDetail(userId),
    enabled: !!userId,
  });
};

export const useAdminStories = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'stories', page, pageSize],
    queryFn: () => adminApi.getContent(page, pageSize, 'story'),
  });
};

export const useAdminUserAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, action }: { userId: string; action: string }) => 
      adminApi.handleUserAction(userId, action),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', userId] });
    },
  });
};

export const useAdminContent = (page: number = 1, pageSize: number = 20, type: string = 'all') => {
  return useQuery({
    queryKey: ['admin', 'content', page, pageSize, type],
    queryFn: () => adminApi.getContent(page, pageSize, type),
  });
};

export const useAdminReports = (resolved?: boolean, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'reports', resolved, page, pageSize],
    queryFn: () => adminApi.getReports(resolved, page, pageSize),
  });
};

export const useAdminLogs = (page: number = 1, pageSize: number = 50, level: string = 'all') => {
  return useQuery({
    queryKey: ['admin', 'logs', page, pageSize, level],
    queryFn: () => adminApi.getLogs(page, pageSize, level),
  });
};

export const useAdminSystemMonitor = () => {
  return useQuery({
    queryKey: ['admin', 'system'],
    queryFn: () => adminApi.getSystemMonitor(),
    refetchInterval: 10000,
  });
};

export const useAdminLogout = () => {
  return useMutation({
    mutationFn: () => adminApi.logout(),
  });
};

export const useAdminDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteContent('post', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
    },
  });
};

export const useAdminDeleteReel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteContent('reel', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
    },
  });
};

export const useAdminDeleteStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteContent('story', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
    },
  });
};

export const useAdminAdmins = () => {
  return useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => adminApi.getAdmins(),
  });
};

export const useAdminNotifications = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'notifications', page, pageSize],
    queryFn: () => adminApi.getNotifications(page, pageSize),
  });
};

export const useAdminCrossings = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'crossings', page, pageSize],
    queryFn: () => adminApi.getCrossings(page, pageSize),
  });
};

export const useAdminMapUsers = () => {
  return useQuery({
    queryKey: ['admin', 'map', 'users'],
    queryFn: () => adminApi.getMapActiveUsers(),
    refetchInterval: 5000, // Update map every 5 seconds
  });
};
