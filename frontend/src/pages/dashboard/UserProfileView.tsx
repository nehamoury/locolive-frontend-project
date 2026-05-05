import { useState, useEffect, type FC } from 'react';
import { ArrowLeft, MessageSquare, MessageCircle, MapPin, Grid3x3, Heart, Share2, MoreHorizontal, Zap, Footprints, Users, Film, Shield, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import StoryViewer from '../../components/story/StoryViewer';
import Highlights from '../../components/profile/Highlights';
import PostCard from '../../components/post/PostCard';
import { X as CloseIcon } from 'lucide-react';
import {
  useUserProfile,
  useUserStories,
  useUserPosts,
  useUserReels,
  usePrivacyCheck,
} from '../../hooks/useUserData';
import { useQueryClient } from '@tanstack/react-query';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  onMessage: (userId: string) => void;
}

const UserProfileView: FC<UserProfileViewProps> = ({ userId, onBack, onMessage }) => {
  const queryClient = useQueryClient();
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'posts' | 'reels' | 'history'>('stories');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  // --- CORE RULE: viewer vs target ---
  // userId = targetUserId (passed as prop from route)
  // Current user is determined from auth context automatically by API

  // --- TanStack Query: Target User Data (with userId in query keys) ---
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useUserProfile(userId);

  const {
    data: storiesData,
  } = useUserStories(userId);

  const {
    data: postsData,
    isLoading: postsLoading,
  } = useUserPosts(userId, 1, 12);

  const {
    data: reelsData,
    isLoading: reelsLoading,
  } = useUserReels(userId, 1, 12);

  // --- Privacy Check ---
  usePrivacyCheck(profile || null);

  // --- Derived State ---
  const stories = storiesData || [];
  const posts = postsData?.posts || [];
  const reels = reelsData?.reels || [];
  const loading = profileLoading;

  // Get distance from profile
  const distanceKm = profile?.distance_km || null;

  // Get error status from query error
  const errorStatus = profileError && (profileError as any).response?.status
    ? (profileError as any).response.status
    : null;

  // --- Refresh profile on post creation ---
  useEffect(() => {
    const handlePostCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'posts', userId] });
    };
    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [userId, queryClient]);

  const handleBlockAction = async () => {
    if (!profile) return;
    const action = profile.is_blocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} ${profile.full_name || profile.username}?`)) return;

    setBlocking(true);
    try {
      if (profile.is_blocked) {
        await api.delete(`/privacy/block/${userId}`);
        import('react-hot-toast').then(({ toast }) => toast.success('User unblocked successfully'));
      } else {
        await api.post('/privacy/block', { user_id: userId });
        import('react-hot-toast').then(({ toast }) => toast.success('User blocked successfully'));
      }
      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
    } catch (err) {
      import('react-hot-toast').then(({ toast }) => toast.error(`Failed to ${action} user`));
    } finally {
      setBlocking(false);
      setShowMoreMenu(false);
    }
  };

  const handleFollow = async () => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      // Invalidate profile query to refresh connection status
      queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
    } catch (err) {
      console.error('Follow request failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-base transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileLoading && (!profile || errorStatus === 404)) {
    return (
      <div className="p-8 text-center bg-bg-base h-full flex flex-col items-center justify-center transition-colors duration-300">
        <div className="w-20 h-20 bg-bg-sidebar/50 rounded-[32px] flex items-center justify-center mb-6 border border-border-base/50">
          <Users className="w-8 h-8 text-text-muted/20" />
        </div>
        <p className="text-text-muted font-black uppercase tracking-[3px] text-[10px]">User not found</p>
        <p className="text-text-muted/60 text-[11px] font-bold mt-2 max-w-[200px]">The user you're looking for might have changed their username or is currently unavailable.</p>
        <button onClick={onBack} className="mt-8 px-8 py-3 bg-primary text-white font-black uppercase tracking-[2px] text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all cursor-pointer">Return Home</button>
      </div>
    );
  }

  if (!profileLoading && errorStatus === 403) {
    return (
      <div className="h-full bg-bg-base overflow-y-auto no-scrollbar">
        {/* Header (Minimal for private users) */}
        <div className="p-6 flex items-center gap-4">
           <button onClick={onBack} className="p-2.5 bg-bg-card rounded-2xl border border-border-base hover:bg-bg-sidebar transition-all cursor-pointer">
             <ArrowLeft className="w-5 h-5 text-text-base" />
           </button>
           <h2 className="text-sm font-black uppercase tracking-widest text-text-muted">Private Account</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-32 px-10 text-center">
          <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center mb-8 shadow-2xl shadow-black/5 border border-border-base/50">
            <div className="w-20 h-20 bg-purple-50 rounded-[32px] flex items-center justify-center text-purple-500">
              <Lock className="w-10 h-10" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-text-base mb-3 italic tracking-tight uppercase">This Account is Private</h3>
          <p className="text-sm text-text-muted font-bold max-w-[300px] leading-relaxed mb-10">Follow this account to see their photos, videos and moments on Locolive.</p>
          
          <button 
            onClick={handleFollow}
            className="px-10 py-4 bg-text-base text-bg-base rounded-[24px] font-black uppercase tracking-[2px] text-xs shadow-2xl shadow-black/20 hover:scale-105 transition-all active:scale-95 cursor-pointer"
          >
            Send Connection Request
          </button>
        </div>
      </div>
    );
  }

  const avatarLetter = (profile?.full_name || profile?.username || '?').charAt(0).toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-bg-base text-text-base overflow-y-auto no-scrollbar transition-colors duration-300"
    >
      {/* ─── Hero Header ─── */}
      <div className="relative h-64 w-full bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] overflow-hidden">
        {(profile as any)?.cover_url ? (
          <img src={getMediaUrl((profile as any).cover_url)} className="w-full h-full object-cover" alt="Cover" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent" />
        )}
        
        {/* Top Navigation */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
          <button onClick={onBack} className="p-2.5 bg-bg-card/40 backdrop-blur-md rounded-2xl border border-border-base hover:bg-bg-card/60 transition-all cursor-pointer" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-base" />
          </button>
          <div className="flex gap-2">
            <button className="p-2.5 bg-bg-card/40 backdrop-blur-md rounded-2xl border border-border-base hover:bg-bg-card/60 transition-all cursor-pointer" aria-label="Share">
              <Share2 className="w-5 h-5 text-text-base" />
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2.5 bg-bg-card/40 backdrop-blur-md rounded-2xl border border-border-base hover:bg-bg-card/60 transition-all cursor-pointer" 
                aria-label="More"
              >
                <MoreHorizontal className="w-5 h-5 text-text-base" />
              </button>
              
              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-bg-card border border-border-base rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={handleBlockAction}
                        disabled={blocking}
                        className={`w-full text-left px-4 py-3 text-sm font-black transition-colors flex items-center gap-3 ${
                          profile?.is_blocked ? 'text-primary hover:bg-primary/5' : 'text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        {blocking ? (profile?.is_blocked ? 'Unblocking...' : 'Blocking...') : (profile?.is_blocked ? 'Unblock User' : 'Block User')}
                      </button>
                      <button className="w-full text-left px-4 py-3 text-sm font-black text-text-base hover:bg-bg-sidebar transition-colors flex items-center gap-3">
                        <MoreHorizontal className="w-4 h-4" />
                        Report
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Profile Content overlap ─── */}
      <div className="relative px-6 -mt-16 pb-12">
        <div className="flex flex-col">
          {/* Avatar & Action Buttons */}
          <div className="flex items-end justify-between mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-[32px] bg-bg-card p-1 shadow-2xl shadow-black/5">
                <div className="w-full h-full rounded-[28px] bg-gradient-to-tr from-primary to-accent p-1">
                  <div className="w-full h-full rounded-[24px] bg-bg-card overflow-hidden flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={getMediaUrl(profile.avatar_url, FALLBACKS.AVATAR(profile.username))} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-4xl font-black text-primary italic">{avatarLetter}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pb-2">
              {profile?.is_blocked ? (
                <button
                  onClick={handleBlockAction}
                  disabled={blocking}
                  className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all active:scale-95 cursor-pointer"
                >
                  {blocking ? 'Unblocking...' : 'Unblock'}
                </button>
              ) : profile?.connection_status === 'accepted' ? (
                <button
                  disabled
                  className="px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest bg-pink-50 text-pink-500 border border-pink-100 cursor-default"
                >
                  Following
                </button>
              ) : (
                <button
                  onClick={handleFollow}
                  disabled={profile?.connection_status === 'pending' || profile?.requested}
                  className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 cursor-pointer
                    ${(profile?.connection_status === 'pending' || profile?.requested)
                      ? 'bg-bg-sidebar text-text-muted cursor-not-allowed'
                      : 'bg-text-base text-bg-base shadow-black/10'}`}
                >
                  {profile?.connection_status === 'pending' || profile?.requested ? 'Requested' : 'Follow'}
                </button>
              )}
              <button 
                onClick={() => onMessage(userId)}
                className="p-2.5 bg-primary/10 text-primary rounded-2xl border border-primary/20 hover:bg-primary/20 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Name & Bio */}
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight italic text-text-base uppercase mb-1">
              {profile?.full_name || profile?.username}
            </h1>
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider mb-4">
              <span>@{profile?.username}</span>
              <div className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-text-muted">{distanceKm ? `${distanceKm.toFixed(1)}km away` : 'Locolive Community'}</span>
              </div>
            </div>
            {profile?.bio && (
              <p className="text-sm text-text-muted font-medium leading-relaxed max-w-md italic border-l-4 border-border-base pl-4 py-1">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-border-base mb-8">
            <div onClick={() => setActiveTab('stories')} className="cursor-pointer">
              <QuickStat label="Moments" value={stories.length} icon={<Zap className="w-3.5 h-3.5" />} />
            </div>
            <div onClick={() => onBack()} className="cursor-pointer">
              <QuickStat label="Connections" value={profile?.connection_count || 0} icon={<Users className="w-3.5 h-3.5" />} />
            </div>
            <div onClick={() => setActiveTab('history')} className="cursor-pointer">
              <QuickStat label="Crossed" value={profile?.crossings_count || 0} icon={<Footprints className="w-3.5 h-3.5" />} />
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest">Featured</span>
            </div>
            <Highlights highlights={[]} isOwnProfile={false} />
          </div>

          {/* ─── Navigation Tabs ─── */}
          <div className="sticky top-0 bg-bg-base/80 backdrop-blur-xl z-20 flex gap-10 border-b border-border-base mb-6 px-1 overflow-x-auto">
            {([
              { id: 'stories', label: 'Stories', icon: <Zap className="w-4 h-4" /> },
              { id: 'posts', label: 'Posts', icon: <Grid3x3 className="w-4 h-4" /> },
              { id: 'reels', label: 'Reels', icon: <Film className="w-4 h-4" /> },
              { id: 'history', label: 'Common', icon: <Footprints className="w-4 h-4" /> },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 relative flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id ? 'text-text-base' : 'text-text-base/20 hover:text-text-base/40'
                }`}
              >
                {tab.icon}
                <span className="text-xs font-black uppercase tracking-[2px]">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabUser"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>

          {/* ─── Tab Content ─── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="min-h-[400px]"
            >
              {profile?.is_private && profile?.connection_status === 'none' ? (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-bg-sidebar/30 rounded-[32px] border border-dashed border-border-base">
                  <div className="w-16 h-16 bg-bg-card rounded-[20px] flex items-center justify-center mb-6 shadow-sm border border-border-base">
                    <Lock className="w-8 h-8 text-text-muted/40" />
                  </div>
                  <h3 className="text-lg font-black text-text-base mb-2">This Account is Private</h3>
                  <p className="text-xs text-text-muted font-bold max-w-[240px]">Follow this account to see their photos, videos and stories.</p>
                </div>
              ) : (
                <>
                  {activeTab === 'stories' && (
                    stories.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {stories.map((story: any, idx: number) => (
                          <div
                            key={story.id}
                            onClick={() => setViewingStoryIndex(idx)}
                            className="aspect-[9/16] bg-bg-sidebar rounded-[24px] overflow-hidden relative cursor-pointer group border border-border-base"
                          >
                            <img src={getMediaUrl(story.media_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                               <div className="flex items-center gap-1.5 text-white/90">
                                  <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                                  <span className="text-[10px] font-black">{story.reactions_count || 0}</span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState label="Archive empty" icon={<Zap className="w-8 h-8" />} />
                    )
                  )}

                  {activeTab === 'posts' && (
                    postsLoading ? (
                      <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : posts.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {posts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="aspect-square bg-bg-sidebar rounded-[24px] overflow-hidden relative group border border-border-base cursor-pointer"
                          >
                            <img src={getMediaUrl(post.media_url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                               <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 fill-white" />
                                  <span className="text-xs font-black">{post.likes_count || 0}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4 fill-white" />
                                  <span className="text-xs font-black">{post.comments_count || 0}</span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState label="No posts yet" icon={<Grid3x3 className="w-8 h-8" />} />
                    )
                  )}

                  {activeTab === 'reels' && (
                    reelsLoading ? (
                      <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : reels.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {reels.map((reel: any) => (
                          <div
                            key={reel.id}
                            className="aspect-[9/16] bg-bg-sidebar rounded-[24px] overflow-hidden relative group border border-border-base"
                          >
                            <video
                              src={getMediaUrl(reel.video_url)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              poster={reel.thumbnail}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                              <div className="flex items-center gap-1.5 text-white/90 text-[10px] font-black">
                                <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                                <span>{reel.likes_count || 0}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState label="No reels yet" icon={<Film className="w-8 h-8" />} />
                    )
                  )}

                  {activeTab === 'history' && <EmptyState label="No common paths" icon={<Footprints className="w-8 h-8" />} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialIndex={viewingStoryIndex}
          onClose={() => setViewingStoryIndex(null)}
          currentUser={""}
          currentUserID={""}
        />
      )}

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute -top-12 right-0 md:-right-12 p-2 text-white/60 hover:text-white transition-colors"
              >
                <CloseIcon className="w-8 h-8" />
              </button>
              <PostCard
                post={selectedPost}
                currentUserID={""}
                onDelete={() => {
                  setSelectedPost(null);
                  queryClient.invalidateQueries({ queryKey: ['users', 'profile', userId] });
                  queryClient.invalidateQueries({ queryKey: ['users', 'posts', userId] });
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Sub-components Content matches Profile.tsx for consistency ───

const QuickStat = ({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="flex items-center gap-1.5 mb-0.5">
       <span className="text-text-muted/20">{icon}</span>
       <span className="text-xl font-black text-text-base italic tracking-tight">{value}</span>
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/40">{label}</span>
  </div>
);

const EmptyState = ({ label, icon }: { label: string; icon: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="text-3xl mb-4 text-text-muted/20">{icon}</div>
    <p className="text-xs font-black uppercase tracking-widest text-text-muted/20 italic">{label}</p>
  </div>
);

export default UserProfileView;
