import { useState } from 'react';
import { Search, Check, X, Ban, User, Flag } from 'lucide-react';
import { useAdminReports, useResolveReport, useBanUser } from '../../hooks/useAdmin';

function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function Reports() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const resolvedParam = filter === 'all' ? undefined : filter === 'resolved';

  const { data, isLoading, isError } = useAdminReports(resolvedParam, page, pageSize);
  const resolveMutation = useResolveReport();
  const banMutation = useBanUser();

  const reports = (data?.items || []).filter(Boolean);
  const total = data?.total || 0;

  const filteredReports = reports.filter(report => {
    // Backend returns flat fields: reporter_username, target_username
    const reporterUsername = String(report.reporter_username || report.reporter?.username || 'Unknown');
    const targetUsername = String(report.target_username || report.reported?.username || 'Unknown');
    const reason = String(report.reason || '');
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = 
      reporterUsername.toLowerCase().includes(searchLower) ||
      targetUsername.toLowerCase().includes(searchLower) ||
      reason.toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  const handleResolve = (reportId: string) => {
    resolveMutation.mutate(reportId);
  };

  const handleIgnore = (reportId: string) => {
    resolveMutation.mutate(reportId); // For now, treat ignore as resolve on backend
  };

  const handleBan = (reportId: string, reportedUserId: string) => {
    banMutation.mutate({ userId: reportedUserId, ban: true });
    resolveMutation.mutate(reportId);
  };

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading reports. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Manage user reports and flagged content</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          {total} Total Reports
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as typeof filter);
              setPage(1); // Reset page on filter change
            }}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
           <div className="p-6 space-y-4">
             {Array(5).fill(0).map((_, i) => (
               <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg w-full"></div>
             ))}
           </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
             No reports found.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reporter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reported</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const reporterUsername = report.reporter_username || report.reporter?.username || 'Unknown';
                const targetUsername = report.target_username || report.reported?.username || 'Unknown';
                const targetId = report.target_id || report.reported?.id || '';
                const status = report.is_resolved ? 'resolved' : 'pending';
                const createdAt = report.created_at || report.createdAt || new Date().toISOString();
                
                return (
                <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900">{reporterUsername}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <Flag className="w-4 h-4 text-red-500" />
                      </div>
                      <span className="font-medium text-gray-900">{targetUsername}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                         {report.target_type || 'user'}
                       </span>
                       {report.priority_score > 1 && (
                         <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">
                           {report.priority_score}X
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[200px]" title={report.reason || ''}>{report.reason || ''}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatTime(createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={resolveMutation.isPending}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Resolve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBan(report.id, targetId)}
                            disabled={banMutation.isPending || resolveMutation.isPending}
                            className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Ban User & Resolve"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleIgnore(report.id)}
                            disabled={resolveMutation.isPending}
                            className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            title="Ignore"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Reports;