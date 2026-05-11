import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, UserPlus, Download } from 'lucide-react';
import { UserTable } from '../../components/admin/UserTable';
import { useAdminUsers, useAdminUserAction } from '../../hooks/useAdmin';
import { useDebounce } from '../../hooks/useDebounce';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';

export function Users() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const { data, isLoading, isError } = useAdminUsers(page, pageSize);
  const actionMutation = useAdminUserAction();

  const handleAction = async (userId: string, action: string) => {
    if (!window.confirm(`Are you sure you want to perform ${action} on this user?`)) return;

    try {
      await actionMutation.mutateAsync({ userId, action });
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Action failed';
      alert(`Failed to ${action}: ${message}`);
    }
  };

  const users = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Client-side search for MVP if backend doesn't support it well yet
  // In a real app, this should be handled by the backend
  const displayUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    return users.filter(u => 
      u.username.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [users, debouncedSearch]);

  if (isError) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 max-w-md mx-auto">
          <p className="text-red-600 font-bold">Failed to connect to User Service</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-600/20"
          >
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1">Monitor, moderate and manage all platform participants.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10">
            <UserPlus className="w-4 h-4" />
            <span>Add Internal Admin</span>
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-pink-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by username, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
             <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <select className="pl-10 pr-8 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all appearance-none cursor-pointer shadow-sm">
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="banned">Banned</option>
                <option value="moderator">Staff / Admins</option>
             </select>
          </div>
          
          <div className="h-10 w-px bg-gray-100 mx-2 hidden lg:block" />
          
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
             <button className="px-4 py-2 bg-white rounded-lg text-xs font-black shadow-sm uppercase tracking-wider text-gray-900">List</button>
             <button className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900">Grid</button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/20 overflow-hidden relative">
        <UserTable
          users={displayUsers}
          isLoading={isLoading}
          onAction={handleAction}
          onView={(user) => setSelectedUser(user)}
        />
        
        {/* Empty State */}
        {!isLoading && displayUsers.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No matches found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              We couldn't find any users matching "{searchQuery}". Try a different term.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Container */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8">
        <p className="text-sm font-medium text-gray-400">
          Showing <span className="text-gray-900 font-bold">{(page - 1) * pageSize + 1}</span> - <span className="text-gray-900 font-bold">{Math.min(page * pageSize, total)}</span> of <span className="text-gray-900 font-bold">{total}</span> users
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
               let pageNum = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
               if (pageNum <= 0 || pageNum > totalPages) return null;
               
               return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-12 h-12 rounded-2xl text-sm font-black transition-all ${
                    page === pageNum
                      ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                      : 'bg-white border border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  {pageNum}
                </button>
               );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
            className="w-12 h-12 flex items-center justify-center bg-white border border-gray-200 rounded-2xl disabled:opacity-30 hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onAction={handleAction}
        />
      )}
    </div>
  );
}

export default Users;