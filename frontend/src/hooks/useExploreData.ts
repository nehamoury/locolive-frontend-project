import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface ExploreEntity {
  id: string;
  [key: string]: unknown;
}

interface ExploreConnection {
  id?: string;
  target_id?: string;
  requester_id?: string;
}

export interface ExploreData {
  nearbyUsers: ExploreEntity[];
  crossings: ExploreEntity[];
  suggestedUsers: ExploreEntity[];
  mapStories: ExploreEntity[];
  heatmap: ExploreEntity[];
  loading: {
    nearby: boolean;
    crossings: boolean;
    suggested: boolean;
    stories: boolean;
    heatmap: boolean;
    connections: boolean;
  };
}

const DISMISSED_KEY = 'locolive_dismissed_users';

export const useExploreData = (position: { lat: number; lng: number } | null) => {
  const [data, setData] = useState<ExploreData>({
    nearbyUsers: [],
    crossings: [],
    suggestedUsers: [],
    mapStories: [],
    heatmap: [],
    loading: {
      nearby: true,
      crossings: true,
      suggested: true,
      stories: true,
      heatmap: true,
      connections: true,
    },
  });
  
  const [connectionIds, setConnectionIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(DISMISSED_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const lastFetchRef = useRef<Record<string, number>>({});

  const isVisible = useCallback((userId: string) => {
    return !connectionIds.has(userId) && !dismissedIds.has(userId);
  }, [connectionIds, dismissedIds]);

  const fetchNearby = useCallback(async () => {
    if (!position) return;
    const now = Date.now();
    if (lastFetchRef.current.nearby && now - lastFetchRef.current.nearby < 10000) return;

    try {
      const res = await api.get('/users/nearby', { 
        params: { lat: position.lat, lng: position.lng, radius: 5 } 
      });
      const filtered = ((res.data || []) as ExploreEntity[]).filter((u) => isVisible(u.id));
      setData(prev => ({ 
        ...prev, 
        nearbyUsers: filtered, 
        loading: { ...prev.loading, nearby: false } 
      }));
      lastFetchRef.current.nearby = now;
    } catch (err) {
      console.error('[Explore] Failed to fetch nearby:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, nearby: false } }));
    }
  }, [position, isVisible]);

  const fetchCrossings = useCallback(async () => {
    try {
      const res = await api.get('/crossings');
      setData(prev => ({ 
        ...prev, 
        crossings: res.data || [], 
        loading: { ...prev.loading, crossings: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch crossings:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, crossings: false } }));
    }
  }, []);

  const fetchSuggested = useCallback(async () => {
    try {
      const res = await api.get('/connections/suggested');
      const filtered = ((res.data || []) as ExploreEntity[]).filter((u) => isVisible(u.id));
      setData(prev => ({ 
        ...prev, 
        suggestedUsers: filtered, 
        loading: { ...prev.loading, suggested: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch suggested:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, suggested: false } }));
    }
  }, [isVisible]);

  const fetchConnections = useCallback(async () => {
    try {
      const [accepted, sent, pending] = await Promise.all([
        api.get('/connections'),
        api.get('/connections/sent'),
        api.get('/connections/requests')
      ]);

      const ids = new Set<string>();
      [...(accepted.data || []), ...(sent.data || []), ...(pending.data || [])].forEach((c: ExploreConnection) => {
        if (c.id) ids.add(c.id);
        if (c.target_id) ids.add(c.target_id);
        if (c.requester_id) ids.add(c.requester_id);
      });

      setConnectionIds(ids);
      setData(prev => ({ 
        ...prev, 
        loading: { ...prev.loading, connections: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch connections:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, connections: false } }));
    }
  }, []);

  const fetchStories = useCallback(async () => {
    if (!position) return;
    try {
      const params = {
        north: position.lat + 0.1,
        south: position.lat - 0.1,
        east: position.lng + 0.1,
        west: position.lng - 0.1,
      };
      const res = await api.get('/stories/map', { params });
      setData(prev => ({ 
        ...prev, 
        mapStories: res.data.clusters || [], 
        loading: { ...prev.loading, stories: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch stories:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, stories: false } }));
    }
  }, [position]);

  const fetchHeatmap = useCallback(async () => {
    if (!position) return;
    try {
      const params = {
        north: position.lat + 0.5,
        south: position.lat - 0.5,
        east: position.lng + 0.5,
        west: position.lng - 0.5,
      };
      const res = await api.get('/location/heatmap', { params });
      setData(prev => ({ 
        ...prev, 
        heatmap: res.data.data || [], 
        loading: { ...prev.loading, heatmap: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch heatmap:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, heatmap: false } }));
    }
  }, [position]);

  // Initial and periodic fetches
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchCrossings();
      void fetchConnections();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchCrossings, fetchConnections]);

  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => {
        void fetchNearby();
        void fetchStories();
        void fetchSuggested();
        void fetchHeatmap();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [position, fetchNearby, fetchStories, fetchSuggested, fetchHeatmap]);

  const dismissUser = useCallback((userId: string) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(userId);
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
    
    setData(prev => ({
      ...prev,
      nearbyUsers: prev.nearbyUsers.filter(u => u.id !== userId),
      suggestedUsers: prev.suggestedUsers.filter(u => u.id !== userId)
    }));
  }, []);

  const handleNearbyUpdate = useCallback((e: Event) => {
    const user = (e as CustomEvent).detail;
    if (!user?.id || !isVisible(user.id)) return;
    setData(prev => {
      const idx = prev.nearbyUsers.findIndex(u => u.id === user.id);
      const updatedUsers = [...prev.nearbyUsers];
      if (idx >= 0) {
        updatedUsers[idx] = { ...updatedUsers[idx], ...user };
      } else {
        updatedUsers.push(user);
      }
      return { ...prev, nearbyUsers: updatedUsers };
    });
  }, [isVisible]);

  // WebSocket listeners
  useEffect(() => {
    const handleLeftRadius = (e: Event) => {
      const { user_id } = (e as CustomEvent).detail;
      if (!user_id) return;
      setData(prev => ({
        ...prev,
        nearbyUsers: prev.nearbyUsers.filter(u => u.id !== user_id)
      }));
    };

    const handleCrossing = () => {
      fetchCrossings();
    };

    const handleDismiss = (e: Event) => {
      const userId = (e as CustomEvent).detail;
      if (userId) dismissUser(userId);
    };

    window.addEventListener('nearby_user_update', handleNearbyUpdate);
    window.addEventListener('user_left_radius', handleLeftRadius);
    window.addEventListener('crossing_detected', handleCrossing);
    window.addEventListener('dismiss_suggestion', handleDismiss);

    return () => {
      window.removeEventListener('nearby_user_update', handleNearbyUpdate);
      window.removeEventListener('user_left_radius', handleLeftRadius);
      window.removeEventListener('crossing_detected', handleCrossing);
      window.removeEventListener('dismiss_suggestion', handleDismiss);
    };
  }, [fetchCrossings, handleNearbyUpdate, dismissUser]);

  const removeSuggestedUser = useCallback((userId: string) => {
    setData(prev => ({
      ...prev,
      suggestedUsers: prev.suggestedUsers.filter(u => u.id !== userId)
    }));
  }, []);

  const removeNearbyUser = useCallback((userId: string) => {
    setData(prev => ({
      ...prev,
      nearbyUsers: prev.nearbyUsers.filter(u => u.id !== userId)
    }));
  }, []);

  return {
    ...data,
    removeSuggestedUser,
    removeNearbyUser,
    dismissUser,
    refresh: {
      nearby: fetchNearby,
      crossings: fetchCrossings,
      suggested: fetchSuggested,
      stories: fetchStories,
      heatmap: fetchHeatmap
    }
  };
};
