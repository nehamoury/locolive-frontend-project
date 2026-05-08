import { useState, type FC, useEffect } from 'react';
import { Lock, ShieldAlert, Ghost, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { cn } from '../../utils/helpers';

interface BlockedUser {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  variant: 'purple' | 'blue' | 'red';
  isLoading?: boolean;
}

const ConfirmModal: FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText, variant, isLoading }) => {
  const colors = {
    purple: { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-100', soft: 'bg-purple-50' },
    blue: { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-100', soft: 'bg-blue-50' },
    red: { bg: 'bg-red-600', text: 'text-red-700', border: 'border-red-100', soft: 'bg-red-50' }
  }[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-bg-card rounded-[32px] overflow-hidden shadow-2xl border border-border-base/50"
          >
            <div className="p-8 text-center">
              <div className={cn("w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6", colors.soft)}>
                {variant === 'purple' && <Lock className="w-8 h-8 text-purple-600" />}
                {variant === 'blue' && <Ghost className="w-8 h-8 text-blue-600" />}
                {variant === 'red' && <ShieldAlert className="w-8 h-8 text-red-600" />}
              </div>
              <h3 className="text-xl font-black text-text-base mb-3">{title}</h3>
              <p className="text-[14px] text-text-muted font-bold leading-relaxed mb-8">
                {message}
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn("w-full py-4 rounded-2xl text-white text-[13px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg", colors.bg, isLoading && 'opacity-50')}
                >
                  {isLoading ? 'Processing...' : confirmText}
                </button>
                <button 
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl bg-bg-base text-text-muted text-[13px] font-black uppercase tracking-widest hover:bg-bg-sidebar transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-text-muted/40 hover:text-text-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PrivacySection: FC = () => {
  const { user, updateUser } = useAuth();
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [isGhostMode, setIsGhostMode] = useState(user?.is_ghost_mode || false);
  const [panicMode, setPanicMode] = useState(user?.panic_mode || false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [whoCanMessage, setWhoCanMessage] = useState('connections');
  const [whoCanSeeStories, setWhoCanSeeStories] = useState('connections');
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);
  
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [showPrivateConfirm, setShowPrivateConfirm] = useState(false);
  const [showGhostConfirm, setShowGhostConfirm] = useState(false);

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
    } catch {
      console.error('Failed to fetch privacy data');
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
    } catch {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to update privacy'));
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await api.delete(`/users/block/${blockedId}`);
      setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
      import('react-hot-toast').then(({ toast }) => toast.success('User unblocked!'));
    } catch {
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
    } catch {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to update privacy settings'));
    } finally {
      setUpdatingPrivacy(false);
      setShowPrivateConfirm(false);
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
    } catch {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to update ghost mode'));
    } finally {
      setUpdatingPrivacy(false);
      setShowGhostConfirm(false);
    }
  };

  const handleActivatePanicMode = async () => {
    setUpdatingPrivacy(true);
    try {
      await api.post('/users/panic');
      setPanicMode(true);
      updateUser({ panic_mode: true });
      import('react-hot-toast').then(({ toast }) => toast.success('Panic Mode Activated! Emergency protocols initiated.'));
    } catch {
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
            <div className="p-5 md:p-8 space-y-8">
              {/* Private Account Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-text-base tracking-tight leading-none mb-1">Private Account</h4>
                    <p className="text-[13px] text-text-muted font-bold leading-tight">
                      Only people you approve can see your profile.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end sm:justify-start">
                  <button 
                    onClick={() => setShowPrivateConfirm(true)}
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
              </div>

              {/* Ghost Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-border-base/30">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                    <Ghost className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-text-base tracking-tight leading-none mb-1">Ghost Mode</h4>
                    <p className="text-[13px] text-text-muted font-bold leading-tight">
                      Hide your location from everyone on the map.
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end sm:justify-start">
                  <button 
                    onClick={() => setShowGhostConfirm(true)}
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
              </div>

              {/* Panic Mode Section */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-border-base/30">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shadow-sm shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-[16px] font-black text-red-600 tracking-tight leading-none mb-1">Panic Mode</h4>
                    <p className="text-[13px] text-text-muted font-bold leading-tight">
                      Immediate emergency invisibility. 
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end sm:justify-start">
                  <button 
                    onClick={() => setShowPanicConfirm(true)}
                    disabled={updatingPrivacy || panicMode}
                    className={cn(
                      "px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all w-full sm:w-auto",
                      panicMode ? "bg-bg-base text-text-muted/40 cursor-not-allowed border border-border-base" : "bg-red-500 text-white hover:bg-red-600 shadow-md active:scale-95"
                    )}
                  >
                    {panicMode ? "Activated" : "Activate"}
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-border-base/30 space-y-6">
                <h3 className="text-[14px] font-black uppercase tracking-widest text-text-muted/60">Interactions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Mentions</label>
                    <select 
                      value={whoCanSeeStories}
                      onChange={(e) => updatePrivacySetting('who_can_see_stories', e.target.value)}
                      className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-[13px] font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections</option>
                      <option value="nobody">No One</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Messages</label>
                    <select 
                      value={whoCanMessage}
                      onChange={(e) => updatePrivacySetting('who_can_message', e.target.value)}
                      className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-[13px] font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer shadow-inner"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections</option>
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

      {/* Confirmation Modals */}
      <ConfirmModal 
        isOpen={showPrivateConfirm}
        onClose={() => setShowPrivateConfirm(false)}
        onConfirm={handleTogglePrivacy}
        isLoading={updatingPrivacy}
        title="Account Privacy"
        message={isPrivate 
          ? "Switching to Public will allow anyone to see your profile and content." 
          : "Switching to Private means only people you approve can see your posts."}
        confirmText={isPrivate ? "Make Public" : "Make Private"}
        variant="purple"
      />

      <ConfirmModal 
        isOpen={showGhostConfirm}
        onClose={() => setShowGhostConfirm(false)}
        onConfirm={handleToggleGhostMode}
        isLoading={updatingPrivacy}
        title="Ghost Mode"
        message={isGhostMode 
          ? "Your location will become visible to your connections again." 
          : "Your location will be hidden from everyone on the map."}
        confirmText={isGhostMode ? "Disable Ghost" : "Enable Ghost"}
        variant="blue"
      />

      <ConfirmModal 
        isOpen={showPanicConfirm}
        onClose={() => setShowPanicConfirm(false)}
        onConfirm={handleActivatePanicMode}
        isLoading={updatingPrivacy}
        title="Panic Mode"
        message="This will immediately hide your profile and scrub your location. Are you absolutely sure?"
        confirmText="Yes, Scrub Everything"
        variant="red"
      />
    </div>
  );
};

export default PrivacySection;
