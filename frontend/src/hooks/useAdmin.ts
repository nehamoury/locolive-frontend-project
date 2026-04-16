import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../services/adminApi';


export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30000, // Refetch every 30s
  });
};

export const useAdminUsers = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'users', page, pageSize],
    queryFn: () => adminApi.getUsers(page, pageSize),
  });
};

export const useAdminSearchUsers = (query: string, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'users', 'search', query, page, pageSize],
    queryFn: () => adminApi.searchUsers(query, page, pageSize),
    enabled: query.length > 0,
  });
};

export const useAdminMapUsers = () => {
  return useQuery({
    queryKey: ['admin', 'map', 'active'],
    queryFn: () => adminApi.getMapActiveUsers(),
    refetchInterval: 15000, // Refresh map every 15s
  });
};

export const useAdminCrossings = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'crossings', page, pageSize],
    queryFn: () => adminApi.getCrossings(page, pageSize),
    refetchInterval: 15000, // Live updates
  });
};

export const useAdminReports = (resolved?: boolean, page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'reports', resolved, page, pageSize],
    queryFn: () => adminApi.getReports(resolved, page, pageSize),
  });
};

export const useBanUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, ban }: { userId: string; ban: boolean }) => 
      adminApi.banUser(userId, ban),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useResolveReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => adminApi.resolveReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });
};

export const useAdminLogout = () => {
  return useMutation({
    mutationFn: () => adminApi.logout(),
  });
};

export const useAdminStories = (page: number = 1, pageSize: number = 20) => {
  return useQuery({
    queryKey: ['admin', 'stories', page, pageSize],
    queryFn: () => adminApi.getStories(page, pageSize),
  });
};

export const useAdminDeleteStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storyId: string) => adminApi.deleteStory(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stories'] });
    },
  });
};
