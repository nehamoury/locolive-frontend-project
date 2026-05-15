import { useState, useEffect, type FC } from 'react';
import { 
    ArrowLeft, 
    MessageSquare, 
    MapPin, 
    Grid3x3, 
    Share2, 
    MoreHorizontal, 
    Zap, 
    Footprints,
    Users, 
    Sparkles,
    ShieldCheck,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Highlights from '../../components/profile/Highlights';
import { getMediaUrl } from '../../utils/media';
import { nullString } from '../../utils/string';

interface MemberProfileDetailProps {
    userId: string;
    onBack: () => void;
    onMessage: (userId: string) => void;
}

const MemberProfileDetail: FC<MemberProfileDetailProps> = ({ userId, onBack, onMessage }) => {
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorStatus, setErrorStatus] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'timeline' | 'moments' | 'connections'>('moments');
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [blocking, setBlocking] = useState(false);

    const fetchFullProfile = async () => {
        try {
            setLoading(true);
            setErrorStatus(null);
            const [userRes, , postsRes] = await Promise.all([
                api.get(`/users/${userId}`),
                api.get(`/stories/user/${userId}`).catch(() => ({ data: [] })),
                api.get(`/users/${userId}/posts`).catch(() => ({ data: [] }))
            ]);
            setProfile(userRes.data);
            setPosts(postsRes.data || []);
        } catch (err: any) {
            console.error('Failed to fetch member details:', err);
            if (err.response?.status) {
                setErrorStatus(err.response.status);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBlockAction = async () => {
        const action = profile.is_blocked ? 'unblock' : 'block';
        if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
        
        setBlocking(true);
        try {
            if (profile.is_blocked) {
                await api.delete(`/users/block/${userId}`);
                import('react-hot-toast').then(({ toast }) => toast.success('User unblocked!'));
            } else {
                await api.post('/users/block', { user_id: userId });
                import('react-hot-toast').then(({ toast }) => toast.success('User blocked!'));
            }
            fetchFullProfile();
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
            setProfile((prev: any) => ({ ...prev, requested: true }));
        } catch (err) {
            console.error('Follow request failed:', err);
        }
    };

    useEffect(() => {
        const fetchFullProfile = async () => {
            try {
                setLoading(true);
                setErrorStatus(null);
                const [userRes, , postsRes] = await Promise.all([
                    api.get(`/users/${userId}`),
                    api.get(`/stories/user/${userId}`).catch(() => ({ data: [] })),
                    api.get(`/users/${userId}/posts`).catch(() => ({ data: [] }))
                ]);
                setProfile(userRes.data);
                setPosts(postsRes.data || []);
            } catch (err: any) {
                console.error('Failed to fetch member details:', err);
                if (err.response?.status) {
                    setErrorStatus(err.response.status);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchFullProfile();
    }, [userId]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-white/40 backdrop-blur-3xl">
                <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile || errorStatus === 404) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-white text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-6 border border-gray-100">
                    <Users className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase">User Not Found</h3>
                <p className="text-xs font-bold text-gray-400 max-w-[240px] mt-2 leading-relaxed">This profile is no longer available or you may have been blocked.</p>
                <button onClick={onBack} className="mt-8 px-10 py-3.5 bg-gray-900 text-white text-[11px] font-black uppercase rounded-[20px] shadow-xl">Go Back</button>
            </div>
        );
    }

    if (profile?.is_private && profile?.connection_status !== 'accepted' && profile?.connection_status !== 'self') {
        return (
            <div className="h-full bg-white flex flex-col">
                <div className="p-8">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-24 h-24 bg-pink-50 rounded-[40px] flex items-center justify-center mb-8 border border-pink-100">
                        <Lock className="w-10 h-10 text-pink-500" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Private Account</h3>
                    <p className="text-sm text-gray-400 font-bold max-w-[300px] leading-relaxed mb-10">Follow this account to see their photos, videos and moments on Locolive.</p>
                    <button 
                        onClick={handleFollow}
                        disabled={profile.connection_status === 'pending' || profile.requested}
                        className="px-10 py-4 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-[2px] text-xs shadow-2xl disabled:opacity-50"
                    >
                        {profile.connection_status === 'pending' || profile.requested 
                            ? 'Request Sent' 
                            : (profile.follows_you ? 'Follow Back' : 'Send Connection Request')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden font-poppins">
            {/* Header / Hero */}
        <div className="h-[200px] md:h-[280px] shrink-0 relative bg-gray-50">
                {profile.cover_url ? (
                    <img src={getMediaUrl(profile.cover_url)} className="w-full h-full object-cover" alt="" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100" />
                )}
                <div className="absolute inset-0 bg-black/10" />
                
                {/* Nav Buttons */}
                <div className="absolute top-6 md:top-8 left-0 right-0 px-4 md:px-8 flex items-center justify-between z-10">
                    <div className="w-12">
                        <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white transition-all shadow-xl shadow-black/10">
                            <ArrowLeft className="w-5 h-5 text-gray-900" />
                        </button>
                    </div>

                    <div className="flex-1 flex justify-center px-4">
                        <span className="text-[13px] font-black text-gray-900 uppercase tracking-[0.2em] bg-white/40 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/40 shadow-xl shadow-black/5 truncate max-w-[200px]">
                            {profile.username}
                        </span>
                    </div>

                    <div className="flex gap-3 relative">
                        <button className="w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white transition-all shadow-xl shadow-black/10">
                            <Share2 className="w-5 h-5 text-gray-900" />
                        </button>
                        <div className="relative">
                            <button 
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                className="w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white transition-all shadow-xl shadow-black/10"
                            >
                                <MoreHorizontal className="w-5 h-5 text-gray-900" />
                            </button>
                            <AnimatePresence>
                                {showMoreMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 mt-3 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden"
                                        >
                                            <button 
                                                onClick={handleBlockAction}
                                                className={`w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-3 ${
                                                    profile.is_blocked ? 'text-gray-900 hover:bg-gray-50' : 'text-red-500 hover:bg-red-50'
                                                }`}
                                            >
                                                {profile.is_blocked ? 'Unblock User' : 'Block User'}
                                            </button>
                                            <button className="w-full text-left px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center gap-3">
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

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative -mt-16 rounded-t-[32px] md:rounded-t-[40px] bg-white border-t border-white/20 shadow-2xl">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-10">
                    
                    {/* Top Section: Avatar & Actions */}
                    <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-8 md:mb-10 gap-6">
                        <div className="relative">
                            <div className="w-28 h-28 md:w-36 md:h-36 rounded-[32px] md:rounded-[40px] p-1 bg-gradient-to-tr from-pink-500 to-purple-500 shadow-2xl shadow-pink-500/20">
                                <div className="w-full h-full rounded-[38px] bg-white p-1 overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={getMediaUrl(profile.avatar_url)} className="w-full h-full rounded-[32px] object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full rounded-[32px] bg-gray-50 flex items-center justify-center text-4xl font-black text-gray-300">
                                            {profile.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
                        </div>

                        <div className="flex gap-4 w-full md:w-auto">
                            {profile.is_blocked ? (
                                <button 
                                    onClick={handleBlockAction}
                                    disabled={blocking}
                                    className="flex-1 md:flex-none px-6 md:px-8 py-3.5 bg-red-50 text-red-600 border border-red-100 rounded-[20px] md:rounded-[24px] text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/10 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {blocking ? 'Unblocking...' : 'Unblock'}
                                </button>
                            ) : profile.connection_status === 'accepted' ? (
                                <button className="flex-1 md:flex-none px-6 md:px-8 py-3.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-[20px] md:rounded-[24px] text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] cursor-default">
                                    Connected
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollow}
                                    disabled={profile.connection_status === 'pending' || profile.requested || blocking}
                                    className={`flex-1 md:flex-none px-6 md:px-8 py-3.5 rounded-[20px] md:rounded-[24px] text-[11px] md:text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95
                                        ${(profile.connection_status === 'pending' || profile.requested || blocking) 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-gray-900 text-white shadow-black/20 hover:scale-105'}`}
                                >
                                    {profile.connection_status === 'pending' || profile.requested 
                                        ? 'Requested' 
                                        : (profile.follows_you ? 'Follow Back' : 'Connect')}
                                </button>
                            )}
                            <button 
                                onClick={() => onMessage(userId)}
                                className="w-14 h-14 bg-pink-50 text-pink-500 rounded-[20px] md:rounded-[24px] flex items-center justify-center border border-pink-100 hover:bg-pink-100 transition-all shadow-xl shadow-pink-500/10 shrink-0"
                            >
                                <MessageSquare className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Bio & Details */}
                    <div className="mb-10 md:mb-12 text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 mb-2">
                            <h1 className="text-[28px] md:text-[34px] font-black tracking-tighter text-gray-900 uppercase italic leading-tight">
                                {nullString(profile.full_name) || profile.username}
                            </h1>
                            <div className="flex items-center gap-2">
                                {profile.is_blocked && (
                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-red-200 shadow-sm">
                                        Blocked
                                    </span>
                                )}
                                <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-blue-500 shrink-0" />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3 text-pink-500 font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] mb-6">
                            <span>@{profile.username}</span>
                            <span className="hidden md:block w-1.5 h-1.5 bg-gray-200 rounded-full shrink-0" />
                            <div className="flex items-center gap-1.5 font-bold text-gray-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Locolive Member</span>
                            </div>
                        </div>
                        <p className="text-[14px] leading-relaxed text-gray-500 max-w-xl font-medium border-l-0 md:border-l-4 border-gray-100 md:pl-6 py-1">
                            {nullString(profile.bio) || "Hi! I'm using Locolive to discover amazing moments and cross paths with interesting people nearby. Let's connect!"}
                        </p>
                    </div>

                    {/* Stats Bento */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-12">
                        <div className="bg-gray-50/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-500" />
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Connections</span>
                            </div>
                            <span className="text-xl md:text-2xl font-black text-gray-900 italic">{profile.connection_count || 0}</span>
                        </div>
                        <div className="bg-gray-50/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-gray-100">
                            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <Footprints className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500" />
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Crossings</span>
                            </div>
                            <span className="text-xl md:text-2xl font-black text-gray-900 italic">{profile.crossings_count || 0}</span>
                        </div>
                        <div className="bg-gray-50/50 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-gray-100 col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                                <Grid3x3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                                <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Moments</span>
                            </div>
                            <span className="text-xl md:text-2xl font-black text-gray-900 italic">{posts.length}</span>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="mb-14">
                        <div className="flex items-center gap-2 mb-6 px-1">
                            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Featured Moments</span>
                        </div>
                        <Highlights highlights={[]} isOwnProfile={false} />
                    </div>

                    {/* Tab Navigation */}
                    <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 flex gap-4 md:gap-12 border-b border-gray-100 mb-8 px-2 overflow-x-auto no-scrollbar">
                        {([
                            { id: 'moments', label: 'Moments', icon: <Zap className="w-3.5 h-3.5" /> },
                            { id: 'timeline', label: 'Crossings', icon: <Footprints className="w-3.5 h-3.5" /> },
                            { id: 'connections', label: 'Mutuals', icon: <Users className="w-3.5 h-3.5" /> },
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-4 md:py-5 relative flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab.icon}
                                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{tab.label}</span>
                                {activeTab === tab.id && (
                                    <motion.div layoutId="tabUnderlineDetail" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-gradient rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="min-h-[400px]"
                        >
                            {activeTab === 'moments' && (
                                posts.length > 0 ? (
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-1 md:gap-3">
                                        {posts.map((post, idx) => (
                                            <div
                                                key={post.id}
                                                className={`
                                                    relative rounded-[16px] md:rounded-[28px] overflow-hidden group border border-gray-100 cursor-pointer
                                                    ${idx % 7 === 0 ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}
                                                `}
                                            >
                                                <img 
                                                    src={getMediaUrl(post.media_url)} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                    alt="" 
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-24 flex flex-col items-center justify-center opacity-20">
                                        <Lock className="w-12 h-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No public moments available</p>
                                    </div>
                                )
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default MemberProfileDetail;
