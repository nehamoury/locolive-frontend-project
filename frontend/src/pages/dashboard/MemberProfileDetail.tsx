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
import { BACKEND } from '../../utils/config';

interface MemberProfileDetailProps {
    userId: string;
    onBack: () => void;
    onMessage: (userId: string) => void;
}

const MemberProfileDetail: FC<MemberProfileDetailProps> = ({ userId, onBack, onMessage }) => {
    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'timeline' | 'moments' | 'connections'>('moments');

    useEffect(() => {
        const fetchFullProfile = async () => {
            try {
                setLoading(true);
                const [userRes, , postsRes] = await Promise.all([
                    api.get(`/users/${userId}`),
                    api.get(`/stories/user/${userId}`).catch(() => ({ data: [] })),
                    api.get(`/users/${userId}/posts`).catch(() => ({ data: [] }))
                ]);
                setProfile(userRes.data);
                setPosts(postsRes.data || []);
            } catch (err) {
                console.error('Failed to fetch member details:', err);
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

    if (!profile) return null;

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden font-poppins">
            {/* Header / Hero */}
            <div className="h-[280px] shrink-0 relative bg-gray-50">
                {profile.cover_url ? (
                    <img src={`${BACKEND}${profile.cover_url}`} className="w-full h-full object-cover" alt="" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100" />
                )}
                <div className="absolute inset-0 bg-black/10" />
                
                {/* Nav Buttons */}
                <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-10">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white transition-all shadow-xl shadow-black/10">
                        <ArrowLeft className="w-5 h-5 text-gray-900" />
                    </button>
                    <div className="flex gap-3">
                        <button className="w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white transition-all shadow-xl shadow-black/10">
                            <Share2 className="w-5 h-5 text-gray-900" />
                        </button>
                        <button className="w-12 h-12 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 hover:bg-white transition-all shadow-xl shadow-black/10">
                            <MoreHorizontal className="w-5 h-5 text-gray-900" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative -mt-16 rounded-t-[40px] bg-white border-t border-white/20 shadow-2xl">
                <div className="max-w-5xl mx-auto px-8 py-10">
                    
                    {/* Top Section: Avatar & Actions */}
                    <div className="flex items-end justify-between mb-10">
                        <div className="relative">
                            <div className="w-36 h-36 rounded-[40px] p-1 bg-gradient-to-tr from-pink-500 to-purple-500 shadow-2xl shadow-pink-500/20">
                                <div className="w-full h-full rounded-[38px] bg-white p-1 overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={`${BACKEND}${profile.avatar_url}`} className="w-full h-full rounded-[32px] object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full rounded-[32px] bg-gray-50 flex items-center justify-center text-4xl font-black text-gray-300 italic">
                                            {profile.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
                        </div>

                        <div className="flex gap-4 pb-2">
                            <button className="px-8 py-3.5 bg-gray-900 text-white rounded-[24px] text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:scale-105 transition-all active:scale-95">
                                Follow Friend
                            </button>
                            <button 
                                onClick={() => onMessage(userId)}
                                className="w-14 h-14 bg-pink-50 text-pink-500 rounded-[24px] flex items-center justify-center border border-pink-100 hover:bg-pink-100 transition-all shadow-xl shadow-pink-500/10"
                            >
                                <MessageSquare className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Bio & Details */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-[34px] font-black tracking-tighter text-gray-900 uppercase italic">
                                {profile.full_name || profile.username}
                            </h1>
                            <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
                        </div>
                        <div className="flex items-center gap-3 text-pink-500 font-black text-[11px] uppercase tracking-[0.2em] italic mb-6">
                            <span>@{profile.username}</span>
                            <span className="w-1.5 h-1.5 bg-gray-200 rounded-full shrink-0" />
                            <div className="flex items-center gap-1.5 font-bold text-gray-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Locolive Member</span>
                            </div>
                            <span className="w-1.5 h-1.5 bg-gray-200 rounded-full shrink-0" />
                            <div className="flex items-center gap-1.5 font-bold text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full text-[9px]">
                                <span className="opacity-50">ID:</span>
                                <span>{userId}</span>
                            </div>
                        </div>
                        <p className="text-[14px] leading-relaxed text-gray-500 max-w-xl font-medium border-l-4 border-gray-100 pl-6 py-1 italic">
                            {profile.bio || "Hi! I'm using Locolive to discover amazing moments and cross paths with interesting people nearby. Let's connect!"}
                        </p>
                    </div>

                    {/* Stats Bento */}
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-4 h-4 text-pink-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connections</span>
                            </div>
                            <span className="text-2xl font-black text-gray-900 italic">{profile.connection_count || 0}</span>
                        </div>
                        <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Footprints className="w-4 h-4 text-purple-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Crossings</span>
                            </div>
                            <span className="text-2xl font-black text-gray-900 italic">{profile.crossings_count || 0}</span>
                        </div>
                        <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Grid3x3 className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Moments</span>
                            </div>
                            <span className="text-2xl font-black text-gray-900 italic">{posts.length}</span>
                        </div>
                    </div>

                    {/* Highlights */}
                    <div className="mb-14">
                        <div className="flex items-center gap-2 mb-6 px-1">
                            <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] italic">Featured Moments</span>
                        </div>
                        <Highlights highlights={[]} isOwnProfile={false} />
                    </div>

                    {/* Tab Navigation */}
                    <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 flex gap-12 border-b border-gray-100 mb-8 px-2">
                        {([
                            { id: 'moments', label: 'Moments', icon: <Zap className="w-3.5 h-3.5" /> },
                            { id: 'timeline', label: 'Crossings', icon: <Footprints className="w-3.5 h-3.5" /> },
                            { id: 'connections', label: 'Mutuals', icon: <Users className="w-3.5 h-3.5" /> },
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-5 relative flex items-center gap-2 transition-all cursor-pointer ${
                                    activeTab === tab.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {tab.icon}
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">{tab.label}</span>
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
                                    <div className="grid grid-cols-6 gap-3">
                                        {posts.map((post, idx) => (
                                            <div
                                                key={post.id}
                                                className={`
                                                    relative rounded-[28px] overflow-hidden group border border-gray-100 cursor-pointer
                                                    ${idx % 5 === 0 ? 'col-span-4 row-span-2' : 'col-span-2 row-span-1'}
                                                `}
                                            >
                                                <img 
                                                    src={`${BACKEND}${post.media_url}`} 
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
