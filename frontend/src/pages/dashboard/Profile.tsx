import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Bell,
    MessageCircle,
    UserPlus,
    Navigation,
    Camera,
    Settings,
    LogOut
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
    const [connections, setConnections] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'connections' | 'posts' | 'reels'>('connections');
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

            // Fetch other data in parallel
            const [postsRes, connRes, highlightsRes, reelsRes, myConnsRes, mySentRes] = await Promise.all([
                api.get(isOwnProfile ? '/posts/me' : `/users/${userId}/posts`).catch(() => ({ data: { posts: [] } })),
                api.get(isOwnProfile ? '/connections' : `/users/${userId}/connections`).catch(() => ({ data: [] })),
                api.get(isOwnProfile ? '/highlights/me' : `/users/${userId}/highlights`).catch(() => ({ data: [] })),
                api.get(`/users/${userId}/reels`).catch(() => ({ data: [] })),
                api.get('/connections').catch(() => ({ data: [] })),
                api.get('/connections/sent').catch(() => ({ data: [] }))
            ]);

            setPosts(postsRes.data.posts || []);
            setConnections(connRes.data || []);
            setHighlights(highlightsRes.data || []);
            setReels(reelsRes.data?.reels || reelsRes.data || []);

            if (!isOwnProfile) {
                const myConns = myConnsRes.data || [];
                const mySent = mySentRes.data || [];
                const isConn = myConns.some((c: any) => c.id === userId || c.user_id === userId || c.target_id === userId || c.requester_id === userId);
                const isPending = mySent.some((c: any) => c.target_id === userId || c.user_id === userId);
                
                if (isConn) setFollowStatus('accepted');
                else if (isPending) setFollowStatus('pending');
                else setFollowStatus('none');
            }
            
        } catch (error) {
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
            <div className="flex flex-col items-center justify-center min-h-[600px] h-full bg-slate-50 dark:bg-bg-base">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto no-scrollbar scroll-smooth bg-slate-50 dark:bg-bg-base/90 text-slate-800 dark:text-slate-100 font-body transition-colors">
            <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pt-4 pb-24 space-y-8">
                
                {/* 1. Dashboard Top Header (Desktop mostly, or unified) */}
                <header className="hidden md:flex items-center justify-between pb-2 border-b border-slate-200/50 dark:border-white/5">
                    <h1 className="text-2xl font-black tracking-tight text-pink-500">Profile</h1>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search discoveries..."
                                className="pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-medium w-[280px] focus:outline-none focus:ring-2 focus:ring-pink-500/20 shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={() => navigate('/dashboard/notifications')}
                            className="relative p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-500 hover:text-pink-500 transition-colors shadow-sm cursor-pointer"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border border-white" />
                        </button>
                        <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer shadow-sm">
                            <img src={getMediaUrl(user?.avatar_url, FALLBACKS.AVATAR(user?.username))} className="w-full h-full object-cover" alt="" />
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* Left Column (Main Card + Tabs + Content) */}
                    <div className="flex-1 space-y-8">
                        
                        {/* 2. Main Profile Card (Neumorphic) */}
                        <div className="bg-white dark:bg-bg-card rounded-[40px] p-8 md:p-10 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-white/5 relative overflow-hidden">
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-400/10 dark:bg-pink-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
                            
                            <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-8 relative z-10">
                                
                                {/* Avatar */}
                                <div className="relative shrink-0 cursor-pointer" onClick={() => isOwnProfile && setIsEditModalOpen(true)}>
                                    <div className="w-32 h-32 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-pink-500 to-fuchsia-400 shadow-[0_10px_25px_rgba(236,72,153,0.3)]">
                                        <div className="w-full h-full rounded-full border-4 border-white dark:border-bg-card bg-slate-100 overflow-hidden relative group">
                                            <img 
                                                src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))} 
                                                className="w-full h-full object-cover" 
                                                alt="" 
                                            />
                                            {isOwnProfile && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Camera className="w-8 h-8 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isUserOnline(profile?.last_active_at) && (
                                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-400 border-4 border-white dark:border-bg-card rounded-full shadow-sm" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-4 md:mt-2">
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight text-text-base flex items-center justify-center md:justify-start gap-2">
                                            {profile?.full_name}
                                            {isOwnProfile && <span className="text-pink-500 flex items-center"><Settings className="w-4 h-4 hover:rotate-90 transition-transform cursor-pointer" onClick={() => navigate('/dashboard/settings')} /></span>}
                                        </h2>
                                        <p className="text-pink-500 font-bold text-sm tracking-wide mt-1 uppercase">@{profile?.username}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5" /> Locolive Member</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                        <span>ID: {profile?.id.split('-')[0].toUpperCase()}</span>
                                    </div>

                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-md leading-relaxed border-l-2 border-pink-200 dark:border-pink-500/30 pl-4 py-1 italic">
                                        "{profile?.bio || "Hi! I'm using Locolive to discover amazing moments and cross paths with interesting people. Let's connect!"}"
                                    </p>
                                </div>

                                {/* Actions & Stats Desktop */}
                                <div className="hidden lg:flex flex-col items-end gap-6 min-w-[200px] mt-2">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={isOwnProfile ? () => setIsEditModalOpen(true) : handleFollow}
                                            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black uppercase text-[11px] tracking-widest rounded-full shadow-[0_8px_20px_rgba(236,72,153,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            {isOwnProfile ? 'Edit Profile' : (
                                                followStatus === 'accepted' ? 'Following' : 
                                                followStatus === 'pending' ? 'Requested' : 
                                                'Follow Friend'
                                            )}
                                        </button>
                                        {!isOwnProfile && (
                                            <button onClick={() => navigate('/dashboard/messages/' + userId)} className="w-12 h-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10 shadow-sm transition-all cursor-pointer">
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Row (Bottom of Card) */}
                            <div className="mt-8 flex items-center justify-center md:justify-start gap-8 md:ml-[168px] pt-6 border-t border-slate-100 dark:border-white/5">
                                <div className="text-center md:text-left">
                                    <p className="text-xl md:text-2xl font-black text-text-base">{profile?.connection_count || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connections</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xl md:text-2xl font-black text-text-base">{profile?.crossings_count || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crossings</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xl md:text-2xl font-black text-text-base">{profile?.post_count || 0}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posts</p>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Actions (Visible only on small screens) */}
                        <div className="flex lg:hidden items-center justify-center gap-3">
                            <button 
                                onClick={isOwnProfile ? () => setIsEditModalOpen(true) : handleFollow}
                                className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black uppercase text-[11px] tracking-widest rounded-full shadow-[0_8px_20px_rgba(236,72,153,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <UserPlus className="w-4 h-4" />
                                {isOwnProfile ? 'Edit Profile' : (
                                    followStatus === 'accepted' ? 'Following' : 
                                    followStatus === 'pending' ? 'Requested' : 
                                    'Follow Friend'
                                )}
                            </button>
                            {!isOwnProfile && (
                                <button onClick={() => navigate('/dashboard/messages/' + userId)} className="w-14 h-14 shrink-0 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-pink-500 shadow-sm">
                                    <MessageCircle className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        {(isOwnProfile || highlights.length > 0) && (
                            <div className="bg-white dark:bg-bg-card rounded-[28px] p-2 md:px-6 shadow-sm border border-slate-100 dark:border-white/5">
                                <HighlightsComponent 
                                    highlights={highlights} 
                                    isOwnProfile={isOwnProfile} 
                                    onAdd={() => navigate('/dashboard/manage-highlights')} 
                                    onView={handleViewHighlight}
                                />
                            </div>
                        )}

                        {/* 3. Dashboard Tabs */}
                        <div className="bg-white dark:bg-bg-card rounded-[28px] p-2 md:px-6 md:py-3 shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 overflow-x-auto no-scrollbar">
                            {(['connections', 'posts', 'reels'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "relative px-6 py-3 text-sm font-black capitalize tracking-wide transition-colors whitespace-nowrap cursor-pointer",
                                        activeTab === tab ? "text-pink-600 dark:text-pink-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                >
                                    {tab}
                                    {activeTab === tab && (
                                        <motion.div 
                                            layoutId="activeTabProfile" 
                                            className="absolute bottom-1 left-4 right-4 h-1 bg-pink-500 rounded-full"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* 4. Tab Content Area */}
                        <div className="pt-2 min-h-[400px]">
                            <AnimatePresence mode="wait">
                                
                                {activeTab === 'connections' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    >
                                        {connections.length > 0 ? (
                                            connections.map(conn => (
                                                <div key={conn.id} onClick={() => navigate(`/dashboard/user/${conn.id}`)} className="bg-white dark:bg-bg-card p-4 rounded-3xl flex items-center gap-4 border border-slate-100 dark:border-white/5 shadow-[0_5px_15px_-5px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all cursor-pointer">
                                                    <img src={getMediaUrl(conn.avatar_url, FALLBACKS.AVATAR(conn.username))} className="w-12 h-12 rounded-full object-cover shrink-0 bg-slate-100" alt="" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-black text-text-base truncate">{conn.full_name}</h4>
                                                        <p className="text-[11px] font-bold text-slate-400 truncate">{conn.interests?.[0] || 'Member'}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No connections yet</div>
                                        )}
                                        {/* See All Placeholder */}
                                        {connections.length > 0 && (
                                            <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 p-4 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                                                <span className="text-[11px] font-black text-pink-500 uppercase tracking-widest">View All</span>
                                            </div>
                                        )}
                                    </motion.div>
                                )}



                                {activeTab === 'posts' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <h3 className="text-xl font-black text-text-base tracking-tight">Recent Posts</h3>
                                        {posts.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[450px]">
                                                {/* Large Featured Card */}
                                                <div className="relative rounded-[32px] overflow-hidden group cursor-pointer h-[450px] md:h-full">
                                                    <img src={getMediaUrl(posts[0]?.media_url, FALLBACKS.POST)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Featured Discovery</span>
                                                        <h4 className="text-xl md:text-2xl font-black text-white">{posts[0]?.caption || 'A memorable moment'}</h4>
                                                    </div>
                                                </div>
                                                
                                                {/* Stacked Small Cards */}
                                                {posts.length > 1 && (
                                                    <div className="grid grid-rows-2 gap-4 h-full hidden md:grid">
                                                        {posts.slice(1, 3).map((post, idx) => (
                                                            <div key={post.id} className="relative rounded-[32px] overflow-hidden group cursor-pointer h-full">
                                                                <img src={getMediaUrl(post.media_url, FALLBACKS.POST)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                                                    <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest mb-1">{post.location_name || 'Nearby'}</span>
                                                                    <h4 className="text-lg font-black text-white truncate">{post.caption || `Moment ${idx + 2}`}</h4>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px]">No posts shared yet</div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'reels' && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                        className="space-y-6"
                                    >
                                        <h3 className="text-xl font-black text-text-base tracking-tight">Recent Reels</h3>
                                        {reels.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {reels.map((reel: any) => (
                                                    <div key={reel.id} onClick={() => navigate('/dashboard/reels')} className="aspect-[9/16] bg-slate-100 dark:bg-white/5 rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm">
                                                        <video 
                                                            src={getMediaUrl(reel.media_url, '')} 
                                                            className="w-full h-full object-cover" 
                                                            autoPlay muted loop playsInline
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                            <div className="text-white font-black text-[10px] text-center line-clamp-2">{reel.caption || 'Reel'}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center text-slate-400 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[32px]">No reels shared yet</div>
                                        )}
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {isOwnProfile && (
                     <div className="flex justify-center pt-8 border-t border-slate-200 dark:border-white/5">
                        <button onClick={logout} className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer">
                            <LogOut className="w-4 h-4" /> Logout Complete
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

            {/* Story Viewer Layer */}
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
