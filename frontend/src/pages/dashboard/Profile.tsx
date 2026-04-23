import { type FC, useState, useEffect } from 'react';
import {
    Camera,
    Settings,
    Video,
    User,
    Bookmark,
    Grid,
    Plus,
    CheckCircle2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/helpers';

import EditProfileModal from '../../components/profile/EditProfileModal';
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
    const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [viewingStories, setViewingStories] = useState<any[]>([]);

    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');

    const userId = urlUserId || user?.id;
    const isOwnProfile = userId === user?.id;

    // Mock Highlights for UI matching if no real highlights
    const mockHighlights = [
        { id: 'm1', title: 'Travel', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop' },
        { id: 'm2', title: 'Sunsets', img: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&h=300&fit=crop' },
        { id: 'm3', title: 'Food', img: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=300&h=300&fit=crop' },
        { id: 'm4', title: 'Coffee', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop' },
        { id: 'm5', title: 'Nature', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=300&fit=crop' },
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
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const currentTabItems = activeTab === 'posts' ? posts : 
                          activeTab === 'reels' ? reels : 
                          activeTab === 'saved' ? savedReels : [];

    return (
        <div className="h-full overflow-y-auto no-scrollbar scroll-smooth bg-[#fcf5f8] text-text-base p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-[48px] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] overflow-hidden min-h-full flex flex-col pb-20">
                
                {/* ── Profile Header ── */}
                <div className="px-8 md:px-16 pt-16 pb-12 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
                    {/* Avatar with Story Ring */}
                    <div className="relative shrink-0">
                        <div 
                          className="w-44 h-44 md:w-56 md:h-56 rounded-full p-1.5 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-xl cursor-pointer hover:scale-[1.02] transition-all"
                          onClick={() => isOwnProfile && setIsEditModalOpen(true)}
                        >
                            <div className="w-full h-full rounded-full border-[6px] border-white overflow-hidden bg-bg-base relative">
                                <img
                                    src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))}
                                    className="w-full h-full object-cover"
                                    alt=""
                                />
                                {isOwnProfile && (
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {isUserOnline(profile?.last_active_at) && (
                            <div className="absolute bottom-5 right-5 w-8 h-8 bg-[#10b981] border-[6px] border-white rounded-full shadow-lg" />
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                            <h2 className="text-[32px] md:text-[40px] font-black tracking-tight text-text-base italic flex items-center gap-3 leading-none">
                                {profile?.username}
                                <CheckCircle2 className="w-7 h-7 text-primary fill-primary/10" strokeWidth={2.5} />
                            </h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={isOwnProfile ? () => setIsEditModalOpen(true) : handleFollow}
                                    className="px-6 py-2.5 bg-bg-base border border-border-base rounded-2xl text-[13px] font-black uppercase tracking-wider hover:bg-bg-sidebar transition-all shadow-sm cursor-pointer"
                                >
                                    {isOwnProfile ? 'Edit Profile' : (
                                        followStatus === 'accepted' ? 'Following' :
                                            followStatus === 'pending' ? 'Requested' :
                                                'Follow'
                                    )}
                                </button>
                                <button className="px-6 py-2.5 bg-[#ff006e]/10 text-primary border border-primary/20 rounded-2xl text-[13px] font-black uppercase tracking-wider hover:bg-primary/20 transition-all shadow-sm cursor-pointer">
                                    Share Profile
                                </button>
                                <button 
                                  onClick={() => navigate('/dashboard/settings')}
                                  className="p-2.5 bg-bg-base border border-border-base rounded-2xl hover:bg-bg-sidebar transition-all cursor-pointer"
                                >
                                    <Settings className="w-5 h-5 text-text-muted" />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-12 mb-8">
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-2xl font-black italic leading-none">{profile?.post_count || 0}</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted mt-1">posts</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-2xl font-black italic leading-none">{profile?.connection_count || 0}</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted mt-1">followers</span>
                            </div>
                            <div className="flex flex-col items-center md:items-start">
                                <span className="text-2xl font-black italic leading-none">{Math.floor((profile?.connection_count || 0) * 0.8)}</span>
                                <span className="text-[11px] font-black uppercase tracking-widest text-text-muted mt-1">following</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[18px] font-black text-text-base italic mb-1">{profile?.full_name}</p>
                            <p className="text-[14px] text-text-muted font-bold leading-relaxed max-w-md">
                                {profile?.bio || "Life is all about love ❤️"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Highlights Section ── */}
                <div className="px-8 md:px-16 pb-12 border-b border-border-base/50">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar pb-4">
                        {isOwnProfile && (
                            <div className="flex flex-col items-center gap-3 shrink-0">
                                <button 
                                  onClick={() => navigate('/dashboard/manage-highlights')}
                                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-border-base flex items-center justify-center hover:border-primary transition-colors group cursor-pointer"
                                >
                                    <Plus className="w-8 h-8 text-text-muted group-hover:text-primary transition-colors" />
                                </button>
                                <span className="text-[11px] font-black text-text-muted uppercase tracking-wider">New</span>
                            </div>
                        )}
                        {(highlights.length > 0 ? highlights : mockHighlights).map((h: any) => (
                            <div key={h.id} className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 border-2 border-border-base group-hover:border-primary transition-all overflow-hidden">
                                    <img 
                                      src={h.img || getMediaUrl(h.cover_url, FALLBACKS.POST)} 
                                      className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                      alt="" 
                                    />
                                </div>
                                <span className="text-[11px] font-black text-text-muted uppercase tracking-wider group-hover:text-text-base transition-colors">{h.title}</span>
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
                                "flex items-center gap-2 px-8 py-5 transition-all cursor-pointer border-b-2 -mb-[1px]",
                                activeTab === tab
                                    ? "border-primary text-primary"
                                    : "border-transparent text-text-muted hover:text-text-base"
                            )}
                        >
                            {tab === 'posts' && <Grid className="w-4 h-4" />}
                            {tab === 'reels' && <Video className="w-4 h-4" />}
                            {tab === 'saved' && <Bookmark className="w-4 h-4" />}
                            {tab === 'tagged' && <User className="w-4 h-4" />}
                            <span className="text-[11px] font-black uppercase tracking-[2px]">{tab}</span>
                        </button>
                    ))}
                </div>

                {/* ── Content Area ── */}
                <div className="flex-1 p-8">
                    {currentTabItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-24 h-24 bg-bg-base rounded-full flex items-center justify-center mb-6 shadow-sm">
                                {activeTab === 'posts' ? <Camera className="w-10 h-10 text-text-muted/50" /> : 
                                 activeTab === 'reels' ? <Video className="w-10 h-10 text-text-muted/50" /> : 
                                 <Bookmark className="w-10 h-10 text-text-muted/50" />}
                            </div>
                            <h3 className="text-2xl font-black italic text-text-base mb-2">No {activeTab} yet</h3>
                            <p className="text-[13px] text-text-muted font-bold mb-8 max-w-[240px]">
                                {activeTab === 'posts' ? 'Share your moments with the world and start your journey.' : 
                                 activeTab === 'reels' ? 'Create fun videos and share them with your friends.' : 
                                 'Your saved items will appear here once you bookmark them.'}
                            </p>
                            {isOwnProfile && activeTab !== 'tagged' && (
                                <button 
                                  onClick={() => navigate('/dashboard/home')}
                                  className="px-8 py-3 bg-brand-gradient text-white font-black uppercase tracking-widest text-[12px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all cursor-pointer"
                                >
                                    <Plus className="inline-block w-4 h-4 mr-2 -mt-0.5" />
                                    Create {activeTab === 'posts' ? 'Post' : 'Reel'}
                                </button>
                            )}
                        </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 md:gap-2">
                        {currentTabItems.map((item) => (
                            <div key={item.id} className="aspect-square bg-bg-base rounded-lg overflow-hidden group cursor-pointer relative shadow-sm hover:shadow-md transition-all">
                                <img
                                    src={getMediaUrl(item.media_url || item.video_url, FALLBACKS.POST)}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt=""
                                />
                                {activeTab === 'reels' && (
                                    <div className="absolute top-2 right-2">
                                        <Video className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </div>
                        ))}
                      </div>
                    )}
                </div>
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
