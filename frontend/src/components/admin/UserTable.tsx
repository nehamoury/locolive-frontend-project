import { Eye, Ban, Trash2, Shield, MoreHorizontal, UserCheck, ShieldAlert } from 'lucide-react';
import type { AdminUser } from '../../types/admin';

interface UserTableProps {
  users: AdminUser[];
  isLoading?: boolean;
  onView?: (user: AdminUser) => void;
  onAction?: (userId: string, action: string) => void;
}

export function UserTable({ users, isLoading, onView, onAction }: UserTableProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-5 border-b border-gray-50 grid grid-cols-6 gap-4 items-center">
            <div className="flex items-center gap-3 col-span-1">
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded-full w-20 animate-pulse" />
                <div className="h-2 bg-gray-50 rounded-full w-12 animate-pulse" />
              </div>
            </div>
            <div className="h-6 bg-gray-100 rounded-full w-16 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-full w-24 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-full w-12 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded-full w-20 animate-pulse" />
            <div className="h-8 bg-gray-100 rounded-lg w-8 animate-pulse justify-self-end" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subscriber</th>
            <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Status</th>
            <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Communication</th>
            <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Authority</th>
            <th className="text-left px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Enrolled</th>
            <th className="text-right px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
              <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                          <span className="text-sm font-black text-white">{(user.full_name || user.username)[0]}</span>
                        </div>
                      )}
                    </div>
                    {user.status === 'online' && (
                       <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">{user.full_name || user.username}</p>
                    <p className="text-xs font-medium text-gray-400 mt-0.5">@{user.username}</p>
                  </div>
                </div>
              </td>
              
              <td className="px-6 py-5">
                {user.is_banned ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-red-100">
                    <Ban className="w-3 h-3" />
                    Banned
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100">
                    <UserCheck className="w-3 h-3" />
                    Active
                  </span>
                )}
              </td>
              
              <td className="px-6 py-5">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-700 truncate max-w-[150px]">{user.email || '—'}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Verified Device</p>
                </div>
              </td>
              
              <td className="px-6 py-5">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                  user.role === 'moderator' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {user.role}
                </div>
              </td>
              
              <td className="px-6 py-5">
                <p className="text-sm font-bold text-gray-700">{new Date(user.created_at).toLocaleDateString()}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </td>
              
              <td className="px-8 py-5">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView?.(user)}
                    className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <div className="relative group/menu">
                    <button className="w-9 h-9 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 overflow-hidden p-1.5">
                      <button
                        onClick={() => onAction?.(user.id, user.is_banned ? 'unban' : 'ban')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <Ban className={`w-4 h-4 ${user.is_banned ? 'text-green-500' : 'text-red-500'}`} />
                        {user.is_banned ? 'Unban Subscriber' : 'Ban Subscriber'}
                      </button>
                      
                      <button
                        onClick={() => onAction?.(user.id, 'revoke_sessions')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <Shield className="w-4 h-4 text-orange-500" />
                        Revoke All Sessions
                      </button>
                      
                      <div className="h-px bg-gray-50 my-1.5 mx-2" />
                      
                      <button
                        onClick={() => onAction?.(user.id, 'soft_delete')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Soft Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;