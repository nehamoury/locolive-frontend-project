import { useState } from 'react';
import { Activity, Terminal, Download, Search, ArrowUpRight } from 'lucide-react';
import { useAdminLogs } from '../../hooks/useAdmin';
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';

export function ActivityPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [level, setLevel] = useState('all');
  
  const { data, isLoading } = useAdminLogs(page, pageSize, level);
  useAdminWebSocket(); // Maintain live connection

  const logs = data?.items || [];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Logs</h1>
          <p className="text-gray-500 mt-1">Audit trail and operational event history.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export Archive</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Streaming</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search events, users, or endpoints..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
           {['all', 'error', 'warn', 'info'].map((l) => (
             <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                level === l ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
              }`}
             >
               {l}
             </button>
           ))}
        </div>
      </div>

      {/* Log Terminal UI */}
      <div className="bg-[#0f1118] rounded-[32px] border border-gray-800 shadow-2xl overflow-hidden flex flex-col min-h-[60vh]">
         <div className="flex items-center gap-2 px-6 py-4 bg-[#1a1d27] border-b border-gray-800">
            <Terminal className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Kernel Output</span>
            <div className="flex gap-1.5 ml-auto">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
               <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
               <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
            </div>
         </div>
         
         <div className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-3 no-scrollbar">
            {isLoading ? (
               <div className="flex items-center gap-2 text-gray-500 animate-pulse">
                  <span className="text-pink-500">$</span>
                  <span>Fetching historical event sequence...</span>
               </div>
            ) : logs.length === 0 ? (
               <div className="p-20 text-center text-gray-600">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No log entries found for the selected criteria.</p>
               </div>
            ) : (
               logs.map((log, i) => {
                  const isError = log.level === 'error' || log.action_type?.includes('ban');
                  const isWarn = log.level === 'warn';
                  
                  return (
                    <div key={i} className="group flex gap-4 p-2 hover:bg-white/5 rounded-lg transition-colors border-l-2 border-transparent hover:border-pink-500">
                       <span className="text-gray-600 shrink-0 select-none">[{new Date(log.created_at).toLocaleTimeString([], { hour12: false })}]</span>
                       <span className={`shrink-0 font-black uppercase text-[10px] tracking-widest px-2 py-0.5 rounded ${
                         isError ? 'bg-red-500/10 text-red-500' :
                         isWarn ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                       }`}>
                         {log.level || (log.action_type?.includes('admin') ? 'ADMIN' : 'INFO')}
                       </span>
                       <div className="flex-1 min-w-0">
                          <span className="text-gray-300 font-bold mr-2">{log.action_type}:</span>
                          <span className="text-gray-400">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</span>
                       </div>
                       <ArrowUpRight className="w-4 h-4 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-white" />
                    </div>
                  );
               })
            )}
            <div className="flex items-center gap-2 text-pink-500 animate-pulse">
               <span>_</span>
            </div>
         </div>
         
         <div className="px-6 py-4 bg-[#1a1d27] border-t border-gray-800 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-500">SYSTEM: ONLINE | NODES: 04 | WORKERS: ACTIVE</p>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-gray-500">PAGE {page}</span>
               <button onClick={() => setPage(p => p + 1)} className="text-[10px] font-black text-white uppercase tracking-widest hover:text-pink-500 transition-colors">Load Next Sequence</button>
            </div>
         </div>
      </div>
    </div>
  );
}

export default ActivityPage;