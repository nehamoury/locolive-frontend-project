import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings,
    LogOut,
    Share2,
    Ghost,
    LayoutGrid,
    Navigation,
    AlertTriangle,
    Sparkles,
    Users as UsersIcon,
    History,
    Camera
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/helpers';

import ProfileQR from '../../components/profile/ProfileQR';
import Highlights from '../../components/profile/Highlights';
import EditProfileModal from '../../components/profile/EditProfileModal';
import { getMediaUrl, FALLBACKS } from '../../utils/media';


interface ProfileData {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    bio: string;
    banner_url: string;
    is_ghost_mode: boolean;
    is_premium: boolean;
    story_count: number;
    post_count: number;
    reels_count: number;
    connection_count: number;
    followers_count: number;
    following_count: number;
    views_count: number;
    crossings_count: number;
    visibility_status: 'active' | 'ghost' | 'hidden';
    interests: string[];
    links: Array<{ label: string; url: string }>;
    DistanceKm?: number;
}

interface Highlight {
    id: string;
    title: string;
    cover_url: string;
}

interface Visitor {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    viewed_at: string;
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
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'timeline' | 'moments' | 'reels' | 'connections'>('moments');
    const [showPanicConfirm, setShowPanicConfirm] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Use URL user ID if provided, otherwise use current user's ID
    const userId = urlUserId || user?.id;

    // Update URL if no user ID is provided
    useEffect(() => {
        if (!urlUserId && user?.id) {
            navigate(`/dashboard/profile/${user.id}`, { replace: true });
        }
    }, [urlUserId, user?.id, navigate]);

    useEffect(() => {
        fetchProfile();
        fetchVisitors();
        fetchMyPosts();
        fetchHighlights();
        fetchConnections();
    }, [userId]);

    const fetchProfile = async () => {
        if (!userId) return;
        try {
            // If it's the current user, use /profile/me, otherwise use /users/:id
            const endpoint = userId === user?.id ? '/profile/me' : `/users/${userId}`;
            const { data } = await api.get(endpoint);
            setProfile(data);
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchVisitors = async () => {
        try {
            const { data } = await api.get('/profile/visitors');
            setVisitors(data);
        } catch (error) {
            console.error('Failed to load visitors', error);
        }
    };

    const fetchMyPosts = async () => {
        try {
            const { data } = await api.get('/posts/me');
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Failed to load posts', error);
        }
    };

    const fetchConnections = async () => {
        try {
            const { data } = await api.get('/connections');
            setConnections(data || []);
        } catch (error) {
            console.error('Failed to load connections', error);
        }
    };

    const fetchHighlights = async () => {
        try {
            const { data } = await api.get('/highlights/me');
            setHighlights(data || []);
        } catch (error) {
            console.error('Failed to load highlights', error);
        }
    };

    const handleToggleGhost = async (duration?: '1h' | '3h' | 'tomorrow') => {
        try {
            let durationMinutes = 0;
            if (duration === '1h') durationMinutes = 60;
            if (duration === '3h') durationMinutes = 180;
            if (duration === 'tomorrow') {
                const now = new Date();
                const tomorrow = new Date();
                tomorrow.setHours(23, 59, 59, 999);
                durationMinutes = Math.floor((tomorrow.getTime() - now.getTime()) / 60000);
            }

            const { data } = await api.put('/location/ghost-mode', { 
                enabled: !profile?.is_ghost_mode,
                duration: durationMinutes
            });
            
            setProfile(prev => prev ? { 
                ...prev, 
                is_ghost_mode: data.is_ghost_mode,
                visibility_status: data.is_ghost_mode ? 'ghost' : 'active' 
            } : null);
            
            toast.success(data.is_ghost_mode ? 'Ghost Mode Active' : 'Ghost Mode Disabled');
        } catch (error) {
            toast.error('Failed to toggle Ghost Mode');
        }
    };

    const handlePanicScrub = async () => {
        const loadingToast = toast.loading('Initiating system scrub...');
        try {
            await api.post('/location/panic');
            toast.dismiss(loadingToast);
            toast.success('Privacy scrub complete. All location data removed.');
            setShowPanicConfirm(false);
            window.location.href = '/';
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Failed to execute scrub');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-bg-base">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Ghost className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-primary/60">Syncing Identity...</p>
            </div>
        );
    }

    return (
        <div className={cn(
            "h-full overflow-y-auto transition-all duration-700 no-scrollbar scroll-smooth pb-24",
            profile?.is_ghost_mode 
                ? "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-100/50 via-bg-base to-bg-base dark:from-fuchsia-950/20" 
                : "bg-bg-base"
        )}>
            <div className="max-w-[1200px] mx-auto px-4 md:px-8 pt-6 md:pt-10 space-y-6">
                
                {/* 1. Header Card */}
                <div className="bg-white/60 dark:bg-bg-card/40 backdrop-blur-3xl rounded-[32px] md:rounded-[40px] p-6 md:p-8 border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(200,100,200,0.1)] dark:shadow-none flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full">
                        <div 
                            className="relative group cursor-pointer shrink-0"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-[3px] bg-gradient-to-tr from-pink-400 to-fuchsia-300 shadow-lg shadow-pink-500/10">
                                <div className="w-full h-full rounded-full border-4 border-white dark:border-bg-card overflow-hidden bg-white relative">
                                     <img 
                                        src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))} 
                                        alt="avatar"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                     />
                                     <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-white scale-75 group-hover:scale-100 transition-transform duration-500" />
                                     </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 translate-x-1/2 right-1/2 md:translate-x-0 md:right-3 bg-white dark:bg-bg-card px-2.5 py-1 rounded-full border border-white/50 dark:border-white/10 flex items-center gap-1.5 shadow-sm z-10 transition-transform group-hover:scale-110">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52,211,153)] animate-pulse" />
                                <span className="text-[9px] font-black tracking-widest uppercase text-emerald-500">Live</span>
                            </div>
                        </div>

