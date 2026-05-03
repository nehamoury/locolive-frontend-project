import { type FC, useState, useEffect } from 'react';
import {
    ChevronLeft,
    Plus,
    Share2,
    Grid,
    CheckCircle2,
    MessageCircle,
    Play,
    AlertCircle,
    RefreshCw,
    Film,
    MessageSquare,
    Settings,
    MoreHorizontal,
    Bookmark,
    Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import ShareModal from '../../components/share/ShareModal';
import EditProfileModal from '../../components/profile/EditProfileModal';
import PostCard from '../../components/post/PostCard';
import { X as CloseIcon } from 'lucide-react';

// --- Types ---
interface ProfileData {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    post_count: number;
    followers_count: number;
    following_count: number;
    likes_count?: number;
    is_private: boolean;
    is_verified?: boolean;
}

interface ProfileProps {
    onCreatePost?: () => void;
}

// --- Sub-components ---

const ProfileSkeleton = () => (
    <div className="animate-pulse bg-white min-h-screen">
        <div className="h-14 bg-pink-50/50 mb-4" />
        <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-pink-50/50 mb-4" />
            <div className="h-6 w-32 bg-pink-50/50 mb-2" />
            <div className="h-4 w-48 bg-pink-50/50" />
        </div>
        <div className="flex justify-center gap-8 mb-8">
            <div className="h-10 w-16 bg-pink-50/50" />
            <div className="h-10 w-16 bg-pink-50/50" />
            <div className="h-10 w-16 bg-pink-50/50" />
        </div>
        <div className="h-11 mx-4 bg-pink-50/50 rounded-lg mb-8" />
        <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-pink-50/30" />
            ))}
        </div>
    </div>
);

const EmptyState: FC<{ tab: string }> = ({ tab }) => (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/50">
        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-4 border border-pink-100/50 shadow-sm">
            <Grid className="w-10 h-10 text-[#FF006E]/30" />
        </div>
        <h3 className="text-[17px] font-bold text-slate-800 mb-2">No {tab} yet</h3>
        <p className="text-[14px] text-slate-500">
            This user hasn't posted any {tab} yet.
        </p>
    </div>
);

// --- Main Component ---

