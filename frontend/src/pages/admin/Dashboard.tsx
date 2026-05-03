import { useAdminDashboard } from '../../hooks/useAdmin';
import { StatsCard } from '../../components/admin/StatsCard';
import { 
  Users, 
  Activity, 
  Film, 
  AlertCircle, 
  Zap,
  ArrowDownRight,
  Server
} from 'lucide-react';

export function Dashboard() {
  const { data: stats, isLoading, isError } = useAdminDashboard();

  if (isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Connection Failed</h2>
        <p className="text-gray-500 max-w-xs text-center mt-2">
          Unable to fetch real-time analytics. Please check your connection or try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Overview</h1>
          <p className="text-gray-500 mt-1">Real-time performance and operational metrics.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Production Live</span>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <div className="px-3 text-xs text-gray-400 font-medium">
            Last update: Just now
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={{ value: 12.5, isUp: true }}
          color="pink"
          isLoading={isLoading}
        />
        <StatsCard
          title="Active (24h)"
          value={stats?.activeUsers || 0}
          icon={Activity}
          trend={{ value: 8.2, isUp: true }}
          color="blue"
          isLoading={isLoading}
        />
        <StatsCard
          title="Total Content"
          value={(stats?.totalPosts || 0) + (stats?.reelsToday || 0)}
          icon={Film}
          trend={{ value: 4.1, isUp: true }}
          color="purple"
          isLoading={isLoading}
        />
        <StatsCard
          title="Live Sockets"
          value={stats?.activeWebsockets || 0}
          icon={Zap}
          color="orange"
          isLive
          isLoading={isLoading}
        />
        <StatsCard
          title="Error Rate"
          value={stats?.errorRate || "0.05%"}
          icon={Server}
          trend={{ value: 0.1, isUp: false }}
          color="red"
          isLoading={isLoading}
        />
      </div>

      {/* Secondary Information Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* System Health */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8">
                <Activity className="w-24 h-24 text-gray-50/50" />
             </div>
             
             <h3 className="text-xl font-bold text-gray-900 mb-6">Operational Health</h3>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Avg Latency</p>
                  <p className="text-2xl font-bold text-gray-900">42ms</p>
                  <div className="mt-2 flex items-center gap-1 text-green-500 text-xs font-bold">
                    <ArrowDownRight className="w-3 h-3" />
                    <span>8% vs last hour</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  <div className="mt-2 flex items-center gap-1 text-green-500 text-xs font-bold">
                    <Zap className="w-3 h-3" />
                    <span>Optimal</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Slow Queries</p>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                  <div className="mt-2 flex items-center gap-1 text-orange-500 text-xs font-bold">
                    <AlertCircle className="w-3 h-3" />
                    <span>Monitoring</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 font-medium mb-1">Memory Usage</p>
                  <p className="text-2xl font-bold text-gray-900">64%</p>
                  <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs font-bold">
                    <span>Stable</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-gradient-to-br from-[#1a0a2e] to-[#2d1b4e] rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h4 className="text-lg font-bold mb-2">Moderation Queue</h4>
                <p className="text-white/60 text-sm mb-6">You have 12 pending reports that require immediate attention.</p>
                <button className="px-6 py-2.5 bg-white text-[#1a0a2e] rounded-xl font-bold text-sm hover:shadow-xl transition-all">
                  Handle Reports
                </button>
             </div>
             
             <div className="bg-gradient-to-br from-[#FF006E] to-[#833AB4] rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-black/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h4 className="text-lg font-bold mb-2">User Growth</h4>
                <p className="text-white/80 text-sm mb-6">User acquisition is up 24% this week. View full conversion map.</p>
                <button className="px-6 py-2.5 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl font-bold text-sm hover:bg-white/30 transition-all">
                  Analyze Growth
                </button>
             </div>
          </div>
        </div>

        {/* Right Sidebar - Recent Critical Logs */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">Critical Events</h3>
                <span className="text-xs font-bold text-pink-500 cursor-pointer hover:underline">View All</span>
              </div>
              
              <div className="space-y-4 flex-1">
                {[
                  { time: '2m ago', type: 'error', msg: 'Post failed validation: #4321', icon: AlertCircle },
                  { time: '15m ago', type: 'warn', msg: 'High latency detected in US-EAST', icon: Activity },
                  { time: '45m ago', type: 'info', msg: 'Auto-scaling: New node added', icon: Zap },
                  { time: '1h ago', type: 'error', msg: 'DB connection timeout recovered', icon: Server },
                ].map((log, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      log.type === 'error' ? 'bg-red-50 text-red-500' : 
                      log.type === 'warn' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                    }`}>
                      <log.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">{log.time}</p>
                      <p className="text-sm font-semibold text-gray-700 line-clamp-1">{log.msg}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Load Avg</span>
                    <span className="text-xs font-bold text-green-500">Normal</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[45%]" />
                  </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;