                        <div className="space-y-4 w-full max-w-lg">
                            <div>
                                <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-text-base tracking-tight">{profile?.full_name}</h1>
                                <p className="text-sm font-bold text-slate-500 dark:text-text-muted mt-0.5">@{profile?.username}</p>
                            </div>
                            <p className="text-sm font-medium text-slate-600 dark:text-text-base/80 leading-relaxed">
                                {profile?.bio || "Coffee enthusiast ☕ · Travel lover 🗺️ · Exploring..."}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-text-muted justify-center md:justify-start pt-1">
                                <Navigation className="w-3.5 h-3.5" /> 
                                Bangalore {profile?.DistanceKm !== undefined ? `• ${profile.DistanceKm.toFixed(1)}km away` : '• 1.2km away'}
                            </div>

                            <div className="flex md:hidden items-center justify-center gap-3 pt-2">
                                <button 
                                    onClick={() => handleToggleGhost()}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-full border transition-all text-xs font-black uppercase shadow-sm whitespace-nowrap",
                                        profile?.is_ghost_mode 
                                            ? "bg-fuchsia-500 text-white border-fuchsia-400" 
                                            : "bg-white/80 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-500"
                                    )}
                                >
                                    <Ghost className={cn("w-4 h-4", profile?.is_ghost_mode && "animate-pulse")} />
                                    Ghost Mode
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard/settings')}
                                    className="p-3 rounded-full bg-white dark:bg-white/5 border border-white/40 dark:border-white/10 text-slate-500 shadow-sm"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex flex-col items-center gap-3">
                        <button 
                            onClick={() => handleToggleGhost()}
                            className={cn(
                                "flex items-center gap-2 p-3 rounded-full border transition-all shadow-sm group relative",
                                profile?.is_ghost_mode 
                                    ? "bg-fuchsia-500 text-white border-fuchsia-400 shadow-fuchsia-500/20" 
                                    : "bg-white/80 dark:bg-white/5 border-white/40 dark:border-white/10 text-slate-500 hover:text-fuchsia-500"
                            )}
                            title={profile?.is_ghost_mode ? "Disable Ghost Mode" : "Enable Ghost Mode"}
                        >
                            <Ghost className={cn("w-5 h-5 transition-transform group-hover:scale-110", profile?.is_ghost_mode && "animate-pulse")} />
                            {profile?.is_ghost_mode && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white dark:border-bg-card" />
                            )}
                        </button>

                        <button 
                            onClick={() => navigate('/dashboard/settings')}
                            className="flex items-center gap-2 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 px-6 py-3 rounded-full border border-white/40 dark:border-white/10 text-xs md:text-sm font-black text-slate-700 dark:text-text-base transition-all shadow-sm"
                        >
                            <Settings className="w-4 h-4" /> Settings
                        </button>
                    </div>
                </div>

                {/* 2. Stats Bar */}
                <div className="bg-white/60 dark:bg-bg-card/40 backdrop-blur-3xl rounded-[32px] p-2 border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(200,100,200,0.1)] dark:shadow-none overflow-hidden">
                    <div className="flex flex-row items-center justify-between px-4 md:px-8 py-3 md:py-5 min-w-max md:min-w-0 gap-6 overflow-x-auto no-scrollbar scroll-smooth">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                <Ghost className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Profile Views</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-text-base leading-none">{profile?.views_count || 0}</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-white/10 shrink-0" />

                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink-100/50 dark:bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-200 dark:border-transparent">
                                <Navigation className="w-4 h-4 md:w-5 md:h-5 text-pink-500" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Path Crossings</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-text-base leading-none">{profile?.crossings_count || 0}</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-white/10 shrink-0" />

                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                <Ghost className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Connections</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-text-base leading-none">{profile?.connection_count || 0}</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-slate-200 dark:bg-white/10 shrink-0" />

                        <div className="flex items-center gap-4 group pr-4 md:pr-0">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Moments</p>
                                <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-text-base leading-none">{profile?.post_count || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2.5 Highlights Section */}
                <div className="bg-white/60 dark:bg-bg-card/40 backdrop-blur-3xl rounded-[32px] p-4 md:px-8 border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(200,100,200,0.1)] dark:shadow-none hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 dark:text-text-muted/40 uppercase tracking-[0.2em] italic">Curated Moments</span>
                        </div>
                    </div>
                    <Highlights 
                        highlights={highlights} 
                        isOwnProfile={true} 
                        onAdd={() => navigate('/dashboard/manage-highlights')}
                    />
                </div>

                {/* 3. Tabs Bar */}
                <div className="bg-white/60 dark:bg-bg-card/40 backdrop-blur-3xl rounded-full p-2.5 border border-white/40 dark:border-white/5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-gradient-right">
                        <button 
                            onClick={() => setActiveTab('moments')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm transition-all whitespace-nowrap active:scale-95",
                                activeTab === 'moments' 
                                    ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30" 
                                    : "text-slate-500 dark:text-text-muted hover:bg-white/80 dark:hover:bg-white/5"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" /> Posts
                        </button>
                        <button 
                            onClick={() => setActiveTab('reels')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm transition-all whitespace-nowrap active:scale-95",
                                activeTab === 'reels' 
                                    ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30" 
                                    : "text-slate-500 dark:text-text-muted hover:bg-white/80 dark:hover:bg-white/5"
                            )}
                        >
                            <Ghost className="w-4 h-4" /> Reels
                        </button>
                        <button 
                            onClick={() => setActiveTab('timeline')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm transition-all whitespace-nowrap active:scale-95",
                                activeTab === 'timeline' 
                                    ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30" 
                                    : "text-slate-500 dark:text-text-muted hover:bg-white/80 dark:hover:bg-white/5"
                            )}
                        >
                            <Navigation className="w-4 h-4" /> Crossings 
                            <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] ml-1",
                                activeTab === 'timeline' ? "bg-white/20 text-white" : "bg-pink-100 dark:bg-pink-500/20 text-pink-500"
                            )}>
                                {profile?.crossings_count || 0}
                            </span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('connections')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 md:py-3 rounded-full font-black text-xs md:text-sm transition-all whitespace-nowrap active:scale-95",
                                activeTab === 'connections' 
                                    ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/30" 
                                    : "text-slate-500 dark:text-text-muted hover:bg-white/80 dark:hover:bg-white/5"
                            )}
                        >
                            <Ghost className="w-4 h-4" /> Connections
                        </button>
                    </div>

                    <button 
                        onClick={() => setIsQRModalOpen(true)}
                        className="hidden md:flex shrink-0 items-center gap-2 px-6 py-3 rounded-full font-black text-sm text-slate-700 dark:text-text-base bg-white dark:bg-bg-card border border-slate-200 dark:border-white/10 hover:-translate-y-0.5 transition-all shadow-sm"
                    >
                        <Share2 className="w-4 h-4" /> Share
                    </button>
                </div>

                {/* 4. Main Split Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start pb-8">
                    {/* Left Posts Area */}
                    <div className="lg:col-span-3 bg-white/60 dark:bg-bg-card/40 backdrop-blur-3xl rounded-[32px] p-6 md:p-8 border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(200,100,200,0.1)] dark:shadow-none min-h-[600px]">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-text-base flex items-center gap-3">
                                {activeTab === 'moments' ? 'Gallery' : activeTab === 'reels' ? 'Reels' : activeTab === 'timeline' ? 'Crossings' : 'Connections'} 
                                <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest animate-pulse-slow">
                                    {activeTab === 'moments' ? posts.length : activeTab === 'reels' ? profile?.reels_count : activeTab === 'timeline' ? visitors.length : connections.length} Items
                                </div>
                            </h2>
                        </div>

                        {/* TAB CONTENT: BENTO GRID FOR POSTS */}
                        {activeTab === 'moments' && (
                            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[160px] xs:auto-rows-[200px]">
                                {posts.length > 0 ? (
                                    posts.map((post, index) => {
                                        const isFeatured = index % 5 === 0;
                                        return (
                                            <motion.div 
                                                key={post.id}
                                                whileHover={{ y: -5, scale: 1.02 }}
                                                className={cn(
                                                    "rounded-[28px] bg-slate-200 dark:bg-white/5 overflow-hidden group cursor-pointer relative border border-white/40 dark:border-white/5",
                                                    isFeatured ? "md:col-span-2 md:row-span-2" : "col-span-1 row-span-1"
                                                )}
                                            >
                                                {post.media_type === 'video' ? (
                                                    <video 
                                                        src={getMediaUrl(post.media_url, FALLBACKS.POST)}
                                                        className="w-full h-full object-cover"
                                                        muted loop autoPlay playsInline
                                                    />
                                                ) : (
                                                    <img 
                                                        src={getMediaUrl(post.media_url, FALLBACKS.POST)} 
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                        alt=""
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <div className="flex items-center gap-4 text-white font-black text-xs">
                                                        <span className="flex items-center gap-1"><span className="text-pink-400">❤</span> {post.likes_count || 0}</span>
                                                        <span className="flex items-center gap-1">💬 {post.comments_count || 0}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-24 text-center m-auto">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                            <LayoutGrid className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No moments captured yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: CROSSINGS DETAILED */}
                        {activeTab === 'timeline' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {visitors.length > 0 ? (
                                    visitors.map((visitor, idx) => (
                                        <motion.div 
                                            key={idx}
                                            whileHover={{ x: 5 }}
                                            className="bg-white/80 dark:bg-bg-card/60 p-5 rounded-[28px] border border-white/50 dark:border-white/5 flex items-center justify-between group cursor-pointer hover:shadow-xl hover:shadow-pink-500/5 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-400 to-purple-400 p-[2px]">
                                                    <div className="w-full h-full rounded-[14px] bg-white overflow-hidden">
                                                        <img 
                                                            src={getMediaUrl(visitor.avatar_url, FALLBACKS.AVATAR(visitor.username))} 
                                                            className="w-full h-full object-cover" 
                                                            alt=""
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 dark:text-text-base">@{visitor.username}</h4>
                                                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-0.5">Met you in the wild</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                                                            {idx === 0 ? 'Recently' : '2 hours ago'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-pink-500 transition-colors">
                                                <Navigation className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-24 text-center m-auto">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                            <History className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No path crossings recorded</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB CONTENT: CONNECTIONS DETAILED */}
                        {activeTab === 'connections' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {connections.length > 0 ? (
                                    connections.map((conn) => (
                                        <motion.div 
                                            key={conn.id}
                                            whileHover={{ y: -4 }}
                                            className="bg-white/80 dark:bg-bg-card/60 p-6 rounded-[32px] border border-white/50 dark:border-white/5 text-center flex flex-col items-center gap-4 group"
                                        >
                                            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-emerald-400 to-cyan-400 p-[2px] shadow-lg shadow-emerald-500/10">
                                                <div className="w-full h-full rounded-[26px] bg-white overflow-hidden">
                                                    <img 
                                                        src={getMediaUrl(conn.avatar_url, FALLBACKS.AVATAR(conn.username))} 
                                                        className="w-full h-full object-cover" 
                                                        alt=""
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 dark:text-text-base">@{conn.username}</h4>
                                                <p className="text-[11px] font-bold text-slate-400 mt-1">{conn.full_name}</p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full mt-2">
                                                <button className="flex-1 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 hover:text-primary transition-all">Chat</button>
                                                <button className="px-4 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase shadow-lg shadow-primary/20">View</button>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-full py-24 text-center m-auto">
                                        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[24px] flex items-center justify-center mx-auto mb-6">
                                            <UsersIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No active connections</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side Widget: Recently Crossed Paths */}
                    <div className="lg:col-span-1 bg-white/60 dark:bg-bg-card/40 backdrop-blur-3xl rounded-[32px] p-6 md:p-8 border border-white/40 dark:border-white/5 shadow-[0_8px_30px_rgb(200,100,200,0.1)] dark:shadow-none sticky top-8">
                        <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-text-base mb-6">Recently Crossed Paths</h2>
                        
                        <div className="space-y-4">
                            {visitors.length > 0 ? (
                                visitors.map((visitor, idx) => (
                                    <div key={idx} className="bg-white dark:bg-bg-card rounded-3xl p-5 border border-slate-100 dark:border-white/5 shadow-sm space-y-4 hover:-translate-y-1 transition-transform cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <img 
                                                    src={getMediaUrl(visitor.avatar_url, FALLBACKS.AVATAR(visitor.username))} 
                                                    className="w-12 h-12 rounded-[16px] bg-pink-100 shrink-0 object-cover" 
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 dark:text-text-base flex items-center gap-2">
                                                    {visitor.full_name || visitor.username}
                                                </p>
                                                <p className="text-xs font-bold text-slate-500 dark:text-text-muted mt-0.5">Crossed paths {idx === 0 ? 'just now' : 'an hour ago'}</p>
                                            </div>
                                        </div>
                                        <div className="text-[11px] font-bold text-slate-400 dark:text-text-muted pl-1 relative">
                                            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-slate-200 dark:bg-white/10 rounded-full" />
                                            <span className="ml-3">• {idx === 0 ? '150m' : '1.1km'} nearby</span> <br/>
                                            <span className="ml-3 font-medium mt-1 inline-block">{idx === 0 ? '4 minutes ago' : '1 hour ago'}</span>
                                        </div>
                                        <div className="w-full h-24 bg-slate-100 dark:bg-white/5 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/14/11554/7625.png')] bg-cover bg-center opacity-40 mix-blend-multiply dark:mix-blend-lighten dark:invert" />
                                            <div className="absolute inset-0 bg-pink-500/5" />
                                            <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2">
                                                <div className="w-8 h-8 bg-pink-500/20 rounded-full animate-ping absolute -inset-1" />
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500 drop-shadow-md relative z-10"><path d="M12 0c-4.198 0-8 3.403-8 7.602 0 4.198 3.469 9.21 8 16.398 4.531-7.188 8-12.2 8-16.398 0-4.199-3.801-7.602-8-7.602zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z"/></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-500 text-sm font-medium">No recent crossings</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. LOGOUT ACTION */}
                <div className="flex flex-wrap gap-3 justify-center pt-2 pb-12">
                    <button 
                        onClick={() => {
                            logout();
                            navigate('/');
                        }}
                        className="px-8 py-3 rounded-full bg-white/60 dark:bg-bg-card hover:bg-red-50 dark:hover:bg-red-500/10 border border-white/50 dark:border-white/5 hover:border-red-200 dark:hover:border-red-500/20 text-slate-500 dark:text-text-muted hover:text-red-500 transition-all flex items-center gap-2 text-xs font-black uppercase shadow-sm"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>

                <ProfileQR 
                    isOpen={isQRModalOpen} 
                    onClose={() => setIsQRModalOpen(false)}
                    username={profile?.username || ''}
                    profileUrl={`${window.location.origin}/profile/${profile?.username}`}
                />

                <AnimatePresence>
                    {showPanicConfirm && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowPanicConfirm(false)}
                                className="absolute inset-0 bg-slate-900/40 dark:bg-bg-base/80 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="relative w-full max-w-md bg-white dark:bg-bg-card p-8 md:p-12 rounded-[40px] border border-red-100 dark:border-red-500/30 text-center space-y-8 shadow-2xl"
                            >
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-100 dark:border-red-500/20">
                                    <AlertTriangle className="w-10 h-10 text-red-500" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-text-base tracking-tight">Nuclear Option?</h3>
                                    <p className="text-slate-500 dark:text-text-muted font-medium text-sm leading-relaxed">
                                        This will permanently delete your entire location history, past crossings, and active presence. This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 pt-4">
                                    <button 
                                        onClick={handlePanicScrub}
                                        className="w-full py-4 rounded-[20px] bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                                    >
                                        Confirm Destruction
                                    </button>
                                    <button 
                                        onClick={() => setShowPanicConfirm(false)}
                                        className="w-full py-4 rounded-[20px] bg-slate-50 dark:bg-bg-base hover:bg-slate-100 text-slate-500 dark:text-text-muted font-black uppercase tracking-widest text-xs transition-all border border-slate-200 dark:border-white/5"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {profile && (
                    <EditProfileModal 
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        initialData={{
                            full_name: profile.full_name,
                            username: profile.username,
                            bio: profile.bio,
                            avatar_url: profile.avatar_url
                        }}
                        onUpdate={fetchProfile}
                    />
                )}
            </div>
        </div>
    );
};
