import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Users, MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useAdminMapUsers } from '../../hooks/useAdmin';
import type { MapUser } from '../../services/adminApi';

const pinkIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF006E" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

export function LiveMap() {
  const { data, isLoading } = useAdminMapUsers();
  const [view, setView] = useState<'users' | 'crossings'>('users');
  const [distance, setDistance] = useState<1 | 5 | 10>(5);
  const [center] = useState<[number, number]>([12.9716, 77.5946]);

  const users: MapUser[] = data?.users || [];
  const onlineUsers = useMemo(() => users.filter(u => u.online), [users]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white border-b md:border-r border-gray-200 p-4 md:overflow-y-auto z-10 shrink-0 shadow-sm md:shadow-none">
        <h1 className="text-xl font-bold text-gray-900 mb-4 hidden md:block">Live Map</h1>
        
        {/* Filters */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 hidden md:block">View</label>
            <div className="flex gap-2">
              <button
                onClick={() => setView('users')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'users' ? 'bg-[#FF006E] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Users</span>
              </button>
              <button
                onClick={() => setView('crossings')}
                className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'crossings' ? 'bg-[#FF006E] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Crossings</span>
              </button>
            </div>
          </div>

          <div className="hidden md:block">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Distance</label>
            <div className="flex gap-2">
              {[1, 5, 10].map(d => (
                <button
                  key={d}
                  onClick={() => setDistance(d as 1 | 5 | 10)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    distance === d ? 'bg-[#833AB4] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d}km
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="p-3 md:p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl flex items-center md:items-start md:flex-col justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-gray-700">Live Now</span>
            </div>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-400 mt-0 md:mt-2" />
            ) : (
              <div className="flex items-baseline gap-1 mt-0 md:mt-1">
                <p className="text-xl md:text-2xl font-bold text-gray-900">{onlineUsers.length}</p>
                <p className="text-xs text-gray-500">active</p>
              </div>
            )}
          </div>

          {/* User List - Hidden on mobile */}
          <div className="hidden md:block">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Active Users</label>
            <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-1">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20 mb-1" />
                      <div className="h-2 bg-gray-100 rounded w-14" />
                    </div>
                  </div>
                ))
              ) : onlineUsers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">No active users currently</p>
              ) : (
                onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-white">{user.full_name[0]?.toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[400px]">
        <MapContainer
          center={center}
          zoom={13}
          className="h-full w-full z-0"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {view === 'users' && (
            <MarkerClusterGroup chunkedLoading>
              {users.map((user, idx) => (
                <Marker
                  key={`${user.id}-${idx}`}
                  position={[user.lat, user.lng]}
                  icon={pinkIcon}
                >
                  <Popup>
                    <div className="text-center p-1">
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {user.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          )}

          {view === 'crossings' && (
            <>
              {users.map((user, idx) => (
                <Circle
                  key={`circle-${user.id}-${idx}`}
                  center={[user.lat, user.lng]}
                  radius={distance * 1000}
                  pathOptions={{
                    color: '#FF006E',
                    fillColor: '#FF006E',
                    fillOpacity: 0.1,
                    weight: 1
                  }}
                />
              ))}
            </>
          )}
        </MapContainer>
      </div>
    </div>

  );
}

export default LiveMap;