import { type FC, useState, useEffect } from 'react';
import {
    Search,
    Bell,
    MessageCircle,
    Camera,
    Settings,
    LogOut,
    Home,
    Video,
    User
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/helpers';

import EditProfileModal from '../../components/profile/EditProfileModal';
import HighlightsComponent from '../../components/profile/Highlights';
import StoryViewer from '../../components/story/StoryViewer';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { isUserOnline } from '../../utils/presence';

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
}



interface ProfileProps {
    onLogout?: () => void;
}

export const Profile: FC<ProfileProps> = ({ onLogout }) => {
    const { logout: contextLogout } = useAuth();
    const logout = onLogout || contextLogout;
    const navigate = useNavigate();
    const { id: urlUserId } = useParams();
    const { user } = useAuth();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [reels, setReels] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [savedReels, setSavedReels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [viewingStories, setViewingStories] = useState<any[]>([]);

    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');

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
        try {
            const endpoint = isOwnProfile ? '/profile/me' : `/users/${userId}`;
            const { data } = await api.get(endpoint);
            setProfile(data);

            // Fetch posts - different endpoints for own profile vs viewing other user
            const postsEndpoint = isOwnProfile ? '/posts/me' : `/users/${userId}/posts`;
            const postsRes = await api.get(postsEndpoint).catch(() => ({ data: { posts: [] } }));

            // Fetch highlights - different endpoints for own profile vs viewing other user
            const highlightsEndpoint = isOwnProfile ? '/highlights/me' : `/users/${userId}/highlights`;
            const highlightsRes = await api.get(highlightsEndpoint).catch(() => ({ data: [] }));

            // Fetch reels - same endpoint for both, uses userId param
            const reelsRes = await api.get(`/users/${userId}/reels`).catch(() => ({ data: { reels: [] } }));

            // Fetch saved reels only for own profile
            let savedReels = [];
            if (isOwnProfile) {
                const savedRes = await api.get('/reels/saved').catch(() => ({ data: { reels: [] } }));
                savedReels = savedRes.data?.reels || savedRes.data || [];
            }

            // Fetch connection data only for viewing other profiles
            let followStatus: 'none' | 'pending' | 'accepted' = 'none';
            if (!isOwnProfile) {
                const [myConnsRes, mySentRes] = await Promise.all([
                    api.get('/connections').catch(() => ({ data: [] })),
                    api.get('/connections/sent').catch(() => ({ data: [] }))
                ]);

                const myConns = myConnsRes.data || [];
                const mySent = mySentRes.data || [];
                const isConn = myConns.some((c: any) => c.id === userId || c.user_id === userId || c.target_id === userId || c.requester_id === userId);
                const isPending = mySent.some((c: any) => c.target_id === userId || c.user_id === userId);

                if (isConn) followStatus = 'accepted';
                else if (isPending) followStatus = 'pending';
                else followStatus = 'none';
                
                setFollowStatus(followStatus);
            }

            // Update state with all fetched data
            setPosts(postsRes.data?.posts || []);
            setHighlights(highlightsRes.data || []);
            setReels(reelsRes.data?.reels || reelsRes.data || []);
            setSavedReels(savedReels);

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

    const handleViewHighlight = async (highlightId: string) => {
        try {
            const res = await api.get(`/highlights/${highlightId}`);
            const stories = Array.isArray(res.data) ? res.data : (res.data?.stories || res.data?.archives || []);
            if (stories.length > 0) {
                setViewingStories(stories);
            } else {
                toast.error('This highlight is empty.');
            }
        } catch (err) {
            console.error('Failed to view highlight:', err);
            toast.error('Failed to load highlight');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-150 h-full bg-slate-50 dark:bg-bg-base">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto no-scrollbar scroll-smooth bg-[#FFFBFC] text-slate-800 font-body transition-colors">
            <div className="max-w-250 mx-auto px-4 pt-8 pb-32">

                {/* Main Profile Card */}
                <div className="pastel-card p-12 relative overflow-hidden mb-8">
                    {/* Top Right Actions */}
                    <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
                        <button className="px-5 py-2 bg-[#ffcfe0] text-black font-bold text-xs rounded-xl hover:bg-slate-100 transition-all shadow-sm cursor-pointer border border-slate-200/50">
                            Share Profile
                        </button>
                        <Settings className="w-6 h-6 text-slate-400 cursor-pointer hover:rotate-90 hover:text-slate-600 transition-all" onClick={() => navigate('/dashboard/settings')} />
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        {/* Avatar Header */}
                        <div className="relative shrink-0">
                            <div className="w-30 h-30 rounded-full instagram-ring shadow-soft cursor-pointer hover:scale-105 transition-all" onClick={() => isOwnProfile && setIsEditModalOpen(true)}>
                                <div className="w-full h-full rounded-full border-[6px] border-white overflow-hidden relative group bg-white">
                                    <img
                                        src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))}
                                        className="w-full h-full object-cover"
                                        alt=""
                                    />
                                    {isOwnProfile && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="w-8 h-8 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isUserOnline(profile?.last_active_at) && (
                                <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-400 border-[5px] border-white rounded-full shadow-sm" />
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 space-y-6">
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                                    {profile?.username}
                                    {isOwnProfile && <span className="bg-pink-400 rounded-full p-1 text-white"><Search className="w-3 h-3" /></span>}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={isOwnProfile ? () => setIsEditModalOpen(true) : handleFollow}
                                        className="px-8 py-2.5 bg-[#ffcfe0] text-slate-800 font-bold text-sm rounded-xl hover:bg-blue-600 transition-all shadow-sm cursor-pointer"
                                    >
                                        {isOwnProfile ? 'Edit Profile' : (
                                            followStatus === 'accepted' ? 'Following' :
                                                followStatus === 'pending' ? 'Requested' :
                                                    'Follow'
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-10">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-bold">{profile?.post_count || 0}</span>
                                    <span className="text-slate-500 text-sm">posts</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-bold">{profile?.connection_count || 0}</span>
                                    <span className="text-slate-500 text-sm">followers</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-bold">{Math.floor((profile?.connection_count || 0) * 0.8)}</span>
                                    <span className="text-slate-500 text-sm">following</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="font-bold text-slate-900">{profile?.full_name}</p>

                                <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
                                    {profile?.bio || "Hi! I'm using Locolive to discover amazing moments and cross paths with interesting people. Let's connect! ✨"}
                                </p>

                            </div>
                        </div>
                    </div>
                </div>

                {/* Highlights Section */}
                {(highlights.length > 0 || isOwnProfile) && (
                    <div className="mb-12">
                        <HighlightsComponent
                            highlights={highlights}
                            isOwnProfile={isOwnProfile}
                            onAdd={() => navigate('/dashboard/manage-highlights')}
                            onView={handleViewHighlight}
                        />
                    </div>
                )}

                {/* Content Tabs */}
                <div className="border-t border-pastel flex justify-center gap-12 mb-8">
                    {(['posts', 'reels', 'saved', 'tagged'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex items-center gap-2 pt-4 pb-4 border-t-2 transition-all cursor-pointer uppercase text-xs font-bold tracking-widest",
                                activeTab === tab
                                    ? "border-slate-900 text-slate-900"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {tab === 'posts' && <Home className="w-3 h-3" />}
                            {tab === 'reels' && <Video className="w-3 h-3" />}
                            {tab === 'saved' && <Bell className="w-3 h-3" />}
                            {tab === 'tagged' && <User className="w-3 h-3" />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="grid grid-cols-3 gap-1 md:gap-4">
                    {activeTab === 'posts' ? (
                        posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="aspect-square bg-slate-100 rounded-lg overflow-hidden group cursor-pointer relative shadow-sm hover:shadow-md transition-all">
                                    <img
                                        src={getMediaUrl(post.media_url, FALLBACKS.POST)}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        alt=""
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-4 font-bold">
                                        <div className="flex items-center gap-1"><Bell className="w-5 h-5 fill-white" /> 12</div>
                                        <div className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-white" /> 4</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border border-dashed border-pastel rounded-3xl">No posts yet</div>
                        )
                    ) : activeTab === 'reels' ? (
                        reels.length > 0 ? (
                            reels.map((reel: any) => (
                                <div key={reel.id} onClick={() => navigate('/dashboard/reels')} className="aspect-9/16 bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer shadow-sm">
                                    <video
                                        src={getMediaUrl(reel.media_url, '')}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                        <Video className="w-8 h-8" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border border-dashed border-pastel rounded-3xl">No reels yet</div>
                        )
                    ) : activeTab === 'saved' ? (
                        savedReels.length > 0 ? (
                            savedReels.map((reel: any) => (
                                <div key={reel.id} onClick={() => navigate('/dashboard/reels')} className="aspect-9/16 bg-slate-100 rounded-lg overflow-hidden relative group cursor-pointer shadow-sm">
                                    <video
                                        src={getMediaUrl(reel.video_url, '')}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                        <Video className="w-8 h-8" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border border-dashed border-pastel rounded-3xl">No saved items yet</div>
                        )
                    ) : (
                        <div className="col-span-full py-24 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border border-dashed border-pastel rounded-3xl">{activeTab} section placeholder</div>
                    )}
                </div>

                {isOwnProfile && (
                    <div className="flex justify-center pt-12 mt-12 border-t border-pastel">
                        <button onClick={logout} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer">
                            <LogOut className="w-4 h-4" /> Logout Account
                        </button>
                    </div>
                )}
            </div>

            {profile && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    initialData={{
                        full_name: profile.full_name,
                        username: profile.username,
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url
                    }}
                    onUpdate={() => {
                        fetchProfileData();
                        setIsEditModalOpen(false);
                    }}
                />
            )}

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
        </div>
    );
};

export default Profile;