export const Profile: FC<ProfileProps> = () => {
    const navigate = useNavigate();
    const { id: urlUserId } = useParams();
    const { user } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [reels, setReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reelsLoading, setReelsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'thoughts'>('posts');
    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<any>(null);

    const userId = urlUserId || user?.id;
    const isOwnProfile = userId === user?.id;

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
        setError(null);
        try {
            const endpoint = isOwnProfile ? '/profile/me' : `/users/${userId}`;
            const { data } = await api.get(endpoint);
            setProfile({
                ...data,
                likes_count: data.likes_count || 0,
                is_verified: true
            });

            const postsEndpoint = isOwnProfile ? '/posts/me' : `/users/${userId}/posts`;
            const postsRes = await api.get(postsEndpoint).catch(() => ({ data: [] }));
            // Handle both {posts: []} and [] formats
            const fetchedPosts = postsRes.data?.posts || (Array.isArray(postsRes.data) ? postsRes.data : []);
            setPosts(fetchedPosts);

            // Fetch Reels
            setReelsLoading(true);
            const reelsEndpoint = isOwnProfile ? '/reels/me' : `/users/${userId}/reels`;
            const reelsRes = await api.get(`${reelsEndpoint}?page=1&page_size=20`).catch(() => ({ data: [] }));
            const fetchedReels = reelsRes.data?.reels || (Array.isArray(reelsRes.data) ? reelsRes.data : []);
            setReels(fetchedReels);
            setReelsLoading(false);

            if (!isOwnProfile) {
                const connsRes = await api.get('/connections').catch(() => ({ data: [] }));
                const sentRes = await api.get('/connections/sent').catch(() => ({ data: [] }));

                const isConn = (connsRes.data || []).some((c: any) =>
                    c.id === userId || c.user_id === userId || c.target_id === userId
                );
                const isPending = (sentRes.data || []).some((c: any) =>
                    c.target_id === userId || c.user_id === userId
                );

                setFollowStatus(isConn ? 'accepted' : isPending ? 'pending' : 'none');
            }
        } catch (err) {
            console.error('Failed to load profile:', err);
            setError('Could not load profile. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        try {
            if (followStatus === 'accepted' || followStatus === 'pending') {
                await api.delete(`/connections/${userId}`);
                setFollowStatus('none');
                toast.success('Unfollowed');
            } else {
                await api.post('/connections/request', { target_user_id: userId });
                setFollowStatus('pending');
                toast.success('Request sent');
            }
        } catch (err) {
            toast.error('Action failed');
        }
    };

    if (loading) return <ProfileSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
                <AlertCircle className="w-12 h-12 text-pink-200 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={fetchProfileData}
                    className="flex items-center gap-2 px-6 py-2 bg-[#FE2C55] text-white rounded-full font-bold active:scale-95 transition-all shadow-lg shadow-red-500/20"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-20 select-none transition-colors duration-300">
            {/* Background Layer */}
            <div className="fixed inset-0 bg-linear-to-b from-pink-50/30 to-white -z-10" />

            {/* ── Mobile Header Sticky (md:hidden) ── */}
            <div className="sticky top-1 z-50 md:hidden flex items-center justify-between px-3 py-2 pt-[calc(0.25rem+env(safe-area-inset-top))] bg-white/80 backdrop-blur-md border-b border-pink-100/50">
                <button onClick={() => navigate(-1)} className="p-1 -ml-1 active:opacity-50">
                    <ChevronLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h1 className="text-[19px] font-bold text-slate-900 truncate">
                    {profile?.username || 'User'}
                </h1>
                <div className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="active:opacity-50">
                        <Settings className="w-6 h-6 text-slate-900" />
                    </button>
                    {isDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg shadow-pink-500/10 border border-slate-100 py-1 z-50">
                                <button
                                    onClick={() => {
                                        navigate('/dashboard/settings');
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                >
                                    <Settings className="w-4 h-4" /> Account Settings
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="max-w-[935px] mx-auto px-4 md:px-5">

                {/* ── MOBILE HEADER CONTENT (Restored to previous centered style) ── */}
                <div className="md:hidden flex flex-col items-center pt-3">
                    {/* Avatar */}
                    <div className="relative mb-2">
                        <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-[#FF3B8E] via-[#FF8C3B] to-[#9D3BFF] shadow-lg shadow-pink-500/10">
                            <div className="w-full h-full rounded-full bg-white p-0">
                                <img
                                    src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))}
                                    className="w-full h-full object-cover rounded-full"
                                    alt=""
                                />
                            </div>
                        </div>
                    </div>

                    {/* Username */}
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[18px] font-medium text-slate-900">{profile?.full_name}</span>
                        {profile?.is_verified && (
                            <CheckCircle2 className="w-5 h-5 text-[#FF006E] fill-[#FF006E]/10" />
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-around w-full max-w-[290px] mb-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[17px] font-bold text-slate-900">{posts.length}</span>
                            <span className="text-[13px] text-slate-500 font-medium">Posts</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[17px] font-bold text-slate-900">{profile?.followers_count || 0}</span>
                            <span className="text-[13px] text-slate-500 font-medium">Followers</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[17px] font-bold text-slate-900">{profile?.following_count || 0}</span>
                            <span className="text-[13px] text-slate-500 font-medium">Following</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 w-full max-w-[400px] mb-4 px-0">
                        {isOwnProfile ? (
                            <>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex-1 h-11 bg-pink-50/50 border border-pink-100 rounded-xl text-[15px] font-bold text-[#2F2F2F] active:scale-95 transition-all shadow-sm"
                                >
                                    Edit profile
                                </button>
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="flex-1 h-11 bg-pink-50/50  border border-pink-100 rounded-xl text-[15px] font-bold text-[#2F2F2F] active:scale-95 transition-all shadow-sm"
                                >
                                    Share profile
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleFollow}
                                    className={`flex-1 h-11 rounded-xl text-[15px] font-bold transition-all active:scale-95 shadow-sm ${followStatus === 'accepted'
                                        ? "bg-pink-50/50 border border-pink-100 text-[#FF006E]"
                                        : "bg-[#FE2C55] text-white shadow-lg shadow-red-500/20"
                                        }`}
                                >
                                    {followStatus === 'accepted' ? 'Following' : followStatus === 'pending' ? 'Requested' : 'Follow'}
                                </button>
                                <button
                                    onClick={() => navigate(`/dashboard/messages/${userId}`)}
                                    className="w-11 h-11 bg-white border border-pink-100 rounded-xl flex items-center justify-center text-[#FF006E] active:scale-95 transition-all shadow-sm"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="px-6 text-center mb-2">
                        <p className="text-[15px] text-slate-600 leading-relaxed font-medium line-clamp-3">
                            {profile?.bio || 'No bio yet.'}
                        </p>
                    </div>
                </div>

                {/* ── DESKTOP HEADER CONTENT (Instagram Style) ── */}
                <header className="hidden md:flex flex-row mt-10 mb-12">
                    {/* Avatar Column */}
                    <div className="flex-[1] flex justify-center shrink-0 mr-[30px]">
                        <div className="w-[150px] h-[150px] rounded-full p-[3px] bg-gradient-to-tr from-[#FF3B8E] via-[#FF8C3B] to-[#9D3BFF] shadow-lg">
                            <div className="w-full h-full rounded-full bg-white p-[3px]">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-50 flex items-center justify-center">
                                    <img
                                        src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="flex-[2] flex flex-col items-start space-y-5">
                        {/* Row 1: Username + Action Buttons */}
                        <div className="flex flex-row items-center gap-5 w-full">
                            <div className="flex items-center gap-2">
                                <h2 className="text-[28px] font-light text-slate-900 tracking-tight">
                                    {profile?.username}
                                </h2>
                                {profile?.is_verified && (
                                    <CheckCircle2 className="w-[18px] h-[18px] text-[#FF006E] fill-[#FF006E]/10" />
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {isOwnProfile ? (
                                    <>
                                        <button
                                            onClick={() => setIsEditModalOpen(true)}
                                            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-bold transition-all"
                                        >
                                            Edit profile
                                        </button>
                                        <button
                                            onClick={() => setIsShareModalOpen(true)}
                                            className="p-2 text-slate-900 hover:scale-105 transition-transform"
                                        >
                                            <Share2 className="w-6 h-6" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleFollow}
                                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${followStatus === 'accepted'
                                                ? 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                                : 'bg-[#FF006E] text-white hover:bg-[#D4005B]'
                                                }`}
                                        >
                                            {followStatus === 'accepted' ? 'Following' : followStatus === 'pending' ? 'Requested' : 'Follow'}
                                        </button>
                                        <button
                                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-sm font-bold"
                                            onClick={() => navigate(`/dashboard/messages/${userId}`)}
                                        >
                                            Message
                                        </button>
                                    </div>
                                )}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="p-2 text-slate-900 hover:scale-105 transition-transform"
                                    >
                                        <Settings className="w-6 h-6" />
                                    </button>
                                    {isDropdownOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg shadow-pink-500/10 border border-slate-100 py-2 z-50">
                                                <button
                                                    onClick={() => {
                                                        navigate('/dashboard/settings');
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" /> Account Settings
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Stats */}
                        <div className="flex items-center gap-10 text-[16px]">
                            <div className="flex items-center gap-1.5"><span className="font-bold text-slate-900">{posts.length}</span> <span className="text-slate-700">posts</span></div>
                            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70"><span className="font-bold text-slate-900">{profile?.followers_count || 0}</span> <span className="text-slate-700">followers</span></div>
                            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-70"><span className="font-bold text-slate-900">{profile?.following_count || 0}</span> <span className="text-slate-700">following</span></div>
                        </div>

                        {/* Row 3: Bio */}
                        <div className="flex flex-col items-start space-y-1">
                            <span className="text-base font-bold text-slate-900">{profile?.full_name || profile?.username}</span>
                            <p className="text-base text-slate-700 font-medium leading-relaxed max-w-sm">
                                {profile?.bio || 'No bio yet'}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Highlights (Common for both) */}
                <div className="flex items-center gap-6 md:gap-10 mb-2 overflow-x-auto no-scrollbar py-0 md:pl-8">
                    {isOwnProfile && (
                        <div
                            onClick={() => navigate('/dashboard/manage-highlights')}
                            className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
                        >
                            <div className="w-16 h-16 md:w-[77px] md:h-[77px] rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors">
                                <Plus className="w-8 h-8 md:w-10 md:h-10 text-slate-300 group-hover:text-slate-400" />
                            </div>
                            <span className="text-[11px] md:text-xs font-bold text-slate-900">New</span>
                        </div>
                    )}
                </div>

                {/* ── Tabbed Content Navigation (Instagram Centered Icons) ── */}
                <div className="border-b border-slate-100 md:border-slate-200 flex justify-center gap-20 md:gap-16">
                    {([
                        { id: 'posts', icon: <Grid className="w-4 h-4 md:w-3.5 md:h-3.5" />, label: 'POSTS' },
                        { id: 'reels', icon: <Film className="w-4 h-4 md:w-3.5 md:h-3.5" />, label: 'REELS' },
                        { id: 'thoughts', icon: <MessageSquare className="w-4 h-4 md:w-3.5 md:h-3.5" />, label: 'THOUGHTS' }
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 md:py-3.5 transition-all relative ${activeTab === tab.id
                                ? 'text-slate-900'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.icon}
                            <span className={`hidden md:inline text-[12px] font-bold tracking-[1px] uppercase`}>{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-slate-900"
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="pt-2 md:pt-8 min-h-[400px]">
                    {activeTab === 'posts' && (
                        posts.filter(p => p.media_url).length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2 md:gap-7 pb-10">
                                {posts.filter(p => p.media_url).map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedPost(item)}
                                        className="aspect-square bg-slate-100 relative group cursor-pointer overflow-hidden md:rounded-xs shadow-sm hover:opacity-90 transition-all"
                                    >
                                        <img
                                            src={getMediaUrl(item.media_url, FALLBACKS.POST)}
                                            className="w-full h-full object-cover"
                                            alt=""
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                                            <div className="flex items-center gap-1.5"><Heart className="w-5 h-5 fill-white" /> {item.likes_count || 0}</div>
                                            <div className="flex items-center gap-1.5"><MessageCircle className="w-5 h-5 fill-white" /> {item.comments_count || 0}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState tab="posts" />
                        )
                    )}
                    {activeTab === 'reels' && (
                        reelsLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCw className="w-8 h-8 text-[#FF006E] animate-spin" />
                            </div>
                        ) : reels.length > 0 ? (
                            <div className="grid grid-cols-3 gap-1 md:gap-7 pb-10">
                                {reels.map((reel) => (
                                    <div
                                        key={reel.id}
                                        onClick={() => setSelectedPost({ ...reel, media_url: reel.video_url, media_type: 'video' })}
                                        className="aspect-[9/16] bg-black relative group cursor-pointer overflow-hidden shadow-sm hover:opacity-90 transition-all"
                                    >
                                        <video
                                            src={getMediaUrl(reel.video_url, '')}
                                            className="w-full h-full object-cover"
                                            muted
                                            playsInline
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold">
                                            <div className="flex items-center gap-1.5"><Play className="w-6 h-6 fill-white" /> {reel.likes_count || 0}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState tab="reels" />
                        )
                    )}
                    {activeTab === 'thoughts' && (
                        posts.filter(p => !p.media_url).length > 0 ? (
                            <div className="flex flex-col gap-4 pb-10 max-w-2xl mx-auto">
                                {posts.filter(p => !p.media_url).map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedPost(item)}
                                        className="bg-white border border-pink-100/50 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden border border-pink-100">
                                                    <img
                                                        src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">{profile?.username}</span>
                                                    {profile?.is_verified && (
                                                        <CheckCircle2 className="w-4 h-4 text-[#FF006E] fill-[#FF006E]/10" />
                                                    )}
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-400 text-sm font-medium">1d</span>
                                                </div>
                                            </div>
                                            <button className="text-slate-300 group-hover:text-slate-400 transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="mb-6">
                                            <p className="text-[17px] md:text-xl text-slate-800 font-medium leading-relaxed">
                                                {item.body_text || item.content}
                                            </p>
                                        </div>

                                        {/* Interactions */}
                                        <div className="flex items-center gap-6 text-slate-400">
                                            <button className="flex items-center gap-2 hover:text-[#FF006E] transition-colors group/icon">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover/icon:bg-pink-50 transition-colors">
                                                    <Heart className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold">{item.likes_count || '0'}</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-blue-500 transition-colors group/icon">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover/icon:bg-blue-50 transition-colors">
                                                    <MessageCircle className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-bold">{item.comments_count || '0'}</span>
                                            </button>
                                            <button className="flex items-center gap-2 hover:text-green-500 transition-colors group/icon">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover/icon:bg-green-50 transition-colors">
                                                    <Share2 className="w-5 h-5" />
                                                </div>
                                            </button>
                                            <div className="flex-1" />
                                            <button className="hover:text-slate-600 transition-colors group/icon">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover/icon:bg-slate-50 transition-colors">
                                                    <Bookmark className="w-5 h-5" />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState tab="thoughts" />
                        )
                    )}
                </div>
            </div>

            {/* Modals */}
            {isEditModalOpen && profile && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    initialData={{
                        full_name: profile.full_name || '',
                        username: profile.username || '',
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url || ''
                    }}
                    onUpdate={fetchProfileData}
                />
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                shareUrl={window.location.href}
                title={`Check out @${profile?.username} on Locolive`}
            />

            <AnimatePresence>
                {selectedPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                        onClick={() => setSelectedPost(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-lg relative"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute -top-10 right-0 p-2 text-white/70 hover:text-white"
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
