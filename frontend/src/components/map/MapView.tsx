import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import { BACKEND } from '../../utils/config';

// ─── Icon Factories ──────────────────────────────────────────────────────────

/** Current user "You" marker */
const createYouIcon = () =>
  new L.DivIcon({
    html: `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="
          width:52px;height:52px;border-radius:50%;
          background:linear-gradient(135deg,#6366f1,#8b5cf6);
          border:3px solid #a78bfa;
          box-shadow:0 0 0 6px rgba(139,92,246,0.25),0 0 20px rgba(139,92,246,0.5);
          display:flex;align-items:center;justify-content:center;
          font-size:22px;
        ">📍</div>
        <div style="
          margin-top:4px;background:rgba(139,92,246,0.9);
          backdrop-filter:blur(8px);
          color:#fff;font-size:10px;font-weight:800;
          padding:2px 8px;border-radius:999px;
          border:1px solid rgba(255,255,255,0.3);
          white-space:nowrap;letter-spacing:0.05em;
          box-shadow:0 2px 10px rgba(139,92,246,0.6);
        ">You</div>
      </div>`,
    className: '',
    iconSize: [60, 72],
    iconAnchor: [30, 30],
  });

/** Story author avatar marker with count badge */
const createAvatarIcon = (
  username: string,
  count: number,
  avatarUrl?: string,
  color = '#ec4899'
) => {
  const initial = username.charAt(0).toUpperCase();
  const avatar = avatarUrl
    ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<div style="width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:900;">${initial}</div>`;

  return new L.DivIcon({
    html: `
      <div style="position:relative;display:inline-block;">
        <div style="
          width:52px;height:52px;border-radius:50%;
          border:3px solid ${color};
          box-shadow:0 0 0 4px ${color}44,0 0 16px ${color}88;
          overflow:hidden;
          background:#1a1a2e;
        ">${avatar}</div>
        ${count > 0 ? `
        <div style="
          position:absolute;top:-4px;right:-4px;
          background:#ec4899;color:#fff;
          font-size:10px;font-weight:900;
          width:20px;height:20px;border-radius:50%;
          display:flex;align-items:center;justify-content:center;
          border:2px solid #0a0a1a;
          box-shadow:0 0 8px #ec489999;
        ">${count > 99 ? '99+' : count}</div>` : ''}
      </div>`,
    className: '',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });
};

/** Heatmap glow bubble (no DOM marker overhead) */
const createHeatIcon = (intensity: number) => {
  const size = Math.min(200, 80 + intensity * 12);
  return new L.DivIcon({
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:radial-gradient(circle,rgba(236,72,153,0.45) 0%,rgba(168,85,247,0.2) 50%,transparent 70%);
      filter:blur(18px);
      animation:heatPulse 3s ease-in-out infinite;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Map Event Handler ────────────────────────────────────────────────────────

function MapEvents({ onBoundsChange }: { onBoundsChange: (b: any) => void }) {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const emit = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const b = map.getBounds();
        onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
      }, 300);
    };
    map.on('moveend', emit);
    map.on('zoomend', emit);
    emit();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      map.off('moveend', emit);
      map.off('zoomend', emit);
    };
  }, [map, onBoundsChange]);

  return null;
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type FilterMode = 'stories' | 'heatmap' | 'both';

const TABS: { id: FilterMode; label: string; emoji: string }[] = [
  { id: 'stories', label: 'Stories', emoji: '📷' },
  { id: 'heatmap', label: 'Heatmap', emoji: '🔥' },
  { id: 'both',    label: 'Both',    emoji: '✨' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface MapViewProps {
  onStorySelect?: (story: any, allStories: any[]) => void;
}

const MapView = ({ onStorySelect }: MapViewProps) => {
  const [stories, setStories]   = useState<any[]>([]);
  const [heatmap, setHeatmap]   = useState<any[]>([]);
  const [center, setCenter]     = useState<[number, number]>([28.6139, 77.209]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterMode>('both');
  const [cityLabel, setCityLabel] = useState('India');
  const [userPos, setUserPos]   = useState<[number, number] | null>(null);

  // Reverse‑geocode city from coords
  const fetchCity = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      const city =
        data.address?.city ||
        data.address?.town ||
        data.address?.state_district ||
        data.address?.state ||
        'Unknown';
      setCityLabel(city);
    } catch {
      // silently ignore
    }
  }, []);

  const fetchMapData = useCallback(async (bounds: any) => {
    try {
      const [storiesRes, heatmapRes] = await Promise.all([
        api.get('/stories/map', { params: bounds }),
        api.get('/location/heatmap'),
      ]);
      const clusters = storiesRes.data.clusters || [];
      const processedClusters = clusters.map((c: any) => ({
        ...c,
        latitude: c.latitude,
        longitude: c.longitude,
        // Ensure stories list is consistent
        stories: (c.stories || []).map((s: any) => ({
          ...s,
          latitude: s.lat ?? s.latitude,
          longitude: s.lng ?? s.longitude,
        }))
      }));
      setStories(processedClusters);
      setHeatmap(heatmapRes.data || []);
    } catch (err: any) {
      console.error('Map data fetch failed:', err);
      if (err.response?.status === 401) window.location.reload();
    } finally {
      setLoading(false);
    }
  }, []);

  // Watch user location
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(async ({ coords }) => {
      const { latitude, longitude } = coords;
      setCenter([latitude, longitude]);
      setUserPos([latitude, longitude]);
      fetchCity(latitude, longitude);
      try {
        await api.post('/location/ping', { latitude, longitude });
      } catch {/* ignore */}
    });
    return () => navigator.geolocation.clearWatch(id);
  }, [fetchCity]);

  const showStories = filter === 'stories' || filter === 'both';
  const showHeatmap = filter === 'heatmap' || filter === 'both';

  return (
    <div className="h-[calc(100vh-80px)] w-full relative" style={{ background: '#050510' }}>

      {/* ── Filter Tabs (top center) ── */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 6,
        background: 'rgba(10,10,30,0.75)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '6px 8px', borderRadius: 999,
        boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 999, border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              transition: 'all 0.2s',
              background: filter === tab.id
                ? 'linear-gradient(135deg,#ec4899,#8b5cf6)'
                : 'transparent',
              color: filter === tab.id ? '#fff' : 'rgba(255,255,255,0.55)',
              boxShadow: filter === tab.id ? '0 0 16px rgba(236,72,153,0.5)' : 'none',
            }}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}

        {/* City pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 12px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          marginLeft: 2,
        }}>
          <MapPin size={11} />
          <span>{cityLabel}</span>
        </div>
      </div>

      {/* ── Loading Overlay ── */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2000,
          background: 'rgba(5,5,16,0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid rgba(236,72,153,0.2)',
            borderTopColor: '#ec4899',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600 }}>
            Discovering your world…
          </span>
        </div>
      )}

      {/* ── Leaflet Map ── */}
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#050510' }}
        zoomControl={false}
      >
        <MapEvents onBoundsChange={fetchMapData} />

        {/* Dark neon tile layer */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Current user marker */}
        {userPos && (
          <Marker position={userPos} icon={createYouIcon()}>
            <Popup className="neon-popup">
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>📍 You are here</div>
            </Popup>
          </Marker>
        )}

        {/* Story markers */}
        {showStories &&
          stories
            .filter(s => s.latitude !== undefined && s.longitude !== undefined)
            .map((cluster: any) => {
              const count = cluster.count ?? 0;
              const firstStory = cluster.stories?.[0];
              if (!firstStory && !cluster.isCluster) return null;

              const displayUsername = firstStory?.username || cluster.username || 'Users';
              const avatarUrl = firstStory?.avatar_url
                ? `${BACKEND}${firstStory.avatar_url}`
                : undefined;
              
              const colors = ['#ec4899', '#06b6d4', '#f59e0b', '#10b981'];
              const color = colors[Math.abs(cluster.geohash?.charCodeAt?.(0) ?? 0) % colors.length];

              return (
                <Marker
                  key={cluster.geohash}
                  position={[cluster.latitude, cluster.longitude]}
                  icon={createAvatarIcon(displayUsername, count, avatarUrl, color)}
                >
                  <Popup className="neon-popup">
                    <div style={{
                      background: 'rgba(15,15,30,0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 16, padding: 12,
                      minWidth: 180, color: '#fff',
                    }}>
                      {firstStory?.media_url && (
                        <div style={{
                          aspectRatio: '9/16', borderRadius: 12,
                          overflow: 'hidden', marginBottom: 10,
                          background: 'rgba(255,255,255,0.05)',
                          maxHeight: 200,
                        }}>
                          <img
                            src={`${BACKEND}${firstStory.media_url}`}
                            alt="Story Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: 13, margin: 0 }}>@{displayUsername}</p>
                          {count > 1 && (
                            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '2px 0 0' }}>
                              {count} stories here
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            if (cluster.stories && cluster.stories.length > 0) {
                              onStorySelect?.(cluster.stories[0], cluster.stories);
                            }
                          }}
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg,#ec4899,#8b5cf6)',
                            border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14,
                          }}
                        >▶</button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

        {/* Heatmap glow bubbles */}
        {showHeatmap &&
          heatmap
            .filter(p => (p.latitude ?? p.lat) !== undefined && (p.longitude ?? p.lng) !== undefined)
            .map((pt: any, idx: number) => (
              <Marker
                key={`heat-${idx}`}
                position={[pt.latitude ?? pt.lat, pt.longitude ?? pt.lng]}
                icon={createHeatIcon(pt.intensity ?? pt.count ?? 5)}
                interactive={false}
              />
            ))}
      </MapContainer>

      {/* ── Bottom Stats Bar ── */}
      <div style={{
        position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', alignItems: 'center', gap: 20,
        background: 'rgba(10,10,30,0.75)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 24px', borderRadius: 999,
        boxShadow: '0 4px 32px rgba(0,0,0,0.4)',
      }}>
        <Stat dot="#ec4899" label={`${stories.length} Stories`} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <Stat dot="#8b5cf6" label={`${heatmap.length} Hotspots`} />
        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
        <Stat dot="#06b6d4" label="Live Discovery" />
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes heatPulse {
          0%,100% { transform: scale(1); opacity: 0.8; }
          50%      { transform: scale(1.18); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-popup-tip-container { display: none; }
        .leaflet-container { font-family: inherit; }
      `}</style>
    </div>
  );
};

// Small helper
const Stat = ({ dot, label }: { dot: string; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <div style={{
      width: 7, height: 7, borderRadius: '50%', background: dot,
      boxShadow: `0 0 6px ${dot}`,
      animation: 'heatPulse 2s ease-in-out infinite',
    }} />
    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

export default MapView;
