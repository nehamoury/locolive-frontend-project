import { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserTable } from '../../components/admin/UserTable';
import { useAdminUsers, useBanUser } from '../../hooks/useAdmin';
import type { AdminUser } from '../../types/admin';

export function Users() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'banned'>('all');

  const { data, isLoading, isError } = useAdminUsers(page, pageSize);
  const banMutation = useBanUser();

  const handleBan = (user: AdminUser, ban: boolean) => {
    banMutation.mutate({ userId: user.id, ban });
  };

  const users = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'online') return matchesSearch && user.status === 'online';
    if (filter === 'offline') return matchesSearch && user.status === 'offline';
    if (filter === 'banned') return matchesSearch && user.is_banned;
    return matchesSearch;
  });

  if (isError) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Error loading users. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">View and manage system users</p>
        </div>
        <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-full text-gray-600">
          {total} Total Users
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-10 bg-gray-100 animate-pulse rounded-lg w-full"></div>
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-lg w-full"></div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No users found</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <>
          <UserTable
            users={filteredUsers}
            onBan={handleBan}
            onView={(user) => console.log('View user:', user)}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
              <span className="font-medium">{total}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                   // Simple pagination window
                   let pageNum = page;
                   if (totalPages <= 5) pageNum = i + 1;
                   else if (page <= 3) pageNum = i + 1;
                   else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                   else pageNum = page - 2 + i;

                   return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-pink-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                   );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Users;