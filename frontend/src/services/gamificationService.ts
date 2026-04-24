import api from './api';

export interface StreakData {
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
    message?: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    earned_at?: string;
}

export interface GamificationData {
    earned_badges: Badge[];
    available_badges: Badge[];
}

export const gamificationService = {
    getStreak: async () => {
        const { data } = await api.get<StreakData>('/stats/streak');
        return data;
    },

    getDailyStats: async (days: number = 7) => {
        const { data } = await api.get(`/stats/daily?days=${days}`);
        return data;
    },

    getBadges: async () => {
        const { data } = await api.get<GamificationData>('/badges');
        return data;
    },

    getNotificationPreferences: async () => {
        const { data } = await api.get('/notifications/preferences');
        return data;
    },

    updateNotificationPreferences: async (prefs: any) => {
        const { data } = await api.put('/notifications/preferences', prefs);
        return data;
    }
};
