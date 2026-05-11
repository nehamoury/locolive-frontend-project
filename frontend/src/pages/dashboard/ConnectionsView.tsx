import { useState, useEffect, type FC } from 'react';
import {
  X,
  Users,
  MessageSquare,
  MapPin,
  Loader2,
  Sparkles,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import {
  useUserProfile,
  useUserFollowers,
  useUserFollowing,
  usePrivacyCheck,
  type UserConnection,
} from '../../hooks/useUserData';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ConnectionsViewProps {
  initialTab?: 'followers' | 'following';
  onUserSelect?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

// --- TanStack Query hooks for this component ---
const useSentRequests = () => {
  return useQuery({
    queryKey: ['connections', 'sent'],
    queryFn: async () => {
      const { data } = await api.get('/connections/sent');
      return data as UserConnection[];
    },
    staleTime: 30000,
  });
};

const useSuggestions = () => {
  return useQuery({
    queryKey: ['connections', 'suggested'],
    queryFn: async () => {
      const { data } = await api.get('/connections/suggested');
      const dismissed = JSON.parse(localStorage.getItem('locolive_dismissed_users') || '[]');
      const dismissedSet = new Set(dismissed);
      return (data || []).filter((u: any) => !dismissedSet.has(u.id));
    },
    staleTime: 60000,
  });
};

const ConnectionsView: FC<ConnectionsViewProps> = ({ initialTab = 'followers', onUserSelect, onMessage }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'followers' | 'following' | null;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(tabParam || initialTab);
  const [removeConfirm, setRemoveConfirm] = useState<{ id: string; isPending: boolean } | null>(null);
  const targetUserId = searchParams.get('userId') || searchParams.get('u');

  // --- CORE RULE: Always distinguish viewer vs target ---
  // viewerId = current user (from auth)
  // targetUserId = user whose profile is being viewed (from route)
  const isViewingSelf = !targetUserId;

  // --- TanStack Query: Target User Profile ---
  const {
    data: targetProfile,
    isLoading: profileLoading,
  } = useUserProfile(targetUserId);

  // --- Privacy Check ---
  const { isAllowed } = usePrivacyCheck(targetProfile || null);

  // --- TanStack Query: Connections Data (with proper userId) ---
  const {
    data: followersData,
    isLoading: followersLoading,
  } = useUserFollowers(targetUserId || (isViewingSelf ? 'me' : null), isViewingSelf);

  const {
    data: followingData,
    isLoading: followingLoading,
  } = useUserFollowing(targetUserId || (isViewingSelf ? 'me' : null), isViewingSelf);

  // --- TanStack Query: Current User Data ---
  const { data: sentRequests, refetch: refetchSent } = useSentRequests();
  const { data: suggestions } = useSuggestions();

  // --- Current User Followers/Following for counts ---
  const { data: myFollowers } = useUserFollowers('me', true);
  const { data: myFollowing } = useUserFollowing('me', true);

  // --- Derived State ---
  // Ensure data is always an array (API might return object or undefined)
  const rawConnections = activeTab === 'followers' ? followersData : followingData;
  const connections: UserConnection[] = Array.isArray(rawConnections) ? rawConnections : [];

  const loading = profileLoading || followersLoading || followingLoading;

  // Privacy restricted if viewing another user and not allowed
  const privacyRestricted = !!targetUserId && !isAllowed && !profileLoading;

  // Counts for display - use normalized connections array
  const followersCount = isViewingSelf
    ? (Array.isArray(myFollowers) ? myFollowers.length : 0)
    : (activeTab === 'followers' ? connections.length : (Array.isArray(followersData) ? followersData.length : 0));
  
  const followingCount = isViewingSelf
    ? (Array.isArray(myFollowing) ? myFollowing.length : 0) + (Array.isArray(sentRequests) ? sentRequests.length : 0)
    : (activeTab === 'following' ? connections.length : (Array.isArray(followingData) ? followingData.length : 0));

  // --- Update tab from URL ---
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // --- Handle Connection Actions ---
  const handleRequest = async (userId: string, action: 'send' | 'accept' | 'decline' | 'remove') => {
    try {
      if (action === 'send') {
        await api.post('/connections/request', { target_user_id: userId });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['connections', 'suggested'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'followers', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'following', 'me'] });
      } else if (action === 'accept') {
        await api.post('/connections/update', { requester_id: userId, status: 'accepted' });
        queryClient.invalidateQueries({ queryKey: ['users', 'followers'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'following'] });
      } else if (action === 'decline') {
        await api.post('/connections/update', { requester_id: userId, status: 'blocked' });
        queryClient.invalidateQueries({ queryKey: ['users', 'followers'] });
      } else if (action === 'remove') {
        const isPending = sentRequests?.some((r: any) => (r.target_id === userId || r.id === userId));
        setRemoveConfirm({ id: userId, isPending: !!isPending });
        return;
      }
      // Dispatch event to refresh profile data across the app
      window.dispatchEvent(new Event('connectionsUpdated'));
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    }
  };

  const confirmRemove = async () => {
    if (!removeConfirm) return;
    const { id } = removeConfirm;
    try {
      await api.delete(`/connections/${id}`);
      queryClient.invalidateQueries({ queryKey: ['users', 'followers'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'following'] });
      refetchSent();
      window.dispatchEvent(new Event('connectionsUpdated'));
    } catch (err) {
      console.error('Failed to remove connection:', err);
    } finally {
      setRemoveConfirm(null);
    }
  };

  // --- Privacy Block View ---
  if (privacyRestricted && targetProfile) {
    return (
      <div className="h-full bg-bg-base overflow-y-auto no-scrollbar pb-24 md:pb-8 px-6 pt-10 font-poppins w-full selection:bg-primary/10">
        <div className="w-full h-fit max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col mb-10">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight text-text-base flex items-center gap-3">
                Connections
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </h1>
            </div>
          </div>

          {/* Privacy Block */}
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-bg-card/50 rounded-[32px] border border-dashed border-border-base">
            <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-text-muted/40" />
            </div>
            <h3 className="text-lg font-black text-text-base mb-2">Private Account</h3>
            <p className="text-sm text-text-muted max-w-[260px]">
              🔒 This account is private. Follow @{targetProfile.username} to see their connections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-bg-base overflow-y-auto no-scrollbar pb-24 md:pb-8 px-6 pt-10 font-poppins w-full selection:bg-primary/10">
      <div className="w-full h-fit max-w-6xl mx-auto">

        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col mb-10">
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => navigate(-1)}
              className="md:hidden p-2 -ml-2 hover:bg-bg-card rounded-full transition-colors text-text-muted"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>
            <h1 className="text-4xl font-black tracking-tight text-text-base flex items-center gap-3">
              Connections
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="w-7 h-7 text-primary" />
              </div>
            </h1>
          </div>
          <p className="text-[14px] font-medium text-text-muted max-w-lg">
            Manage your network and discover new friends near you
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8 p-1 bg-bg-card/50 rounded-2xl md:bg-transparent md:p-0 md:gap-4">
          <ModernTab
            label="Followers"
            icon={<Users className="w-4 h-4" />}
            count={followersCount}
            active={activeTab === 'followers'}
            onClick={() => setActiveTab('followers')}
          />
          <ModernTab
            label="Following"
            icon={<Users className="w-4 h-4" />}
            count={followingCount}
            active={activeTab === 'following'}
            onClick={() => setActiveTab('following')}
          />
        </div>

        {/* ── Content Sections ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-12">

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 m-auto">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                </div>
                <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-primary animate-spin" />
              </div>
              <p className="text-xs font-black text-text-muted/40 uppercase tracking-widest">Updating Network...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full flex flex-col gap-12"
              >


                {/* FOLLOWERS / FOLLOWING VIEW */}
                {(activeTab === 'followers' || activeTab === 'following') && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[17px] md:text-xl font-black text-text-base tracking-tight">
                        {targetUserId ? (activeTab === 'followers' ? `${targetProfile?.username}'s Followers` : `${targetProfile?.username}'s Following`) : (activeTab === 'followers' ? 'Followers' : 'Following')}
                        <span className="ml-2 text-primary/40 font-medium">({activeTab === 'followers' ? followersCount : followingCount})</span>
                      </h2>
                    </div>

                    {privacyRestricted ? (
                      <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-bg-card/50 rounded-[32px] border border-dashed border-border-base">
                        <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center mb-4">
                          <X className="w-8 h-8 text-text-muted/40" />
                        </div>
                        <h3 className="text-lg font-black text-text-base mb-2">Private Account</h3>
                        <p className="text-sm text-text-muted max-w-[260px]">
                          You must follow @{targetProfile?.username || 'this user'} to see their connections.
                        </p>
                      </div>
                    ) : connections.length === 0 && (!sentRequests || sentRequests.length === 0) ? (
                      <EmptyState activeTab={activeTab} isSelf={isViewingSelf} />
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Show Connected Users */}
                        {connections.map((user, idx) => (
                          <FollowingCard
                            key={`connection-${user.id || user.username || idx}`}
                            user={user}
                            showActions={isViewingSelf}
                            onMessage={() => onMessage?.(user.id)}
                            onRemove={() => handleRequest(user.id, 'remove')}
                            onFollow={() => handleRequest(user.id, 'send')}
                            onView={() => onUserSelect?.(user.id)}
                          />
                        ))}
                        {/* Show Pending Sent Requests in Following Tab */}
                        {activeTab === 'following' && sentRequests?.map((req: any, idx: number) => (
                          <FollowingCard
                            key={`sent-${req.target_id || idx}`}
                            user={{
                              id: req.target_id || req.id,
                              username: req.username,
                              full_name: req.full_name,
                              avatar_url: req.avatar_url,
                              last_active_at: null,
                              status: 'pending'
                            }}
                            showActions={isViewingSelf}
                            onRemove={() => handleRequest(req.target_id || req.id, 'remove')}
                            onView={() => onUserSelect?.(req.target_id || req.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── Suggested Section (Always visible at bottom) ── */}
          <section className="mt-10 pt-10 border-t border-border-base">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <h2 className="text-xl font-black text-text-base tracking-tight">People you may know</h2>
              </div>
            </div>
            {(!suggestions || suggestions.length === 0) ? (
              <div className="bg-bg-card p-10 rounded-[32px] border border-dashed border-border-base text-center">
                <p className="text-text-muted font-medium">Looking for more people nearby...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((user: any) => (
                  <SuggestionCard 
                    key={`suggest-${user.id}`} 
                    user={user} 
                    onConnect={() => handleRequest(user.id, 'send')}
                    onDismiss={() => {
                      const dismissed = JSON.parse(localStorage.getItem('locolive_dismissed_users') || '[]');
                      dismissed.push(user.id);
                      localStorage.setItem('locolive_dismissed_users', JSON.stringify(dismissed));
                      queryClient.invalidateQueries({ queryKey: ['connections', 'suggested'] });
                      // Also broadcast to explore hook if active
                      window.dispatchEvent(new CustomEvent('dismiss_suggestion', { detail: user.id }));
                    }}
                    onView={() => onUserSelect?.(user.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={confirmRemove}
        title={removeConfirm?.isPending ? "Cancel Request" : "Remove Connection"}
        message={removeConfirm?.isPending ? "Are you sure you want to cancel this follow request?" : "Are you sure you want to remove this person from your following?"}
        confirmText={removeConfirm?.isPending ? "Cancel Request" : "Remove"}
        type="danger"
      />
    </div>
  );
};

// ─── Components ────────────────────────────────────────────────────────────────

const ModernTab = ({ label, icon, count, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 md:gap-3 py-2.5 md:py-3.5 px-3 md:px-8 rounded-xl md:rounded-2xl transition-all duration-300 relative cursor-pointer border
      ${active
        ? 'bg-gradient-to-r from-[#FF3B8E] to-[#A855F7] text-white shadow-lg md:shadow-xl shadow-pink-500/20 border-transparent scale-[1.02] md:scale-105 z-10'
        : 'bg-bg-card md:bg-bg-card text-text-muted border-border-base md:border-border-base hover:border-pink-200 hover:text-pink-500'
      }`}
  >
    <span className={`${active ? 'text-white' : 'text-inherit'} hidden sm:inline`}>{icon}</span>
    <span className="text-[12px] md:text-[13px] font-black tracking-tight">{label}</span>
    {(count !== undefined) && (
      <span className={`min-w-[18px] md:min-w-[20px] h-4 md:h-5 flex items-center justify-center px-1.5 rounded-lg text-[9px] md:text-[10px] font-black ${active ? 'bg-white text-primary' : 'bg-primary/10 text-primary'}`}>
        {count}
      </span>
    )}
  </button>
);


const SuggestionCard = ({ user, onConnect, onDismiss, onView }: any) => {
  const distance = user.distance_km ? `${user.distance_km.toFixed(1)} km away` : '0.5 km away';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      className="bg-bg-card/70 backdrop-blur-md p-6 rounded-[32px] border border-border-base/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 flex flex-col group relative transition-all duration-300"
    >
      {/* Dismiss Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-bg-base/50 text-text-muted hover:bg-red-500/10 hover:text-red-500 rounded-full transition-all z-10 opacity-0 group-hover:opacity-100 backdrop-blur-sm"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center text-center">
        <div className="relative mb-5 cursor-pointer" onClick={onView}>
          <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#FF3B8E] via-[#A855F7] to-[#3B82F6]">
            <div className="w-full h-full rounded-full bg-bg-card p-1">
              <img
                src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))}
                className="w-full h-full rounded-full object-cover shadow-inner"
                alt=""
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 mb-6 cursor-pointer" onClick={onView}>
          <h3 className="font-black text-text-base text-[16px] tracking-tight truncate px-2">@{user.username}</h3>
          <div className="flex items-center gap-1 text-[11px] font-bold text-text-muted/60 uppercase tracking-widest">
            <MapPin className="w-3 h-3" />
            <span>{distance}</span>
          </div>
        </div>

        <div className="w-full mt-auto">
          {user.requested ? (
            <button disabled className="w-full bg-bg-base text-text-muted/40 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest border border-border-base cursor-not-allowed">
              Sent
            </button>
          ) : (
            <button
              onClick={onConnect}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


const FollowingCard = ({ user, onMessage, onRemove, onFollow, onView, showActions }: any) => {
  const isPending = user.status === 'pending';

  return (
    <motion.div
      whileHover={{ y: -2, x: 2 }}
      className={`bg-bg-card/80 backdrop-blur-sm p-2.5 md:p-3 rounded-[20px] border border-border-base shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between group ${isPending ? 'bg-bg-base/40 border-dashed opacity-80' : ''}`}
    >
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden pr-2 flex-1">
        <div className="relative cursor-pointer group/avatar" onClick={onView}>
          <div className={`w-11 h-11 md:w-13 md:h-13 rounded-full p-[1.5px] transition-all duration-500 ${isPending ? 'bg-border-base' : 'bg-gradient-to-tr from-primary to-accent group-hover/avatar:rotate-12'}`}>
            <div className="w-full h-full rounded-full bg-bg-card p-0.5">
              <img 
                src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} 
                className="w-full h-full rounded-full object-cover" 
                alt="" 
              />
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
          <div className="flex flex-col">
            <h4 className="font-black text-text-base text-[13.5px] md:text-[15px] tracking-tight truncate">@{user.username}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-[8.5px] font-bold uppercase tracking-tight ${
                isPending 
                  ? 'text-amber-500/70' 
                  : user.is_mutual 
                    ? 'text-emerald-500' 
                    : user.requested
                      ? 'text-amber-500'
                      : user.follows_you 
                        ? 'text-primary' 
                        : 'text-text-muted/60'
              }`}>
                {isPending 
                  ? 'Request Pending' 
                  : user.is_mutual 
                    ? 'Connected' 
                    : user.requested
                      ? 'Requested'
                      : user.follows_you 
                        ? 'Follows You' 
                        : 'Following'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {showActions && !isPending && !user.you_follow && (
          <button
            onClick={onFollow}
            disabled={user.requested}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all
              ${user.requested 
                ? 'bg-bg-sidebar text-text-muted cursor-not-allowed border border-border-base' 
                : 'bg-primary text-white hover:shadow-lg'}`}
          >
            {user.requested ? 'Requested' : 'Follow Back'}
          </button>
        )}
        {showActions && !isPending && (
          <button
            onClick={onMessage}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-primary/5 text-primary hover:bg-primary hover:text-white rounded-lg transition-all cursor-pointer shadow-sm"
            title="Message"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        )}
        {isPending && (
          <div className="flex flex-col items-center gap-0.5 px-2 py-0.5 bg-amber-50/50 rounded-lg border border-amber-100/20">
            <Lock className="w-2.5 h-2.5 text-amber-500" />
            <span className="text-[7.5px] font-black uppercase text-amber-600 tracking-tighter">Pending</span>
          </div>
        )}
        {showActions && (
          <button
            onClick={onRemove}
            className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-bg-base/50 text-text-muted hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all cursor-pointer border border-border-base group-hover:border-red-100"
            title={isPending ? "Cancel Request" : "Remove Connection"}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const EmptyState = ({ activeTab, isSelf }: any) => {
  const configs: any = {
    suggestions: {
      title: "No people nearby",
      desc: "It seems like everyone is hiding! Why don't you explore the map and see where the crowd is?",
      icon: <MapPin className="w-8 h-8 text-primary" />
    },
    'followers': {
      title: "No Followers",
      desc: "You don't have any followers yet. Share your profile to build your audience!",
      icon: <Users className="w-8 h-8 text-text-muted/40" />
    },
    'following': {
      title: "Lone Wolf?",
      desc: "You haven't followed anyone yet. Start exploring to find interesting people!",
      icon: <Users className="w-8 h-8 text-text-muted/40" />
    }
  };

  const config = configs[activeTab] || configs.suggestions;

  return (
    <div className="flex flex-col items-center justify-center text-center p-16 bg-bg-card rounded-[40px] border border-dashed border-border-base">
      <div className="w-20 h-20 bg-bg-base rounded-[30px] flex items-center justify-center mb-6">
        {config.icon}
      </div>
      <h3 className="text-[20px] font-black tracking-tight text-text-base mb-2 ">
        {isSelf ? config.title : (activeTab === 'followers' ? 'No Followers' : 'No Following')}
      </h3>
      <p className="text-[14px] font-medium text-text-muted max-w-[300px] leading-relaxed">
        {isSelf ? config.desc : `This user doesn't have any ${activeTab} yet.`}
      </p>
    </div>
  );
};

export default ConnectionsView;
