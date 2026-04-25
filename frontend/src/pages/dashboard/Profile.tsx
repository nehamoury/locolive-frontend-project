import { type FC, useState, useEffect } from 'react';
import {
    Camera,
    Settings,
    Video,
    User,
    Bookmark,
    Grid,
    Plus,
    CheckCircle2,
    Flame,
    Lock,
    Share2,
    Heart,
    MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import PostCard from '../../components/post/PostCard';
import { X as CloseIcon } from 'lucide-react';


import StoryViewer from '../../components/story/StoryViewer';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { isUserOnline } from '../../utils/presence';
import { gamificationService, type StreakData, type Badge } from '../../services/gamificationService';

interface ProfileData {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    is_ghost_mode: boolean;
    post_count: number;
    connection_count: number;
    crossings_count: number;
    last_active_at?: string;
    interests: string[];
    is_private: boolean;
}

interface ProfileProps {
    onLogout?: () => void;
}

export const Profile: FC<ProfileProps> = () => {
    const navigate = useNavigate();
    const { id: urlUserId } = useParams();
    const { user } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [reels, setReels] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [savedReels, setSavedReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') as 'posts' | 'reels' | 'saved' | 'tagged' || 'posts';
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>(initialTab);
    const [viewingStories, setViewingStories] = useState<any[]>([]);
    const [streakData, setStreakData] = useState<StreakData | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [selectedPost, setSelectedPost] = useState<any>(null);

    const userId = urlUserId || user?.id;
    const isOwnProfile = userId === user?.id;

    useEffect(() => {
        const handleRefresh = () => {
            fetchProfileData();
        };
        window.addEventListener('postCreated', handleRefresh);
        return () => window.removeEventListener('postCreated', handleRefresh);
    }, [userId]);

    // Mock Highlights
    const mockHighlights = [
        { id: 'm1', title: 'Travel', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&h=200&fit=crop' },
        { id: 'm2', title: 'Sunsets', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&h=200&fit=crop' },
        { id: 'm3', title: 'Food', img: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=200&h=200&fit=crop' },
        { id: 'm4', title: 'Coffee', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop' },
        { id: 'm5', title: 'Nature', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200&h=200&fit=crop' },
    ];

    useEffect(() => {
        if (!urlUserId && user?.id) {
            navigate(`/dashboard/profile/${user.id}`, { replace: true });
        }
    }, [urlUserId, user?.id, navigate]);

    useEffect(() => {
        if (userId) {
            fetchProfileData();
        }
    }, [userId]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            const endpoint = isOwnProfile ? '/profile/me' : `/users/${userId}`;
            const { data } = await api.get(endpoint);
            setProfile(data);

            const postsEndpoint = isOwnProfile ? '/posts/me' : `/users/${userId}/posts`;
            const postsRes = await api.get(postsEndpoint).catch(() => ({ data: { posts: [] } }));

            const highlightsEndpoint = isOwnProfile ? '/highlights/me' : `/users/${userId}/highlights`;
            const highlightsRes = await api.get(highlightsEndpoint).catch(() => ({ data: [] }));

            const reelsRes = await api.get(`/users/${userId}/reels`).catch(() => ({ data: { reels: [] } }));

            let saved = [];
            if (isOwnProfile) {
                const savedRes = await api.get('/reels/saved').catch(() => ({ data: { reels: [] } }));
                saved = savedRes.data?.reels || savedRes.data || [];
            }

            let status: 'none' | 'pending' | 'accepted' = 'none';
            if (!isOwnProfile) {
                const [myConnsRes, mySentRes] = await Promise.all([
                    api.get('/connections').catch(() => ({ data: [] })),
                    api.get('/connections/sent').catch(() => ({ data: [] }))
                ]);

                const myConns = myConnsRes.data || [];
                const mySent = mySentRes.data || [];
                const isConn = myConns.some((c: any) => c.id === userId || c.user_id === userId || c.target_id === userId || c.requester_id === userId);
                const isPending = mySent.some((c: any) => c.target_id === userId || c.user_id === userId);

                if (isConn) status = 'accepted';
                else if (isPending) status = 'pending';
                else status = 'none';

                setFollowStatus(status);
            }

            setPosts(postsRes.data?.posts || []);
            setHighlights(highlightsRes.data || []);
            setReels(reelsRes.data?.reels || reelsRes.data || []);
            setSavedReels(saved);

            // Fetch Gamification Data
            if (isOwnProfile) {
                const [sData, bData] = await Promise.all([
                    gamificationService.getStreak(),
                    gamificationService.getBadges()
                ]);
                setStreakData(sData);
                setBadges(bData.earned_badges || []);
            }

        } catch (error) {
            console.error('Failed to load profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (followStatus === 'accepted') {
                await api.delete(`/connections/${userId}`);
                setFollowStatus('none');
                toast.success('Unfollowed');
            } else if (followStatus === 'pending') {
                await api.delete(`/connections/${userId}`);
                setFollowStatus('none');
                toast.success('Request Cancelled');
            } else {
                await api.post('/connections/request', { target_user_id: userId });
                setFollowStatus('pending');
                toast.success('Follow request sent');
            }
        } catch (err) {
            toast.error('Action failed');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#fcf5f8]">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const currentTabItems = activeTab === 'posts' ? posts :
        activeTab === 'reels' ? reels :
            activeTab === 'saved' ? savedReels : [];

    return (
        <div className="h-full overflow-y-auto no-scrollbar scroll-smooth bg-[#fcf5f8] text-text-base p-2 md:p-6">
            <div className="max-w-[1200px] mx-auto bg-white rounded-[32px] shadow-[0_20px_70px_-15px_rgba(0,0,0,0.05)] overflow-hidden min-h-full flex flex-col pb-12">

                {/* ── Profile Header ── */}
                <div className="px-6 md:px-12 pt-10 pb-8 flex flex-col md:flex-row items-center gap-8 lg:gap-14">
                    {/* Avatar with Story Ring */}
                    <div className="relative shrink-0">
                        <div
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-lg cursor-pointer hover:scale-[1.02] transition-all"
                            onClick={() => isOwnProfile && navigate('/dashboard/settings?section=account_info')}
                        >
                            <div className="w-full h-full rounded-full border-[4px] border-white overflow-hidden bg-bg-base relative">
                                <img
                                    src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                                {isOwnProfile && (
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Camera className="w-6 h-6 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {isUserOnline(profile?.last_active_at) && (
                            <div className="absolute bottom-4 right-4 w-6 h-6 bg-[#10b981] border-[4px] border-white rounded-full shadow-md" />
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-5">
                            <h2 className="text-[28px] md:text-[28px] font-bold tracking-tight text-normal  flex items-center gap-2 leading-none">
                                {profile?.username}
                                {profile?.is_private && <Lock className="w-5 h-5 text-text-muted" />}
                                <CheckCircle2 className="w-6 h-6 text-primary fill-primary/10" strokeWidth={2.5} />
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={isOwnProfile ? () => navigate('/dashboard/settings?section=account_info') : handleFollow}
                                    className="px-5 py-2 bg-bg-base border border-border-base rounded-xl text-[12px] font-black uppercase tracking-wider hover:bg-bg-sidebar transition-all cursor-pointer"
                                >
                                    {isOwnProfile ? 'Edit Profile' : (
                                        followStatus === 'accepted' ? 'Following' :
                                            followStatus === 'pending' ? 'Requested' :
                                                'Follow'
                                    )}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({
                                                title: `${profile?.full_name || profile?.username} on Locolive`,
                                                text: `Check out ${profile?.username}'s profile on Locolive!`,
                                                url: window.location.href,
                                            }).catch(() => {});
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('Link copied to clipboard!');
                                        }
                                    }}
                                    className="p-2 bg-[#ff006e]/5 text-primary border border-primary/20 rounded-xl hover:bg-primary/10 transition-all cursor-pointer"
                                    title="Share Profile"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                                {isOwnProfile && (
                                    <button
                                        onClick={() => navigate('/dashboard/settings')}
                                        className="p-2 bg-bg-base border border-border-base rounded-xl hover:bg-bg-sidebar transition-all cursor-pointer"
                                    >
                                        <Settings className="w-5 h-5 text-text-muted" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-10 mb-6">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-xl font-black  leading-none">{profile?.post_count || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">posts</span>
                            </div>
                            <div 
                                onClick={() => navigate('/dashboard/connections?tab=followers')}
                                className="flex flex-col items-center md:items-start cursor-pointer group/stat hover:opacity-80 transition-opacity"
                            >
                                <span className="text-xl font-black leading-none group-hover/stat:text-primary transition-colors">{profile?.connection_count || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">followers</span>
                            </div>
                            <div 
                                onClick={() => navigate('/dashboard/connections?tab=following')}
                                className="flex flex-col items-center md:items-start cursor-pointer group/stat hover:opacity-80 transition-opacity"
                            >
                                <span className="text-xl font-black leading-none group-hover/stat:text-primary transition-colors">{Math.floor((profile?.connection_count || 0) * 0.8)}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">following</span>
                            </div>
                            {isOwnProfile && streakData && (
                                <div className="flex flex-col items-center md:items-start group cursor-help">
                                    <div className="flex items-center gap-1">
                                        <span className="text-xl font-black leading-none text-[#ff4d00]">{streakData.current_streak}</span>
                                        <Flame className={cn("w-5 h-5 fill-[#ff4d00] text-[#ff4d00]", streakData.current_streak > 0 ? "animate-bounce" : "opacity-30")} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mt-1">streak</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-[16px] font-black text-text-base  mb-0.5">{profile?.full_name}</p>
                            <p className="text-[13px] text-text-muted font-bold leading-relaxed max-w-md">
                                {profile?.bio}
                            </p>
                        </div>

                        {/* Badges Display */}
                        {isOwnProfile && badges && badges.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {badges.slice(0, 5).map((badge) => (
                                    <div 
                                        key={badge.id} 
                                        title={badge.name + ": " + badge.description}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fce7f3] border border-[#f9a8d4] rounded-full hover:scale-105 transition-all cursor-help"
                                    >
                                        <span className="text-sm">{badge.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-[#be185d]">{badge.name}</span>
                                    </div>
                                ))}
                                {badges && badges.length > 5 && (
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-base border border-border-base text-[10px] font-black text-text-muted">
                                        +{badges.length - 5}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Highlights Section ── */}
                <div className="px-6 md:px-12 pb-8 border-b border-border-base/50">
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-2">
                        {isOwnProfile && (
                            <div className="flex flex-col items-center gap-2 shrink-0">
                                <button
                                    onClick={() => navigate('/dashboard/manage-highlights')}
                                    className="w-16 h-16 md:w-18 md:h-18 rounded-full border border-dashed border-border-base flex items-center justify-center hover:border-primary transition-colors group cursor-pointer"
                                >
                                    <Plus className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
                                </button>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">New</span>
                            </div>
                        )}
                        {(highlights.length > 0 ? highlights : mockHighlights).map((h: any) => (
                            <div key={h.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
                                <div className="w-16 h-16 md:w-18 md:h-18 rounded-full p-0.5 border border-border-base group-hover:border-primary transition-all overflow-hidden">
                                    <img
                                        src={h.img || getMediaUrl(h.cover_url, FALLBACKS.POST)}
                                        className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        alt=""
                                    />
                                </div>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider group-hover:text-text-base transition-colors">{h.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Content Tabs ── */}
                <div className="flex justify-center border-b border-border-base/50">
                    {(['posts', 'reels', 'saved', 'tagged'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 transition-all cursor-pointer border-b-2 -mb-[1px]",
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-text-muted hover:text-text-base"
                            )}
                        >
                            {tab === 'posts' && <Grid className="w-4 h-4" />}
                            {tab === 'reels' && <Video className="w-4 h-4" />}
                            {tab === 'saved' && <Bookmark className="w-4 h-4" />}
                            {tab === 'tagged' && <User className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-[2px]">{tab}</span>
                        </button>
                    ))}
                </div>

                {/* ── Content Area ── */}
                <div className="flex-1 p-4 md:p-2">
                    {!isOwnProfile && profile?.is_private && followStatus !== 'accepted' ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-purple-100">
                                <Lock className="w-10 h-10 text-purple-500" />
                            </div>
                            <h3 className="text-2xl font-black text-text-base mb-2">This account is private</h3>
                            <p className="text-[14px] text-text-muted font-bold max-w-[280px]">
                                Follow this account to see their photos and videos.
                            </p>
                        </div>
                    ) : currentTabItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-bg-base rounded-full flex items-center justify-center mb-5 shadow-sm">
                                {activeTab === 'posts' ? <Camera className="w-8 h-8 text-text-muted/50" /> :
                                    activeTab === 'reels' ? <Video className="w-8 h-8 text-text-muted/50" /> :
                                        <Bookmark className="w-8 h-8 text-text-muted/50" />}
                            </div>
                            <h3 className="text-xl font-black  text-text-base mb-1">No {activeTab} yet</h3>
                            <p className="text-[12px] text-text-muted font-bold mb-6 max-w-[220px]">
                                {activeTab === 'posts' ? 'Share your moments with the world.' :
                                    activeTab === 'reels' ? 'Create fun videos to share.' :
                                        'Your saved items will appear here.'}
                            </p>
                            {isOwnProfile && activeTab !== 'tagged' && (
                                <button
                                    onClick={() => navigate('/dashboard/home')}
                                    className="px-6 py-2.5 bg-brand-gradient text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all cursor-pointer"
                                >
                                    <Plus className="inline-block w-3 h-3 mr-1.5 -mt-0.5" />
                                    Create {activeTab === 'posts' ? 'Post' : 'Reel'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-1 md:gap-2">
                            {currentTabItems.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setSelectedPost(item)}
                                    className="aspect-square bg-bg-base rounded-lg overflow-hidden group cursor-pointer relative shadow-sm hover:shadow-md transition-all"
                                >
                                    <img
                                        src={getMediaUrl(item.media_url || item.video_url, FALLBACKS.POST)}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        alt=""
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white">
                                        <div className="flex items-center gap-2">
                                            <Heart className="w-5 h-5 fill-white" />
                                            <span className="text-sm font-black">{item.likes_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MessageCircle className="w-5 h-5 fill-white" />
                                            <span className="text-sm font-black">{item.comments_count || 0}</span>
                                        </div>
                                    </div>
                                    {activeTab === 'reels' && (
                                        <div className="absolute top-2 right-2">
                                            <Video className="w-4 h-4 text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>



            {viewingStories.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black">
                    <StoryViewer
                        stories={viewingStories}
                        initialIndex={0}
                        onClose={() => setViewingStories([])}
                        currentUserID={user?.id}
                    />
                </div>
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
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setSelectedPost(null)}
                                className="absolute -top-12 right-0 md:-right-12 p-2 text-white/60 hover:text-white transition-colors"
                            >
                                <CloseIcon className="w-8 h-8" />
                            </button>
                            <PostCard 
                                post={selectedPost} 
                                currentUserID={user?.id}
                                onDelete={() => {
                                    setSelectedPost(null);
                                    fetchProfileData();
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
