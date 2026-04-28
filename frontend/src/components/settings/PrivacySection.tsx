import { useState, type FC, useEffect } from 'react';
import { Lock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { cn } from '../../utils/helpers';

const PrivacySection: FC = () => {
  const { user, updateUser } = useAuth();
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [isGhostMode, setIsGhostMode] = useState(user?.is_ghost_mode || false);
  const [panicMode, setPanicMode] = useState(user?.panic_mode || false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [whoCanMessage, setWhoCanMessage] = useState('connections');
  const [whoCanSeeStories, setWhoCanSeeStories] = useState('connections');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);

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

  const handleToggleGhostMode = async () => {
    setUpdatingPrivacy(true);
    try {
      const newGhost = !isGhostMode;
      await api.post('/users/ghost-mode', { enabled: newGhost, duration: 0 });
      setIsGhostMode(newGhost);
      updateUser({ is_ghost_mode: newGhost });
      import('react-hot-toast').then(({ toast }) => toast.success(newGhost ? 'Ghost Mode enabled! 👻' : 'Ghost Mode disabled'));
    } catch (err: any) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to update ghost mode'));
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleActivatePanicMode = async () => {
    setUpdatingPrivacy(true);
    try {
      await api.post('/users/panic');
      setPanicMode(true);
      updateUser({ panic_mode: true });
      import('react-hot-toast').then(({ toast }) => toast.success('Panic Mode Activated! Emergency protocols initiated.'));
      // The backend will force logout via WebSocket, so we don't need to do much else here.
    } catch (err: any) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to activate panic mode'));
    } finally {
      setUpdatingPrivacy(false);
      setShowPanicConfirm(false);
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
          <div className="bg-bg-card rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-8 space-y-8">
              {/* Private Account Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-text-base tracking-tight">Private Account</h4>
                    <p className="text-[13px] text-text-muted font-bold mt-0.5 max-w-[400px]">
                      Only people you approve can see your photos, videos and profile details.
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleTogglePrivacy}
                  disabled={updatingPrivacy}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                    isPrivate ? "bg-pink-500" : "bg-bg-base border-border-base"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-bg-card shadow ring-0 transition duration-200 ease-in-out",
                    isPrivate ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Ghost Mode Toggle */}
              <div className="flex items-center justify-between pt-8 border-t border-border-base/30">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M9 10H9.01M15 10H15.01M12 2C7.03 2 3 6.03 3 11V22L12 19L21 22V11C21 6.03 16.97 2 12 2Z" /></svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-text-base tracking-tight">Ghost Mode</h4>
                    <p className="text-[13px] text-text-muted font-bold mt-0.5 max-w-[400px]">
                      Your location will be hidden from everyone on the map until you turn it back on.
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={handleToggleGhostMode}
                  disabled={updatingPrivacy}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                    isGhostMode ? "bg-blue-500" : "bg-bg-base border-border-base"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-bg-card shadow ring-0 transition duration-200 ease-in-out",
                    isGhostMode ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Panic Mode Section */}
              <div className="flex items-center justify-between pt-8 border-t border-border-base/30">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01" /></svg>
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-red-600 tracking-tight">Panic Mode</h4>
                    <p className="text-[13px] text-text-muted font-bold mt-0.5 max-w-[400px]">
                      Immediate emergency invisibility. All traces of your existence will be scrubbed until you manually recover your account.
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowPanicConfirm(true)}
                  disabled={updatingPrivacy || panicMode}
                  className={cn(
                    "px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all",
                    panicMode ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200 active:scale-95"
                  )}
                >
                  {panicMode ? "Activated" : "Activate"}
                </button>
              </div>

              {showPanicConfirm && (
                <div className="p-6 bg-red-50 rounded-3xl border border-red-100 animate-in zoom-in-95 duration-200">
                  <h5 className="text-red-700 font-black text-[15px] mb-2">Are you absolutely sure?</h5>
                  <p className="text-red-600/70 text-[12px] font-bold mb-5 leading-relaxed">
                    This will immediately hide your profile, scrub your location, and terminate all active sessions. 
                    This action is designed for emergency situations.
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={handleActivatePanicMode}
                      className="px-6 py-2.5 bg-red-600 text-white text-[11px] font-black uppercase rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Yes, Scrub Everything
                    </button>
                    <button 
                      onClick={() => setShowPanicConfirm(false)}
                      className="px-6 py-2.5 bg-white text-gray-600 text-[11px] font-black uppercase rounded-xl border border-red-100 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-border-base/30 space-y-6">
                <h3 className="text-[14px] font-black uppercase tracking-widest text-text-muted/60">Interactions</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Mentions (Who can see your stories)</label>
                    <select 
                      value={whoCanSeeStories}
                      onChange={(e) => updatePrivacySetting('who_can_see_stories', e.target.value)}
                      className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="everyone" className="bg-bg-card">Everyone</option>
                      <option value="connections" className="bg-bg-card">Connections Only</option>
                      <option value="nobody" className="bg-bg-card">No One</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Messages</label>
                    <select 
                      value={whoCanMessage}
                      onChange={(e) => updatePrivacySetting('who_can_message', e.target.value)}
                      className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                    >
                      <option value="everyone" className="bg-bg-card">Everyone</option>
                      <option value="connections" className="bg-bg-card">Connections Only</option>
                      <option value="nobody" className="bg-bg-card">No One</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Users Section */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-text-muted/60 px-2">Blocked Accounts</h3>
            <div className="bg-bg-card rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
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
