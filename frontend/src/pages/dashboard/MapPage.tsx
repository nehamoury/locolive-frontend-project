import { useEffect, useRef, useState, useMemo } from 'react';
import { calculateDistance } from '../../utils/geo';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './MapPage.css';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND } from '../../utils/config';
import { Ghost, ShieldAlert, Navigation, Star, Heart, MapPin } from 'lucide-react';
import { MapFilters } from '../../components/map/MapFilters';
import { UserPreviewCard } from '../../components/map/UserPreviewCard';
import CreateStoryModal from '../../components/story/CreateStoryModal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ─── Toast Component ───────────────────────────────────────────────────────────
interface DiscoveryToastProps { message: string; type: 'like' | 'superlike'; }

const DiscoveryToast: React.FC<DiscoveryToastProps> = ({ message, type }) => (
    <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.9 }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-3 px-8 py-4 bg-bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-border-base transition-colors duration-300"
    >
        {type === 'like' ? (
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
        ) : (
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        )}
        <span className="text-text-base font-bold tracking-tight text-sm flex items-center gap-2">
            {message}
        </span>
    </motion.div>
);

// ─── Custom Icons ─────────────────────────────────────────────────────────────

const createPulsingUserIcon = () =>
    new L.DivIcon({
        html: `
            <div class="user-marker-pulse">
                <div class="inner-circle"></div>
                <div class="pulse"></div>
                <div class="pulse-ring"></div>
            </div>
        `,
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
    });

const createStoryMarkerIcon = (avatarUrl: string, username: string, count: number) => {
    const initial = username ? username.charAt(0).toUpperCase() : '?';
    const imgHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:900;color:white;font-style:italic;">${initial}</div>`;
    const badgeHtml = count > 1 
        ? `<div class="marker-badge" style="width:24px;height:24px;font-size:12px;top:-6px;right:-6px;">${count}</div>` 
        : '';

    return new L.DivIcon({
        html: `
            <div class="story-marker-refined" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div class="story-marker" style="width:72px;height:72px;">
                    <div class="marker-glow"></div>
                    <div class="marker-container" style="width:64px;height:64px;border-width:4px;background:var(--bg-card);border-color:var(--color-primary);">${imgHtml}</div>
                    ${badgeHtml}
                </div>
                <div style="background:var(--bg-card);backdrop-filter:blur(8px);padding:4px 12px;border-radius:12px;border:2px solid var(--color-primary);box-shadow:0 10px 20px -5px rgba(var(--color-primary-rgb),0.3);transform:translateY(-8px);">
                    <span style="font-size:11px;font-weight:900;color:var(--text-base);text-transform:uppercase;font-style:italic;letter-spacing:-0.5px;white-space:nowrap;">@${username}</span>
                </div>
            </div>
        `,
        className: '',
        iconSize: [80, 110],
        iconAnchor: [40, 72],
    });
};

const createOtherUserIcon = (avatarUrl: string, username: string) => {
    const initial = username ? username.charAt(0).toUpperCase() : '?';
    const imgHtml = avatarUrl
        ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;" />`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:white;font-style:italic;background:linear-gradient(45deg, #10b981, #3b82f6);">${initial}</div>`;

    return new L.DivIcon({
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style="position:relative;width:56px;height:56px;">
                    <div style="width:56px;height:56px;border-radius:50%;border:4px solid #10b981;overflow:hidden;box-shadow:0 0 20px rgba(16,185,129,0.4);background:var(--bg-card);">
                        ${imgHtml}
                    </div>
                    <div style="position:absolute;bottom:0px;right:0px;width:18px;height:18px;background:#10b981;border-radius:50%;border:4px solid var(--bg-card);"></div>
                </div>
                <div style="background:var(--bg-card);backdrop-filter:blur(8px);padding:3px 10px;border-radius:10px;border:2px solid #10b981;box-shadow:0 10px 15px -3px rgba(16,185,129,0.3);transform:translateY(-4px);">
                    <span style="font-size:10px;font-weight:900;color:var(--text-base);text-transform:uppercase;font-style:italic;letter-spacing:-0.5px;white-space:nowrap;">${username}</span>
                </div>
            </div>
        `,
        className: '',
        iconSize: [70, 90],
        iconAnchor: [35, 56],
    });
};

