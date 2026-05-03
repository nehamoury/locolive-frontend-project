import { X, Ban, Activity, Film, Flag, Calendar, Mail, Phone, Smartphone, LogOut, Trash2 } from 'lucide-react';
import { useAdminUserDetail } from '../../hooks/useAdmin';

interface UserDetailsModalProps {
  user: any;
  onClose: () => void;
  onAction: (userId: string, action: string) => void;
}

export function UserDetailsModal({ user: basicInfo, onClose, onAction }: UserDetailsModalProps) {
  const { data: detail } = useAdminUserDetail(basicInfo.id);

  const stats = [
    { label: 'Total Posts', value: detail?.postCount || 0, icon: Activity },
    { label: 'Total Reels', value: detail?.reelCount || 0, icon: Film },
    { label: 'Reports', value: detail?.reportCount || 0, icon: Flag },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
        {/* Header/Banner */}
        <div className="h-32 bg-gradient-to-r from-[#1a0a2e] to-[#2d1b4e] relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-10 pb-10 relative">
          {/* Avatar Overlay */}
          <div className="absolute -top-12 left-10">
            <div className="w-24 h-24 rounded-3xl border-4 border-white overflow-hidden shadow-xl bg-gray-100">
               {basicInfo.avatar_url ? (
                 <img src={basicInfo.avatar_url} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-900">
                   <span className="text-2xl font-black text-white">{(basicInfo.full_name || basicInfo.username)[0]}</span>
                 </div>
               )}
            </div>
          </div>

          <div className="pt-16 flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">{basicInfo.full_name || basicInfo.username}</h2>
              <p className="text-gray-400 font-bold tracking-tight">@{basicInfo.username}</p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  basicInfo.is_banned ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'
                }`}>
                  {basicInfo.is_banned ? 'Account Banned' : 'Account Active'}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-gray-200">
                  {basicInfo.role}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
               <button 
                onClick={() => onAction(basicInfo.id, basicInfo.is_banned ? 'unban' : 'ban')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  basicInfo.is_banned ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                }`}
               >
                 <Ban className="w-4 h-4" />
                 {basicInfo.is_banned ? 'Unban User' : 'Ban User'}
               </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-gray-50/50 rounded-3xl p-4 border border-gray-100">
                <stat.icon className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-xl font-black text-gray-900">{stat.value}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Info Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="space-y-6">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Contact Information</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{basicInfo.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{basicInfo.phone || 'No phone linked'}</span>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Session Details</h3>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-gray-700">
                      Joined {new Date(basicInfo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="text-sm font-bold text-gray-700">
                      {detail?.deviceInfo || 'Unknown Device'}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Destructive Actions */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4">
             <button 
              onClick={() => onAction(basicInfo.id, 'revoke_sessions')}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-orange-200 text-orange-600 rounded-2xl text-sm font-black hover:bg-orange-50 transition-all"
             >
                <LogOut className="w-4 h-4" />
                Revoke All Sessions
             </button>
             
             <button 
              onClick={() => onAction(basicInfo.id, 'soft_delete')}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-black hover:bg-red-100 transition-all ml-auto"
             >
                <Trash2 className="w-4 h-4" />
                Soft Delete Account
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
