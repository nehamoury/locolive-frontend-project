import { useState, useEffect } from 'react';
import { Activity, Server, Zap, Database, Shield, Globe, Cpu, AlertCircle, Clock } from 'lucide-react';
import { useAdminSystemMonitor } from '../../hooks/useAdmin';

export function Settings() {
  const { data: monitor } = useAdminSystemMonitor();
  const [uptime, setUptime] = useState('0d 0h 0m 0s');

  useEffect(() => {
    const start = new Date('2026-05-01T00:00:00Z').getTime(); // Example start date
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - start;
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setUptime(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { label: 'Avg Latency', value: monitor?.avgLatency || '42ms', icon: Clock, color: 'green' },
    { label: 'Error Rate', value: monitor?.errorRate || '0.04%', icon: AlertCircle, color: 'red' },
    { label: 'DB Connections', value: monitor?.dbConnections || '12', icon: Database, color: 'blue' },
    { label: 'Active Nodes', value: '4', icon: Server, color: 'purple' },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Monitor</h1>
          <p className="text-gray-500 mt-1">Infrastructure health and operational telemetry.</p>
        </div>
        
        <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Uptime</span>
              <span className="text-sm font-black text-gray-900 font-mono">{uptime}</span>
           </div>
           <div className="h-8 w-px bg-gray-100" />
           <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Healthy
           </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
               m.color === 'green' ? 'bg-green-50 text-green-600' :
               m.color === 'red' ? 'bg-red-50 text-red-600' :
               m.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
             }`}>
                <m.icon className="w-6 h-6" />
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
             <h3 className="text-3xl font-black text-gray-900">{m.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Services Status */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                 <Shield className="w-6 h-6 text-pink-500" />
                 Core Infrastructure Status
              </h3>
              
              <div className="space-y-6">
                {[
                  { name: 'API Gateway', status: 'Online', load: 14, icon: Globe },
                  { name: 'User Service', status: 'Online', load: 32, icon: Shield },
                  { name: 'Content Pipeline', status: 'Optimal', load: 8, icon: Activity },
                  { name: 'PostgreSQL Cluster', status: 'Healthy', load: 45, icon: Database },
                  { name: 'Redis Cache', status: 'Online', load: 12, icon: Zap },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                       <s.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{s.name}</p>
                       <p className="text-xs font-bold text-gray-400">{s.status}</p>
                    </div>
                    <div className="w-32 hidden sm:block">
                       <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Load</span>
                          <span className="text-[10px] font-black text-gray-900">{s.load}%</span>
                       </div>
                       <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.load > 70 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${s.load}%` }} />
                       </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Global Traffic */}
        <div className="space-y-6">
           <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                 <Globe className="w-6 h-6 text-blue-500" />
                 Network Density
              </h3>
              
              <div className="space-y-4">
                 {[
                   { region: 'US East (N. Virginia)', req: '1.2k/s', status: 'active' },
                   { region: 'EU West (Ireland)', req: '840/s', status: 'active' },
                   { region: 'AP South (Mumbai)', req: '420/s', status: 'active' },
                   { region: 'SA East (São Paulo)', req: '120/s', status: 'standby' },
                 ].map((r, i) => (
                   <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                         <span className="text-xs font-black text-gray-900 uppercase tracking-tighter">{r.region}</span>
                         <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.req} current throughput</p>
                   </div>
                 ))}
              </div>
              
              <div className="mt-8 p-6 bg-gray-900 rounded-3xl text-white relative overflow-hidden">
                 <Cpu className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5" />
                 <h4 className="text-sm font-black uppercase tracking-widest mb-4">Compute Engine</h4>
                 <div className="space-y-4">
                    <div>
                       <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                          <span>CPU Cluster 01</span>
                          <span>24%</span>
                       </div>
                       <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                          <div className="bg-pink-500 h-full w-[24%]" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                          <span>Memory Allocation</span>
                          <span>68%</span>
                       </div>
                       <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full w-[68%]" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
