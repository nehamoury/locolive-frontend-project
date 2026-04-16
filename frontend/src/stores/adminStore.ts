import { create } from 'zustand';
import type {
  AdminStats,
  AdminUser,
  AdminCrossing,
  AdminReel,
  AdminReport,
  AppSettings,
  LocationStats,
  DailyStats,
  LiveActivity,
} from '../types/admin';

interface AdminStore {
  stats: AdminStats | null;
  users: AdminUser[];
  crossings: AdminCrossing[];
  reels: AdminReel[];
  reports: AdminReport[];
  settings: AppSettings | null;
  locations: LocationStats[];
  dailyStats: DailyStats[];
  activities: LiveActivity[];
  isLoading: boolean;
  error: string | null;
  selectedUser: AdminUser | null;
  sidebarCollapsed: boolean;
  rightPanelCollapsed: boolean;
  
  setStats: (stats: AdminStats) => void;
  setUsers: (users: AdminUser[]) => void;
  setCrossings: (crossings: AdminCrossing[]) => void;
  setReels: (reels: AdminReel[]) => void;
  setReports: (reports: AdminReport[]) => void;
  setSettings: (settings: AppSettings) => void;
  setLocations: (locations: LocationStats[]) => void;
  setDailyStats: (stats: DailyStats[]) => void;
  setActivities: (activities: LiveActivity[]) => void;
  addActivity: (activity: LiveActivity) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedUser: (user: AdminUser | null) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
}

export const useAdminStore = create<AdminStore>((set) => ({
  stats: null,
  users: [],
  crossings: [],
  reels: [],
  reports: [],
  settings: null,
  locations: [],
  dailyStats: [],
  activities: [],
  isLoading: false,
  error: null,
  selectedUser: null,
  sidebarCollapsed: false,
  rightPanelCollapsed: false,

  setStats: (stats) => set({ stats }),
  setUsers: (users) => set({ users }),
  setCrossings: (crossings) => set({ crossings }),
  setReels: (reels) => set({ reels }),
  setReports: (reports) => set({ reports }),
  setSettings: (settings) => set({ settings }),
  setLocations: (locations) => set({ locations }),
  setDailyStats: (dailyStats) => set({ dailyStats }),
  setActivities: (activities) => set({ activities }),
  addActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities].slice(0, 50),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleRightPanel: () => set((state) => ({ rightPanelCollapsed: !state.rightPanelCollapsed })),
}));