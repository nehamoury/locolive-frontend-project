import { useState } from 'react';
import { Shield, Plus, MoreVertical, Loader2, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../services/adminApi';
import { toast } from 'react-hot-toast';

interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
}

export function Admins() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => adminApi.getAdmins(),
  });

  const createMutation = useMutation({
    mutationFn: (params: { username: string; email: string; password: string; role: 'admin' | 'moderator' }) => 
      adminApi.createAdmin(params),
    onSuccess: () => {
      toast.success('Admin user created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error('Failed to create admin user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => 
      adminApi.updateAdmin(id, role),
    onSuccess: () => {
      toast.success('Admin role updated!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
      setShowRoleMenu(null);
    },
    onError: () => {
      toast.error('Failed to update admin role');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteAdmin(id),
    onSuccess: () => {
      toast.success('Admin removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    },
    onError: () => {
      toast.error('Failed to remove admin');
    },
  });

  const admins: AdminUser[] = data?.items || [];

  const handleCreateAdmin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as 'admin' | 'moderator',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF006E] to-[#833AB4] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Admin</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No admin users found
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{admin.full_name || admin.username}</p>
                        <p className="text-sm text-gray-500">@{admin.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setShowRoleMenu(showRoleMenu === admin.id ? null : admin.id)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          admin.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {admin.role.replace('_', ' ')}
                      </button>
                      {showRoleMenu === admin.id && (
                        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <button
                            onClick={() => updateMutation.mutate({ id: admin.id, role: 'admin' })}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Admin
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: admin.id, role: 'moderator' })}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                          >
                            Moderator
                          </button>
                          <button
                            onClick={() => updateMutation.mutate({ id: admin.id, role: 'user' })}
                            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600"
                          >
                            Remove Admin
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-600">{admin.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button 
                        onClick={() => setSelectedAdmin(admin)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      {selectedAdmin?.id === admin.id && (
                        <div className="absolute right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                          <button
                            onClick={() => {
                              deleteMutation.mutate(admin.id);
                              setSelectedAdmin(null);
                            }}
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                          >
                            Remove Admin Access
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Admin</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  minLength={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
                  placeholder="admin_username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
                  placeholder="admin@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  name="role"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
                >
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF006E] to-[#833AB4] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Create Admin'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admins;
