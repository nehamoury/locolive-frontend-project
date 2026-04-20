import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export interface ExploreData {
  nearbyUsers: any[];
  crossings: any[];
  suggestedUsers: any[];
  mapStories: any[];
  heatmap: any[];
  loading: {
    nearby: boolean;
    crossings: boolean;
    suggested: boolean;
    stories: boolean;
    heatmap: boolean;
    connections: boolean;
  };
}

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

  const lastFetchRef = useRef<Record<string, number>>({});

  const fetchNearby = useCallback(async () => {
    if (!position) return;
    const now = Date.now();
    if (lastFetchRef.current.nearby && now - lastFetchRef.current.nearby < 10000) return;

    try {
      const res = await api.get('/users/nearby', { 
        params: { lat: position.lat, lng: position.lng, radius: 5 } 
      });
      const filtered = (res.data || []).filter((u: any) => !connectionIds.has(u.id));
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
  }, [position, connectionIds]);

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
      // res.data is already filtered by backend typically, but we'll re-filter for safety
      const filtered = (res.data || []).filter((u: any) => !connectionIds.has(u.id));
      setData(prev => ({ 
        ...prev, 
        suggestedUsers: filtered, 
        loading: { ...prev.loading, suggested: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch suggested:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, suggested: false } }));
    }
  }, [connectionIds]);

  const fetchConnections = useCallback(async () => {
    try {
      const [accepted, sent, pending] = await Promise.all([
        api.get('/connections'),
        api.get('/connections/sent'),
        api.get('/connections/requests')
      ]);

      const ids = new Set<string>();
      [...(accepted.data || []), ...(sent.data || []), ...(pending.data || [])].forEach(c => {
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
    try {
      const res = await api.get('/location/heatmap');
      setData(prev => ({ 
        ...prev, 
        heatmap: res.data || [], 
        loading: { ...prev.loading, heatmap: false } 
      }));
    } catch (err) {
      console.error('[Explore] Failed to fetch heatmap:', err);
      setData(prev => ({ ...prev, loading: { ...prev.loading, heatmap: false } }));
    }
  }, []);

  // Initial and periodic fetches
  useEffect(() => {
    fetchCrossings();
    fetchConnections();
    fetchHeatmap();
  }, [fetchCrossings, fetchConnections, fetchHeatmap]);

  useEffect(() => {
    if (position) {
      fetchNearby();
      fetchStories();
      fetchSuggested(); // Fetch suggested after connections are known
    }
  }, [position, fetchNearby, fetchStories, fetchSuggested]);

  const handleNearbyUpdate = useCallback((e: Event) => {
    const user = (e as CustomEvent).detail;
    if (!user?.id || connectionIds.has(user.id)) return;
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
  }, [connectionIds]);

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
      // Refresh crossings on detection
      fetchCrossings();
    };

    window.addEventListener('nearby_user_update', handleNearbyUpdate);
    window.addEventListener('user_left_radius', handleLeftRadius);
    window.addEventListener('crossing_detected', handleCrossing);

    return () => {
      window.removeEventListener('nearby_user_update', handleNearbyUpdate);
      window.removeEventListener('user_left_radius', handleLeftRadius);
      window.removeEventListener('crossing_detected', handleCrossing);
    };
  }, [fetchCrossings, handleNearbyUpdate]);

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
    refresh: {
      nearby: fetchNearby,
      crossings: fetchCrossings,
      suggested: fetchSuggested,
      stories: fetchStories,
      heatmap: fetchHeatmap
    }
  };
};
