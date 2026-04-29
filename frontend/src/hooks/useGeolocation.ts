import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { calculateDistance } from '../utils/geo';

const MIN_DISTANCE_METERS = 50; // Trigger update if moved >50m
const MIN_TIME_MS = 30000;       // Or if >30 seconds have passed
const FORCED_PING_INTERVAL = 60000; // Forced periodic ping every 60s

/**
 * Custom hook to track user location and send it to the backend.
 * Ensures user is always present in Redis GEO for nearby discovery.
 */
export const useGeolocation = (enabled: boolean = true) => {
  const [error, setError] = useState<string | null>(null);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('prompt');

  const lastPingTimeRef = useRef<number>(0);
  const lastSentCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const latestCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const hasLoggedPermissionError = useRef<boolean>(false);
  const initialPingSentRef = useRef<boolean>(false);

  const sendPing = useCallback(async (latitude: number, longitude: number, reason: string) => {
    try {
      // Use reason in debug log to avoid unused parameter warning
      if (import.meta.env.DEV) {
        console.debug(`[Geolocation] Ping reason: ${reason}`);
      }
      const response = await api.post('/location/ping', { latitude, longitude });

      if (response.data?.status === 'ghost') {
        setIsGhostMode(true);
      } else {
        setIsGhostMode(false);
        lastPingTimeRef.current = Date.now();
        lastSentCoordsRef.current = { lat: latitude, lng: longitude };
      }
    } catch (err: any) {
      if (err.response?.status !== 401) {
        console.error('[Geolocation] Ping failed:', err);
      }
    }
  }, []);

  const handleGeolocationError = useCallback((err: GeolocationPositionError, context: string) => {
    let errorMsg = 'Unknown geolocation error';

    if (err.code === err.PERMISSION_DENIED) {
      errorMsg = 'Geolocation permission denied. Enable location access in browser settings.';
      setPermissionState('denied');
      // Only log permission error once to avoid console spam
      if (!hasLoggedPermissionError.current) {
        console.warn(`[Geolocation] Permission denied. Location features will be limited.`);
        hasLoggedPermissionError.current = true;
      }
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      errorMsg = 'Location unavailable. Check your device settings.';
      console.warn(`[Geolocation] ${context}: ${errorMsg}`);
    } else if (err.code === err.TIMEOUT) {
      errorMsg = 'Location request timed out.';
      console.warn(`[Geolocation] ${context}: ${errorMsg}`);
    }

    setError(errorMsg);
  }, []);

  // Check permission state on mount using Permissions API if available
  useEffect(() => {
    if (!enabled || !('geolocation' in navigator)) return;

    // Try to query permission state (modern browsers)
    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((result) => {
          if (!result) return;
        
          const handleChange = () => {
            console.log('[Geolocation] Permission changed:', result.state);
            setPermissionState(result.state as 'granted' | 'denied' | 'prompt');
            if (result.state === 'granted') {
              hasLoggedPermissionError.current = false;
            }
          };

          try {
            if (typeof result.addEventListener === 'function') {
              result.addEventListener('change', handleChange);
            } else if (typeof (result as any).addListener === 'function') {
              (result as any).addListener(handleChange);
            }
          } catch (e) {
            console.warn('[Geolocation] Could not add permission change listener:', e);
          }

          setPermissionState(result.state as 'granted' | 'denied' | 'prompt');
        })
        .catch((err) => {
          console.warn('[Geolocation] Permissions API not fully supported:', err);
          setPermissionState('unknown');
        });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    // Skip if permission is already known to be denied
    if (permissionState === 'denied') {
      if (!hasLoggedPermissionError.current) {
        console.warn('[Geolocation] Permission denied. Location features will be limited.');
        hasLoggedPermissionError.current = true;
      }
      setError('Geolocation permission denied. Enable location access in browser settings.');
      return;
    }

    let watchId: number;

    // ── Force an initial ping on mount to ensure user is in Redis GEO ──
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        latestCoordsRef.current = { lat: latitude, lng: longitude };
        setPermissionState('granted');
        hasLoggedPermissionError.current = false;
        
        // Send initial ping and mark that we've sent it
        if (!initialPingSentRef.current) {
          sendPing(latitude, longitude, 'initial_sync');
          initialPingSentRef.current = true;
        }

        // ── Watch for position changes with distance/time gating ──
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const now = Date.now();
            setPosition({ lat: latitude, lng: longitude });
            latestCoordsRef.current = { lat: latitude, lng: longitude };
            setPermissionState('granted');

            let shouldPing = false;
            let reason = '';
            if (!lastSentCoordsRef.current) {
              shouldPing = true;
              reason = 'first_position';
            } else {
              const distance = calculateDistance(
                lastSentCoordsRef.current.lat,
                lastSentCoordsRef.current.lng,
                latitude,
                longitude
              );
              const elapsed = now - lastPingTimeRef.current;

              if (distance > MIN_DISTANCE_METERS) {
                shouldPing = true;
                reason = `moved_${Math.round(distance)}m`;
              } else if (elapsed > MIN_TIME_MS) {
                shouldPing = true;
                reason = `time_elapsed_${Math.round(elapsed / 1000)}s`;
              }
            }

            if (shouldPing) {
              sendPing(latitude, longitude, reason);
            }
          },
          (err) => handleGeolocationError(err, 'Watch position error'),
          { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
        );
      },
      (err) => handleGeolocationError(err, 'Initial position failed'),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 }
    );

    // ── Forced periodic ping to keep Redis fresh (every 60s) ──
    const intervalId = setInterval(() => {
      const coords = latestCoordsRef.current;
      if (coords) {
        const elapsed = Date.now() - lastPingTimeRef.current;
        if (elapsed >= FORCED_PING_INTERVAL) {
          sendPing(coords.lat, coords.lng, 'periodic_keepalive');
        }
      }
    }, FORCED_PING_INTERVAL);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [enabled, sendPing, handleGeolocationError, permissionState]);

  return { error, isGhostMode, position, permissionState };
};