const createHeatIcon = (intensity: number) => {
    const size = Math.min(200, 80 + intensity * 12);
    return new L.DivIcon({
        html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:radial-gradient(circle,rgba(var(--color-primary-rgb),0.45) 0%,rgba(var(--color-accent-rgb),0.2) 50%,transparent 70%);
            filter:blur(18px);
            animation:heatPulse 3s ease-in-out infinite;
        "></div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// ─── Inner component: fetches stories on map move ─────────────────────────────

const MapEventHandler = ({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) => {
    const map = useMapEvents({
        moveend: () => onBoundsChange(map.getBounds()),
        load: () => onBoundsChange(map.getBounds()),
    });
    useEffect(() => {
        onBoundsChange(map.getBounds());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
};

const FlyToUser = ({ position }: { position: [number, number] | null }) => {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 15, { duration: 2 });
    }, [position, map]);
    return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface MapPageProps {
  onUserSelect?: (userId: string) => void;
  onStorySelect?: (stories: any[], index: number) => void;
  onConnect?: (userId: string) => void;
  userPosition?: [number, number] | null;
}

const NEARBY_POLL_INTERVAL = 30000; // Fallback polling every 30s

const MapPage = ({ onUserSelect, onStorySelect, onConnect, userPosition: externalPosition }: MapPageProps) => {
    const { } = useAuth();
    const [clusters, setClusters] = useState<any[]>([]);
    const [userPosition, setUserPosition] = useState<[number, number] | null>(externalPosition || null);
    const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
    const [isGhostMode, setIsGhostMode] = useState(false);
    const [isPanicActive, setIsPanicActive] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [locationName, setLocationName] = useState('India');
    const [toast, setToast] = useState<{ message: string; type: 'like' | 'superlike' } | null>(null);
    const [activeFilters, setActiveFilters] = useState({ distance: null, isOnline: false, hasStories: false });
    const [connectionIds, setConnectionIds] = useState<Set<string>>(new Set());
    const latestPositionRef = useRef<[number, number] | null>(externalPosition || null);

    // Throttling Refs
    const lastNearbyFetchRef = useRef<{time: number, coords: [number, number]} | null>(null);
    const lastCityFetchRef = useRef<{time: number, coords: [number, number]} | null>(null);

    const showDiscoveryToast = (message: string, type: 'like' | 'superlike') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2500);
    };

    const handleConnect = async (userId: string) => {
        if (!userId) return;
        const userInSelected = selectedUser?.stories?.find((s: any) => (s.user_id || s.id || s.userId) === userId);
        const user = userInSelected;
        const name = user?.full_name || user?.username || 'User';

        try {
            showDiscoveryToast(`Liked ${name}!`, 'like');
            
            if (onConnect) {
                await onConnect(userId);
            } else {
                await api.post('/connections/request', { target_user_id: userId });
            }
            
            if (selectedUser) setSelectedUser(null);
        } catch (err) {
            console.error('[Map] Failed to send connection request:', err);
        }
    };

    const fetchNearbyUsers = async (lat: number, lng: number) => {
        try {
            console.log(`[Map] Fetching nearby users at lat=${lat.toFixed(4)}, lng=${lng.toFixed(4)}`);
            const res = await api.get('/users/nearby', { params: { lat, lng } });
            const users = res.data || [];
            console.log(`[Map] Nearby users received: ${users.length}`);
            setNearbyUsers(users);
        } catch (err) {
            console.error('[Map] Failed to fetch nearby users:', err);
        }
    };

    const fetchCity = async (lat: number, lng: number) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.state_district || 'India';
            setLocationName(city);
        } catch (err) {
            console.error('[Map] Failed to fetch city:', err);
        }
    };

    // ── Sync with externalPosition prop (from Dashboard) ─────────────────
    useEffect(() => {
        if (!externalPosition) return;

        const [lat, lng] = externalPosition;
        setUserPosition([lat, lng]);
        latestPositionRef.current = [lat, lng];

        const now = Date.now();

        // Optimized nearby fetch (move >100m or >30s elapsed)
        let shouldFetchNearby = false;
        if (!lastNearbyFetchRef.current) {
            shouldFetchNearby = true;
        } else {
            const dist = calculateDistance(lastNearbyFetchRef.current.coords[0], lastNearbyFetchRef.current.coords[1], lat, lng);
            if (dist > 100 || (now - lastNearbyFetchRef.current.time > 30000)) {
                shouldFetchNearby = true;
            }
        }

        if (shouldFetchNearby) {
            fetchNearbyUsers(lat, lng);
            lastNearbyFetchRef.current = { time: now, coords: [lat, lng] };
        }

        // Optimized city fetch (move >500m or >10min elapsed)
        let shouldFetchCity = false;
        if (!lastCityFetchRef.current) {
            shouldFetchCity = true;
        } else {
            const dist = calculateDistance(lastCityFetchRef.current.coords[0], lastCityFetchRef.current.coords[1], lat, lng);
            if (dist > 500 || (now - lastCityFetchRef.current.time > 600000)) {
                shouldFetchCity = true;
            }
        }

        if (shouldFetchCity) {
            fetchCity(lat, lng);
            lastCityFetchRef.current = { time: now, coords: [lat, lng] };
        }
    }, [externalPosition]);

    // ── Fallback polling: refetch nearby users every 30s ─────────────────
    useEffect(() => {
        const intervalId = setInterval(() => {
            const pos = latestPositionRef.current;
            if (pos) {
                console.log('[Map] Polling nearby users (30s fallback)');
                fetchNearbyUsers(pos[0], pos[1]);
            }
        }, NEARBY_POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, []);

    // (Location ping timer removed - handled by useGeolocation in Dashboard)

    // ── WebSocket event listeners for real-time updates ──────────────────
    useEffect(() => {
        const handleNearbyUpdate = (e: Event) => {
            const user = (e as CustomEvent).detail;
            if (!user?.id) return;
            console.log('[Map] WS nearby_user_update:', user.username);

            setNearbyUsers(prev => {
                const idx = prev.findIndex(u => u.id === user.id);
                if (idx >= 0) {
                    // Update existing user position/data
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], ...user };
                    return updated;
                }
                // Add new nearby user
                return [...prev, user];
            });
        };

        const handleLeftRadius = (e: Event) => {
            const { user_id } = (e as CustomEvent).detail;
            if (!user_id) return;
            console.log('[Map] WS user_left_radius:', user_id);

            setNearbyUsers(prev => prev.filter(u => u.id !== user_id));
        };

        const handleCrossing = (e: Event) => {
            const notif = (e as CustomEvent).detail;
            console.log('[Map] WS crossing_detected:', notif?.message);
            // Crossing notifications are handled by useNotifications toast.
            // Optionally trigger a UI highlight here.
        };

        window.addEventListener('nearby_user_update', handleNearbyUpdate);
        window.addEventListener('user_left_radius', handleLeftRadius);
        window.addEventListener('crossing_detected', handleCrossing);

        return () => {
            window.removeEventListener('nearby_user_update', handleNearbyUpdate);
            window.removeEventListener('user_left_radius', handleLeftRadius);
            window.removeEventListener('crossing_detected', handleCrossing);
        };
    }, []);

    const fetchStories = async (bounds: L.LatLngBounds) => {
        try {
            const params = {
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            };
            const res = await api.get('/stories/map', { params });
            setClusters(res.data.clusters || []);
        } catch (err) {
            console.error('Failed to fetch map stories:', err);
        }
    };

    const fetchHeatmap = async () => {
        try {
            const res = await api.get('/location/heatmap');
            setHeatmap(res.data || []);
        } catch (err) {
            console.error('Failed to fetch heatmap:', err);
        }
    };

    useEffect(() => {
        fetchHeatmap();
        
        api.get('/connections').then(res => {
            const ids = new Set((res.data || []).map((c: any) => c.status === 'accepted' ? c.id : c.id).filter(Boolean));
            setConnectionIds(ids as Set<string>);
        }).catch(() => {});
    }, []);

    const userIcon = createPulsingUserIcon();
    const defaultCenter: [number, number] = userPosition || [21.2514, 81.6296];

    const getCoords = (item: any): [number, number] | null => {
        const rawLat = item.latitude !== undefined ? item.latitude : item.lat;
        const rawLng = item.longitude !== undefined ? item.longitude : item.lng;
        if (rawLat == null || rawLng == null) return null;
        
        const lat = Number(rawLat);
        const lng = Number(rawLng);

        const id = item.id || item.userId || item.geohash || '0';
        const numId = typeof id === 'string' ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Number(id);
        
        const jitterLat = (numId % 10 - 5) * 0.00005;
        const jitterLng = (numId % 12 - 6) * 0.00005;

        return [lat + jitterLat, lng + jitterLng];
    };

    const filteredNearbyUsers = useMemo(() => {
        return nearbyUsers.filter(u => {
            if (activeFilters.isOnline && !u.online) return false;
            return true;
        });
    }, [nearbyUsers, activeFilters]);

    return (
        <div className="relative h-full w-full overflow-hidden bg-bg-base transition-colors duration-300">
            <MapContainer
                center={defaultCenter}
                zoom={14}
                zoomControl={false}
                className="absolute inset-0 w-full h-full z-0"
                style={{ background: 'var(--bg-base)' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution=""
                    maxZoom={19}
                />

                <MapEventHandler onBoundsChange={fetchStories} />
                <FlyToUser position={flyTo} />

                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={80}
                    spiderfyDistanceMultiplier={2}
                    showCoverageOnHover={false}
                    iconCreateFunction={(cluster: any) => {
                        const count = cluster.getChildCount();
                        return L.divIcon({
                            html: `
                                <div class="custom-cluster-icon" style="width:40px;height:40px;">
                                    <div class="cluster-inner">
                                        <span>${count}</span>
                                    </div>
                                    <div class="cluster-pulse"></div>
                                </div>
                            `,
                            className: '',
                            iconSize: L.point(40, 40, true),
                        });
                    }}
                >
                    {filteredNearbyUsers
                        .map((u) => ({ ...u, coords: getCoords(u) }))
                        .filter(u => u.id && u.coords)
                        .map((u) => (
                        <Marker
                            key={`user-${u.id}`}
                            position={u.coords!}
                            icon={createOtherUserIcon(u.avatar_url ? (u.avatar_url.startsWith('http') ? u.avatar_url : `${BACKEND}${u.avatar_url}`) : '', u.username)}
                            eventHandlers={{ click: () => setSelectedUser({ count: 0, stories: [u], isUserOnly: true }) }}
                        >
                            <Popup className="custom-popup">
                                <div className="font-bold text-text-base leading-tight">@{u.username}</div>
                                <div className="text-[10px] text-text-muted uppercase">{u.distance ? `${Number(u.distance).toFixed(1)} km` : 'Nearby'}</div>
                                {connectionIds.has(u.id) && <div className="text-[10px] text-primary font-bold mt-1 uppercase">Connection</div>}
                            </Popup>
                        </Marker>
                    ))}

                    {clusters
                        .map((c) => ({ ...c, coords: getCoords(c) }))
                        .filter(cluster => cluster.geohash && cluster.coords)
                        .map((cluster) => {
                        const avatar = cluster.stories?.[0]?.avatar_url
                            ? (cluster.stories[0].avatar_url.startsWith('http') ? cluster.stories[0].avatar_url : `${BACKEND}${cluster.stories[0].avatar_url}`)
                            : '';
                        const username = cluster.stories?.[0]?.username || 'User';
                        const icon = createStoryMarkerIcon(avatar, username, cluster.count);
                        return (
                            <Marker
                                key={`story-${cluster.geohash}`}
                                position={cluster.coords!}
                                icon={icon}
                                eventHandlers={{ click: () => setSelectedUser(cluster) }}
                            />
                        );
                    })}
                </MarkerClusterGroup>

                {userPosition && (
                    <>
                        <Marker position={userPosition} icon={userIcon} />
                        <Circle
                            center={userPosition}
                            radius={150}
                            pathOptions={{
                                color: 'var(--color-primary)',
                                fillColor: 'var(--color-primary)',
                                fillOpacity: 0.1,
                                weight: 2,
                                opacity: 0.5,
                            }}
                        />
                    </>
                )}

                {heatmap
                    .filter(pt => (pt.lat || pt.latitude) && (pt.lng || pt.longitude))
                    .map((pt, idx) => (
                        <Marker 
                            key={`heat-${idx}`}
                            position={[pt.lat || pt.latitude, pt.lng || pt.longitude]}
                            icon={createHeatIcon(pt.intensity || pt.count || 5)}
                            interactive={false}
                        />
                    ))
                }
            </MapContainer>

            {/* Overlays */}
            <div className="absolute top-6 left-6 right-6 z-[600] flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-base/95 backdrop-blur-2xl border border-border-base rounded-2xl shadow-xl transition-colors duration-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-text-base uppercase tracking-[2px] leading-none mt-0.5">Live Live</span>
                    </div>
                    
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-bg-base/95 backdrop-blur-2xl border border-border-base rounded-2xl shadow-xl transition-colors duration-300">
                        <MapPin size={14} className="text-primary" />
                        <span className="text-[11px] font-bold text-text-base uppercase tracking-wider">{locationName}</span>
                    </div>
                </div>
            </div>

            <MapFilters onFilterChange={setActiveFilters} activeFilters={activeFilters} />

            <div className="absolute bottom-10 left-10 z-[600] flex flex-col gap-4">
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setIsPanicActive(!isPanicActive)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-2xl border border-white/20 transition-all shadow-2xl cursor-pointer ${
                        isPanicActive ? 'bg-red-500 text-white' : 'bg-bg-base/90 text-red-500 hover:bg-bg-base'
                    }`}
                >
                    <ShieldAlert className="w-6 h-6" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setIsGhostMode(!isGhostMode)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center backdrop-blur-2xl border border-white/20 transition-all shadow-2xl cursor-pointer ${
                        isGhostMode ? 'bg-purple-500 text-white' : 'bg-bg-base/90 text-purple-500 hover:bg-bg-base'
                    }`}
                >
                    <Ghost className="w-6 h-6" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => { if (userPosition) setFlyTo([...userPosition]); }}
                    className="w-14 h-14 bg-bg-base/90 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl hover:bg-bg-base transition-all text-text-base cursor-pointer"
                >
                    <Navigation className="w-6 h-6" />
                </motion.button>
            </div>

            <AnimatePresence>
                {selectedUser && (
                    <UserPreviewCard 
                        user={selectedUser} 
                        isConnection={connectionIds.has(selectedUser?.stories?.[0]?.user_id || selectedUser?.stories?.[0]?.id || selectedUser?.id)}
                        onClose={() => setSelectedUser(null)}
                        onConnect={handleConnect}
                        onProfileOpen={onUserSelect!}
                        onStoryOpen={(stories) => onStorySelect?.(stories, 0)}
                    />
                )}
            </AnimatePresence>

            <CreateStoryModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => setIsCreateModalOpen(false)}
            />

            {isGhostMode && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[700]">
                    <div className="px-6 py-2 bg-text-base/95 backdrop-blur-md rounded-full text-bg-base text-[11px] font-black uppercase tracking-[2px] border border-border-base shadow-2xl flex items-center gap-2">
                        <Ghost className="w-4 h-4 text-accent" /> Ghost Mode Active
                     </div>
                 </div>
            )}

            <AnimatePresence mode="wait">
                {toast && <DiscoveryToast key={toast.message + toast.type} message={toast.message} type={toast.type} />}
            </AnimatePresence>
        </div>
    );
};

export default MapPage;
