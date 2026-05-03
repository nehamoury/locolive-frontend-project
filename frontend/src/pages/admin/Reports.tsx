import { useState } from 'react';
import { Check, Ban, User, ShieldAlert, Eye } from 'lucide-react';
import { useAdminReports, useAdminUserAction } from '../../hooks/useAdmin';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

export function Reports() {
  const [page] = useState(1);
  const [pageSize] = useState(15);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const queryClient = useQueryClient();

  const resolvedParam = filter === 'all' ? undefined : filter === 'resolved';
  const { data, isLoading, isError } = useAdminReports(resolvedParam, page, pageSize);
  
  const resolveMutation = useMutation({
    mutationFn: (id: string) => adminApi.resolveReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success('Report resolved successfully');
    }
  });

  const userActionMutation = useAdminUserAction();

  const handleResolve = (id: string) => {
    resolveMutation.mutate(id);
  };

  const handleBanAndResolve = async (reportId: string, userId: string) => {
    if (window.confirm('Ban user and resolve this report?')) {
      await userActionMutation.mutateAsync({ userId, action: 'ban' });
      resolveMutation.mutate(reportId);
    }
  };

  const reports = data?.items || [];
  const total = data?.total || 0;

  if (isError) {
    return <div className="p-8 text-center text-red-500">Failed to load reports.</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Moderation Desk</h1>
          <p className="text-gray-500 mt-1">Review flagged content and maintain community safety.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setFilter('pending')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === 'pending' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            Queue
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === 'resolved' ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            Resolved
          </button>
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-900'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Open Reports</p>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-gray-900">{total}</h3>
              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">+12%</span>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Response Time</p>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-gray-900">14m</h3>
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold">-4m</span>
            </div>
         </div>
         <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Auto-Filtered</p>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-gray-900">84</h3>
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-bold">Stable</span>
            </div>
         </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
             <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Scanning Database...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Queue is Clear</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              All reported items have been handled. Great job keeping the community safe!
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reporter Info</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Flagged Entity</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Violation Reason</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Risk Score</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Incident Time</th>
                  <th className="text-right px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const reporterUsername = report.reporter_username || report.reporter?.username || 'Unknown';
                  const targetUsername = report.target_username || report.reported?.username || 'Unknown';
                  const targetId = report.target_id || report.reported?.id || '';
                  const riskLevel = report.priority_score > 5 ? 'critical' : report.priority_score > 2 ? 'high' : 'low';

                  return (
                    <tr key={report.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                              <User className="w-4 h-4" />
                           </div>
                           <span className="font-bold text-gray-900">@{reporterUsername}</span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                              <ShieldAlert className="w-4 h-4" />
                           </div>
                           <div>
                             <span className="font-bold text-gray-900">@{targetUsername}</span>
                             <p className="text-[10px] font-black text-pink-500 uppercase tracking-tighter">{report.target_type || 'user_profile'}</p>
                           </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-gray-700 line-clamp-1 max-w-[200px]" title={report.reason}>
                          {report.reason}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          riskLevel === 'critical' ? 'bg-red-500 text-white border-red-600' :
                          riskLevel === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {riskLevel}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-gray-700">
                          {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>

                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all">
                              <Eye className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => handleResolve(report.id)}
                            className="w-9 h-9 flex items-center justify-center bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all"
                           >
                              <Check className="w-4 h-4" />
                           </button>
                           <button 
                            onClick={() => handleBanAndResolve(report.id, targetId)}
                            className="w-9 h-9 flex items-center justify-center bg-red-600 text-white rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                           >
                              <Ban className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;