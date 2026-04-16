import { useAdminStats } from '../../hooks/useAdmin';
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';
import { StatsCard } from '../../components/admin/StatsCard';
import { AnalyticsChart } from '../../components/admin/AnalyticsChart';
import { LiveActivityPanel } from '../../components/admin/LiveActivity';
import { QuickActions } from '../../components/admin/QuickActions';
import { LocationRankings } from '../../components/admin/LocationRankings';
import { useAdminStore } from '../../stores/adminStore';

export function Dashboard() {
  const { data: stats, isLoading, isError, error } = useAdminStats();
  const { activities, locations } = useAdminStore();
  
  // Initialize WebSocket for real-time updates
  useAdminWebSocket();

  const dailyStats = [
    { date: 'Mon', users: 5200 },
    { date: 'Tue', users: 6100 },
    { date: 'Wed', users: 5800 },
    { date: 'Thu', users: 7200 },
    { date: 'Fri', users: 6800 },
    { date: 'Sat', users: 7900 },
    { date: 'Sun', users: stats?.activeUsers || 0 },
  ];

  if (isError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Failed to load statistics</h2>
        <p className="text-gray-500">{(error as any)?.message || 'Internal server error'}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">System performance monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Live System</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-32"></div>
            </div>
          ))
        ) : (
          <>
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              growth={stats?.totalUsersGrowth}
              color="pink"
            />
            <StatsCard
              title="Active Users (Live)"
              value={stats?.activeUsers || 0}
              isLive
              color="green"
            />
            <StatsCard
              title="Crossings Today"
              value={stats?.crossingsToday || 0}
              color="orange"
            />
            <StatsCard
              title="New Connections"
              value={stats?.totalConnections || 0}
              color="purple"
            />
            <StatsCard
              title="Reels Uploaded"
              value={stats?.reelsToday || 0}
              color="blue"
            />
          </>
        )}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80 animate-pulse flex items-center justify-center">
              <span className="text-gray-400">Loading chart data...</span>
            </div>
          ) : (
            <AnalyticsChart data={dailyStats} title="Active Users - Last 7 Days" />
          )}
        </div>
        <div>
          <LiveActivityPanel activities={activities} />
        </div>
      </div>

      {/* Quick Actions & Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
        <div>
          <LocationRankings locations={locations} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;