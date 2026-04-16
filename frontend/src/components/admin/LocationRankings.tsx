import type { LocationStats } from '../../types/admin';

interface LocationRankingsProps {
  locations: LocationStats[];
}

export function LocationRankings({ locations }: LocationRankingsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Top Locations</h3>
      <div className="space-y-3">
        {locations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No location data</p>
        ) : (
          locations.slice(0, 5).map((location, index) => (
            <div key={location.city} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{location.city}</p>
                  <p className="text-xs text-gray-500">{location.country}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-900">{location.activeUsers}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LocationRankings;