import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Types
export interface UserConnection {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  last_active_at: string | null;
  you_follow?: boolean;
  follows_you?: boolean;
  is_mutual?: boolean;
  requested?: boolean;
}

export interface UserPost {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string;
  body_text: string;
  location_name: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  liked_by_viewer: boolean;
  crop_settings?: any;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  banner_url: string;
  cover_url?: string;
  theme: string;
  profile_visibility: string;
  email: string;
  phone: string;
  is_ghost_mode: boolean;
  is_premium: boolean;
  is_private: boolean;
  activity_streak: number;
  story_count: number;
  post_count: number;
  reels_count: number;
  connection_count: number;
  following_count: number;
  followers_count: number;
  saved_count: number;
  views_count: number;
  crossings_count: number;
  last_active_at: string;
  created_at: string;
  visibility_status: string;
  website_url: string;
  links: Array<{ label: string; url: string }>;
  interests: string[];
  distance_km?: number;
  connection_status: 'none' | 'pending' | 'accepted' | 'self' | 'blocked';
  is_blocked: boolean;
  requested?: boolean;
  you_follow: boolean;
  follows_you: boolean;
  is_mutual: boolean;
}

// --- Query Keys (CRITICAL: Always include userId) ---
export const userKeys = {
  all: ['users'] as const,
  profile: (userId: string) => ['users', 'profile', userId] as const,
  connections: (userId: string) => ['users', 'connections', userId] as const,
  followers: (userId: string) => ['users', 'followers', userId] as const,
  following: (userId: string) => ['users', 'following', userId] as const,
  posts: (userId: string) => ['users', 'posts', userId] as const,
  reels: (userId: string) => ['users', 'reels', userId] as const,
  stories: (userId: string) => ['users', 'stories', userId] as const,
};

// --- Profile ---
export const useUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: userKeys.profile(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const { data } = await api.get<UserProfile>(`/users/${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
};

export const useMyProfile = () => {
  return useQuery({
    queryKey: userKeys.profile('me'),
    queryFn: async () => {
      const { data } = await api.get<UserProfile>('/profile/me');
      return data;
    },
    staleTime: 30000,
  });
};

// --- Connections ---
export const useUserConnections = (userId: string | null, isMe: boolean = false) => {
  return useQuery({
    queryKey: userKeys.connections(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const endpoint = isMe ? '/connections' : `/users/${userId}/connections`;
      const { data } = await api.get<UserConnection[]>(endpoint);
      return data;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
};

// --- Followers ---
export const useUserFollowers = (userId: string | null, isMe: boolean = false) => {
  return useQuery({
    queryKey: userKeys.followers(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const endpoint = isMe ? '/connections/followers' : `/users/${userId}/followers`;
      const { data } = await api.get(endpoint);
      // Normalize response - handle direct array, {followers: []}, or {success: true, data: []}, or {success: true, data: {followers: []}}
      const normalized = Array.isArray(data) 
        ? data 
        : (data?.data?.followers || data?.followers || data?.data || data?.items || []);
      console.log(`[useUserFollowers] endpoint: ${endpoint}, data type:`, typeof data, 'isArray:', Array.isArray(data), 'normalized:', normalized.length);
      return normalized as UserConnection[];
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
};

// --- Following ---
export const useUserFollowing = (userId: string | null, isMe: boolean = false) => {
  return useQuery({
    queryKey: userKeys.following(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const endpoint = isMe ? '/connections/following' : `/users/${userId}/following`;
      const { data } = await api.get(endpoint);
      // Normalize response - handle direct array, {following: []}, or {success: true, data: []}, or {success: true, data: {following: []}}
      const normalized = Array.isArray(data) 
        ? data 
        : (data?.data?.following || data?.following || data?.data || data?.items || []);
      console.log(`[useUserFollowing] endpoint: ${endpoint}, data type:`, typeof data, 'isArray:', Array.isArray(data), 'normalized:', normalized.length);
      return normalized as UserConnection[];
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
};

// --- Posts ---
export const useUserPosts = (userId: string | null, page: number = 1, pageSize: number = 12) => {
  return useQuery({
    queryKey: [...userKeys.posts(userId || ''), page, pageSize],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const { data } = await api.get<{ posts: UserPost[]; page: number; page_size: number }>(
        `/users/${userId}/posts?page=${page}&page_size=${pageSize}`
      );
      return data;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
};

// --- Reels ---
export const useUserReels = (userId: string | null, page: number = 1, pageSize: number = 12) => {
  return useQuery({
    queryKey: [...userKeys.reels(userId || ''), page, pageSize],
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const { data } = await api.get(`/users/${userId}/reels?page=${page}&page_size=${pageSize}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 60000, // 1 minute
  });
};

// --- Stories ---
export const useUserStories = (userId: string | null) => {
  return useQuery({
    queryKey: userKeys.stories(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('userId is required');
      const { data } = await api.get(`/stories/user/${userId}`);
      return data;
    },
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
};

// --- Helper Hook: Check Privacy Access ---
export const usePrivacyCheck = (profile: UserProfile | null | undefined) => {
  if (!profile) {
    return {
      isAllowed: false,
      isPrivate: false,
      reason: 'loading',
    };
  }

  const isSelf = profile.connection_status === 'self';
  const isConnected = profile.connection_status === 'accepted';
  const isPrivate = profile.is_private;

  // Allow if:
  // 1. Same user (self)
  // 2. Public profile (not private)
  // 3. Connected users (following)
  const isAllowed = isSelf || !isPrivate || isConnected;

  return {
    isAllowed,
    isPrivate: isPrivate && !isConnected && !isSelf,
    reason: isAllowed ? 'allowed' : 'private',
  };
};

// --- Invalidate Helper ---
export const useInvalidateUserData = () => {
  const queryClient = useQueryClient();

  return {
    invalidateProfile: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
    invalidateConnections: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.connections(userId) });
    },
    invalidateFollowers: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.followers(userId) });
    },
    invalidateFollowing: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.following(userId) });
    },
    invalidatePosts: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.posts(userId) });
    },
    invalidateAll: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.connections(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.followers(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.following(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.posts(userId) });
    },
  };
};
