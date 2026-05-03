import { useState, useEffect } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [error, setError] = useState<string | null>(() =>
    navigator.geolocation ? null : 'Geolocation is not supported by your browser'
  );

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { location, error };
};

export default useLocation;
