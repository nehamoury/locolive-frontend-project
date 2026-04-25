import { useState, type FC, useEffect } from 'react';
import { Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { cn } from '../../utils/helpers';

const PrivacySection: FC = () => {
  const { user, updateUser } = useAuth();
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [whoCanMessage, setWhoCanMessage] = useState('connections');
  const [whoCanSeeStories, setWhoCanSeeStories] = useState('connections');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    setLoadingPrivacy(true);
    try {
      const [privacyRes, blockedRes] = await Promise.all([
        api.get('/privacy'),
        api.get('/users/blocked')
      ]);
      setWhoCanMessage(privacyRes.data.who_can_message || 'connections');
      setWhoCanSeeStories(privacyRes.data.who_can_see_stories || 'connections');
      setBlockedUsers(blockedRes.data || []);
    } catch (err) {
      console.error('Failed to fetch privacy data', err);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const updatePrivacySetting = async (key: 'who_can_message' | 'who_can_see_stories', value: string) => {
    try {
      const payload = {
        who_can_message: key === 'who_can_message' ? value : whoCanMessage,
        who_can_see_stories: key === 'who_can_see_stories' ? value : whoCanSeeStories,
        show_location: true
      };
      await api.put('/privacy', payload);
      if (key === 'who_can_message') setWhoCanMessage(value);
      if (key === 'who_can_see_stories') setWhoCanSeeStories(value);
      import('react-hot-toast').then(({ toast }) => toast.success('Privacy updated!'));
    } catch (err) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to update privacy'));
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await api.delete(`/users/block/${blockedId}`);
      setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
      import('react-hot-toast').then(({ toast }) => toast.success('User unblocked!'));
    } catch (err) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to unblock'));
    }
  };

  const handleTogglePrivacy = async () => {
    setUpdatingPrivacy(true);
    try {
      const newPrivate = !isPrivate;
      const { data } = await api.patch('/user/privacy', { is_private: newPrivate });
      setIsPrivate(data.is_private);
      updateUser({ is_private: data.is_private });
      import('react-hot-toast').then(({ toast }) => toast.success(data.message || 'Privacy settings updated!'));
    } catch (err: any) {
      import('react-hot-toast').then(({ toast }) => toast.error(err.response?.data?.error || 'Failed to update privacy settings'));
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Privacy Settings</h2>
        <p className="text-[14px] text-text-muted font-bold">Control who can see your profile and content</p>
      </div>

      {loadingPrivacy ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-text-base tracking-tight">Private Account</h4>
                    <p className="text-[13px] text-text-muted font-bold mt-0.5 max-w-[400px]">
                      When your account is private, only people you approve can see your photos and videos.
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleTogglePrivacy}
                  disabled={updatingPrivacy}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                    isPrivate ? "bg-pink-500" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isPrivate ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              <div className="pt-6 border-t border-border-base/30 space-y-6">
                <h3 className="text-[14px] font-black uppercase tracking-widest text-text-muted/60">Interactions</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Mentions (Who can see your stories)</label>
                    <select 
                      value={whoCanSeeStories}
                      onChange={(e) => updatePrivacySetting('who_can_see_stories', e.target.value)}
                      className="w-full bg-[#fcf5f8] border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections Only</option>
                      <option value="nobody">No One</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Messages</label>
                    <select 
                      value={whoCanMessage}
                      onChange={(e) => updatePrivacySetting('who_can_message', e.target.value)}
                      className="w-full bg-[#fcf5f8] border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections Only</option>
                      <option value="nobody">No One</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Users Section */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-text-muted/60 px-2">Blocked Accounts</h3>
            <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
              {blockedUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[13px] text-text-muted font-bold">You haven't blocked anyone yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border-base/30">
                  {blockedUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <img src={getMediaUrl(u.avatar_url, FALLBACKS.AVATAR(u.username))} className="w-10 h-10 rounded-full object-cover" alt="" />
                        <div>
                          <h4 className="text-[14px] font-black text-text-base">{u.full_name}</h4>
                          <p className="text-[11px] text-text-muted font-bold">@{u.username}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleUnblock(u.id)}
                        className="px-4 py-2 bg-pink-50 text-pink-600 text-[11px] font-black uppercase rounded-xl hover:bg-pink-100 transition-colors cursor-pointer"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PrivacySection;
