import api from './api';
import type {
  AdminStats,
  AdminUser,
  AdminReport,
  AdminCrossing,
} from '../types/admin';

export interface MapUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  lat: number;
  lng: number;
  online: boolean;
}

export interface AppSettings {
  discovery_radius: number;
  crossing_distance: number;
  location_update_seconds: number;
  reels_enabled: boolean;
  crossings_enabled: boolean;
  version: string;
  build_date: string;
  environment: string;
}

export interface AdminNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SendNotificationParams {
  title: string;
  message: string;
  target: 'all' | 'online' | 'location';
  city?: string;
}

export interface CreateAdminParams {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'moderator';
}

export const adminApi = {
  // Stats
  getStats: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/admin/stats');
    return data;
  },

  // Users
  getUsers: async (page: number = 1, pageSize: number = 20): Promise<{ items: AdminUser[]; total: number }> => {
    const { data } = await api.get<{ items: AdminUser[]; total: number }>('/admin/users', {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  // Search Users
  searchUsers: async (query: string, page: number = 1, pageSize: number = 20): Promise<{ items: AdminUser[]; total: number }> => {
    const { data } = await api.get<{ items: AdminUser[]; total: number }>('/admin/users/search', {
      params: { q: query, page, page_size: pageSize },
    });
    return data;
  },

  banUser: async (userId: string, ban: boolean): Promise<AdminUser> => {
    const { data } = await api.post<AdminUser>('/admin/users/ban', { user_id: userId, ban });
    return data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  // Map
  getMapActiveUsers: async (): Promise<{ users: MapUser[]; total: number }> => {
    const { data } = await api.get<{ users: MapUser[]; total: number }>('/admin/map/active');
    return data;
  },

  // Crossings
  getCrossings: async (page: number = 1, pageSize: number = 20): Promise<{ items: AdminCrossing[]; total: number }> => {
    const { data } = await api.get<{ items: AdminCrossing[]; total: number }>('/admin/crossings', {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  // Stories/Reels (Admin perspective)
  getStories: async (page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number }> => {
    const { data } = await api.get<{ items: any[]; total: number }>('/admin/stories', {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  deleteStory: async (storyId: string): Promise<void> => {
    await api.delete(`/admin/stories/${storyId}`);
  },

  // Reports
  getReports: async (resolved?: boolean, page: number = 1, pageSize: number = 20): Promise<{ items: AdminReport[]; total: number }> => {
    const { data } = await api.get<{ items: AdminReport[]; total: number }>('/admin/reports', {
      params: { resolved, page, page_size: pageSize },
    });
    return data;
  },

  resolveReport: async (reportId: string): Promise<AdminReport> => {
    const { data } = await api.put<AdminReport>(`/admin/reports/${reportId}/resolve`);
    return data;
  },

  // Activity Logs
  getActivityLogs: async (page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number }> => {
    const { data } = await api.get<{ data: { items: any[]; total: number } }>('/admin/activity/logs', {
      params: { page, page_size: pageSize },
    });
    return data.data;
  },

  // Comments
  getComments: async (page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number }> => {
    const { data } = await api.get<{ data: { items: any[]; total: number } }>('/admin/comments', {
      params: { page, page_size: pageSize },
    });
    return data.data;
  },

  moderateComment: async (commentId: string, source: 'post' | 'reel', action: 'approve' | 'delete'): Promise<void> => {
    await api.post('/admin/comments/moderate', { comment_id: commentId, source, action });
  },

  // Notifications (Admin)
  getNotifications: async (page: number = 1, pageSize: number = 20): Promise<{ items: AdminNotification[]; total: number }> => {
    const { data } = await api.get<{ data: { items: AdminNotification[]; total: number } }>('/admin/notifications', {
      params: { page, page_size: pageSize },
    });
    return data.data;
  },

  sendNotification: async (params: SendNotificationParams): Promise<{ recipients: number; total_target: number }> => {
    const { data } = await api.post<{ data: { recipients: number; total_target: number } }>('/admin/notifications/send', params);
    return data.data;
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const { data } = await api.get<{ data: AppSettings }>('/admin/settings');
    return data.data;
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<void> => {
    await api.put('/admin/settings', settings);
  },

  // Admin Users
  getAdmins: async (): Promise<{ items: AdminUser[] }> => {
    const { data } = await api.get<{ data: { items: AdminUser[] } }>('/admin/admins');
    return data.data;
  },

  createAdmin: async (params: CreateAdminParams): Promise<AdminUser> => {
    const { data } = await api.post<{ data: AdminUser }>('/admin/admins', params);
    return data.data;
  },

  updateAdmin: async (adminId: string, role: string): Promise<AdminUser> => {
    const { data } = await api.put<{ data: AdminUser }>(`/admin/admins/${adminId}`, { role });
    return data.data;
  },

  deleteAdmin: async (adminId: string): Promise<void> => {
    await api.delete(`/admin/admins/${adminId}`);
  },

  // Logout
  logout: async (): Promise<void> => {
    await api.post('/admin/logout');
  },
};

export default adminApi;