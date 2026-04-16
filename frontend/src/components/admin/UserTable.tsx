import { useState } from 'react';
import { MoreVertical, Eye, Ban, Trash2 } from 'lucide-react';
import type { AdminUser } from '../../types/admin';

interface UserTableProps {
  users: AdminUser[];
  onView?: (user: AdminUser) => void;
  onBan?: (user: AdminUser, ban: boolean) => void;
}

export function UserTable({ users, onView, onBan }: UserTableProps) {

  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Connections</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Crossings</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{(user.full_name || user.username)[0]}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name || user.username}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.status === 'online'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {user.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium uppercase">
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView?.(user)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4 text-gray-600" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>
                    {activeMenu === user.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          onClick={() => {
                            onBan?.(user, !user.is_banned);
                            setActiveMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {user.is_banned ? (
                            <>
                              <Ban className="w-4 h-4" />
                              Unban User
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4" />
                              Ban User
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setActiveMenu(null)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete User
                        </button>
                      </div>
                    )}
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