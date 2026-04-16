import { useState } from 'react';
import { Search, Filter, MapPin, Loader2 } from 'lucide-react';
import { useAdminCrossings } from '../../hooks/useAdmin';

function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Crossings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');
  const { data, isLoading } = useAdminCrossings(1, 100); // Fetch top 100 recent crossings

  const crossings = data?.items || [];

  const filteredCrossings = crossings.filter(crossing => {
    const matchesSearch = 
      crossing.userA.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crossing.userB.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crossing.userA.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crossing.userB.username?.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Server currently returns distance: 0, but if updated in future:
    const matchesDistance = distanceFilter === 'all' || 
      (distanceFilter === 'short' && crossing.distance < 30) ||
      (distanceFilter === 'medium' && crossing.distance >= 30 && crossing.distance < 50) ||
      (distanceFilter === 'long' && crossing.distance >= 50);
      
    return matchesSearch && matchesDistance;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Crossings Management</h1>
        <span className="text-sm text-gray-500">{filteredCrossings.length} crossings</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={distanceFilter}
            onChange={(e) => setDistanceFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
          >
            <option value="all">All Distances</option>
            <option value="short">&lt; 30m</option>
            <option value="medium">30-50m</option>
            <option value="long">&gt; 50m</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User A</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User B</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Distance</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading crossings...
                </td>
              </tr>
            ) : filteredCrossings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No crossings found matching criteria.
                </td>
              </tr>
            ) : filteredCrossings.map((crossing) => (
                <tr key={crossing.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{crossing.userA.full_name[0]}</span>
                    </div>
                    <span className="font-medium text-gray-900">{crossing.userA.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#833AB4] to-[#FF006E] flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{crossing.userB.full_name[0]}</span>
                    </div>
                    <span className="font-medium text-gray-900">{crossing.userB.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatTime(crossing.time)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{crossing.location.lat.toFixed(4)}, {crossing.location.lng.toFixed(4)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    {crossing.distance}m
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="px-3 py-1.5 bg-[#FF006E] text-white rounded-lg text-sm font-medium hover:bg-[#FF006E]/90 transition-colors">
                    View on Map
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Crossings;