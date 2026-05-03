import api from './api';
import type {
  AdminStats,
  AdminUser,
  AdminReport,
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
  // A. Dashboard
  getDashboard: async (): Promise<AdminStats> => {
    const { data } = await api.get<AdminStats>('/admin/dashboard');
    return data;
  },

  // B. User Management
  getUsers: async (page: number = 1, pageSize: number = 20): Promise<{ items: AdminUser[]; total: number }> => {
    const { data } = await api.get<{ items: AdminUser[]; total: number }>('/admin/users', {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  getUserDetail: async (userId: string): Promise<any> => {
    const { data } = await api.get<any>(`/admin/users/${userId}`);
    return data;
  },

  handleUserAction: async (userId: string, action: string): Promise<any> => {
    const { data } = await api.post<any>(`/admin/users/${userId}/actions`, { action });
    return data;
  },

  searchUsers: async (query: string, page: number = 1, pageSize: number = 20): Promise<{ items: AdminUser[]; total: number }> => {
    const { data } = await api.get<{ items: AdminUser[]; total: number }>('/admin/users/search', {
      params: { q: query, page, page_size: pageSize },
    });
    return data;
  },

  // C. Content Moderation
  getContent: async (page: number = 1, pageSize: number = 20, type: string = 'all'): Promise<{ items: any[]; total: number }> => {
    const { data } = await api.get<{ items: any[]; total: number }>('/admin/content', {
      params: { page, page_size: pageSize, type },
    });
    return data;
  },

  deleteContent: async (type: 'post' | 'reel' | 'story', id: string): Promise<void> => {
    await api.delete(`/admin/${type}s/${id}`);
  },

  // D. Reports System
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

  // E. Blocks / Privacy
  getBlocks: async (page: number = 1, pageSize: number = 20): Promise<{ items: any[]; total: number }> => {
    const { data } = await api.get<{ items: any[]; total: number }>('/admin/blocks', {
      params: { page, page_size: pageSize },
    });
    return data;
  },

  // F. Engagement Inspector
  inspectEngagement: async (userId: string): Promise<any> => {
    const { data } = await api.get<any>('/admin/engagement', {
      params: { user_id: userId },
    });
    return data;
  },

  // G. Logs / Error Viewer
  getLogs: async (page: number = 1, pageSize: number = 50, level: string = 'all'): Promise<{ items: any[]; total: number }> => {
    const { data } = await api.get<{ items: any[]; total: number }>('/admin/logs', {
      params: { page, page_size: pageSize, level },
    });
    return data;
  },

  // H. System Monitor
  getSystemMonitor: async (): Promise<any> => {
    const { data } = await api.get<any>('/admin/system');
    return data;
  },

  // Legacy / Other
  getMapActiveUsers: async (): Promise<{ users: MapUser[]; total: number }> => {
    const { data } = await api.get<{ users: MapUser[]; total: number }>('/admin/map/active');
    return data;
  },

  sendNotification: async (params: SendNotificationParams): Promise<{ recipients: number; total_target: number }> => {
    const { data } = await api.post<{ data: { recipients: number; total_target: number } }>('/admin/notifications/send', params);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/admin/logout');
  },
};

export default adminApi;