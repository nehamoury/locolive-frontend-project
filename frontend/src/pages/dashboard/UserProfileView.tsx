import { useState, useEffect, type FC } from 'react';
import { ArrowLeft, MessageSquare, MapPin, Grid3x3, Heart, Share2, MoreHorizontal, Zap, Footprints, Users, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import StoryViewer from '../../components/story/StoryViewer';
import Highlights from '../../components/profile/Highlights';
import { BACKEND } from '../../utils/config';

interface UserProfileViewProps {
  userId: string;
  onBack: () => void;
  onMessage: (userId: string) => void;
}

const UserProfileView: FC<UserProfileViewProps> = ({ userId, onBack, onMessage }) => {
  const [profile, setProfile] = useState<any>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reelsLoading, setReelsLoading] = useState(false);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'stories' | 'posts' | 'reels' | 'history'>('stories');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    const fetchFullProfile = async () => {
      try {
        setLoading(true);
        const [userRes, storiesRes] = await Promise.all([
          api.get(`/users/${userId}`),
          api.get(`/stories/user/${userId}`).catch(() => ({ data: [] }))
        ]);
        setProfile(userRes.data);
        setStories(storiesRes.data || []);
        if (userRes.data.distance_km) {
          setDistanceKm(userRes.data.distance_km);
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFullProfile();
  }, [userId]);

  // Lazy load reels when tab is activated
  useEffect(() => {
    if (activeTab === 'reels' && reels.length === 0 && !reelsLoading) {
      fetchReels();
    }
  }, [activeTab]);

  const fetchReels = async () => {
    try {
      setReelsLoading(true);
      const res = await api.get(`/users/${userId}/reels?page=1&page_size=12`);
      setReels(res.data.reels || []);
    } catch (err) {
      console.error('Failed to fetch user reels:', err);
    } finally {
      setReelsLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      setProfile((prev: any) => ({ ...prev, requested: true }));
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

  if (!profile) {
    return (
      <div className="p-8 text-center bg-bg-base h-full flex flex-col items-center justify-center transition-colors duration-300">
        <p className="text-text-muted font-bold uppercase tracking-widest">User not found</p>
        <button onClick={onBack} className="mt-4 text-primary font-black uppercase tracking-[2px] text-xs cursor-pointer">Return Home</button>
      </div>
    );
  }

  const avatarLetter = (profile.full_name || profile.username || '?').charAt(0).toUpperCase();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full bg-bg-base text-text-base overflow-y-auto no-scrollbar transition-colors duration-300"
    >
      {/* ─── Hero Header ─── */}
      <div className="relative h-64 w-full bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] overflow-hidden">
        {profile.cover_url ? (
          <img src={`${BACKEND}${profile.cover_url}`} className="w-full h-full object-cover" alt="Cover" />
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
            <button className="p-2.5 bg-bg-card/40 backdrop-blur-md rounded-2xl border border-border-base hover:bg-bg-card/60 transition-all cursor-pointer" aria-label="More">
              <MoreHorizontal className="w-5 h-5 text-text-base" />
            </button>
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
                    {profile.avatar_url ? (
                      <img src={`${BACKEND}${profile.avatar_url}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-4xl font-black text-primary italic">{avatarLetter}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pb-2">
              <button 
                onClick={handleFollow}
                disabled={profile.requested}
                className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 cursor-pointer
                  ${profile.requested 
                    ? 'bg-bg-sidebar text-text-muted cursor-not-allowed' 
                    : 'bg-text-base text-bg-base shadow-black/10'}`}
              >
                {profile.requested ? 'Requested' : 'Follow'}
              </button>
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
              {profile.full_name || profile.username}
            </h1>
            <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-wider mb-4">
              <span>@{profile.username}</span>
              <div className="w-1.5 h-1.5 bg-primary/20 rounded-full" />
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-text-muted">{distanceKm ? `${distanceKm.toFixed(1)}km away` : 'Locolive Community'}</span>
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-text-muted font-medium leading-relaxed max-w-md italic border-l-4 border-border-base pl-4 py-1">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-border-base mb-8">
            <QuickStat label="Moments" value={stories.length} icon={<Zap className="w-3.5 h-3.5" />} />
            <QuickStat label="Connections" value={profile.connection_count || 0} icon={<Users className="w-3.5 h-3.5" />} />
            <QuickStat label="Crossed" value={profile.crossings_count || 0} icon={<Footprints className="w-3.5 h-3.5" />} />
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
              {activeTab === 'stories' && (
                stories.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {stories.map((story, idx) => (
                      <div
                        key={story.id}
                        onClick={() => setViewingStoryIndex(idx)}
                        className="aspect-[9/16] bg-bg-sidebar rounded-[24px] overflow-hidden relative cursor-pointer group border border-border-base"
                      >
                        <img src={`${BACKEND}${story.media_url}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
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

              {activeTab === 'posts' && <EmptyState label="No posts yet" icon={<Grid3x3 className="w-8 h-8" />} />}

              {activeTab === 'reels' && (
                reelsLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : reels.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {reels.map((reel) => (
                      <div
                        key={reel.id}
                        className="aspect-[9/16] bg-bg-sidebar rounded-[24px] overflow-hidden relative group border border-border-base"
                      >
                        <video
                          src={`${BACKEND}${reel.video_url}`}
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
