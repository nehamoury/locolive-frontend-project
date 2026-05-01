import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark, Play, Video } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { cn } from '../../utils/helpers';
import { nullString } from '../../utils/string';

const formatTimeAgo = (date: string) => {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (diff < 1) return 'just now';
    if (diff < 60) return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
};

interface SharedContentCardProps {
    type: 'POST' | 'REEL';
    id: string;
    isMe: boolean;
}

const SharedContentCard: React.FC<SharedContentCardProps> = ({ type, id, isMe }) => {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = type === 'POST' ? `/posts/${id}` : `/reels/${id}`;
                const res = await api.get(endpoint);
                setData(res.data);
            } catch (err) {
                console.error(`Failed to fetch shared ${type}:`, err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [type, id]);

    if (loading) {
        return (
            <div className={cn(
                "w-full max-w-[280px] p-4 rounded-2xl animate-pulse",
                isMe ? "bg-white/10" : "bg-white border border-gray-100"
            )}>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                        <div className="h-2 bg-gray-200 rounded w-1/4" />
                    </div>
                </div>
                <div className="h-32 bg-gray-100 rounded-xl mb-3" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
        );
    }

    if (!data) return null;

    const username = data.username || 'user';
    const avatar = getMediaUrl(data.avatar_url, FALLBACKS.AVATAR(username));
    const caption = nullString(data.caption || data.body_text || '');
    const mediaUrl = data.media_url || data.video_url;
    const isVideo = type === 'REEL' || data.media_type === 'video';

    const handleClick = () => {
        if (type === 'POST') {
            navigate(`/dashboard/home?post=${id}`);
        } else {
            navigate(`/dashboard/reels?id=${id}`);
        }
    };

    return (
        <motion.div 
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                "w-full max-w-[280px] rounded-[32px] overflow-hidden transition-all cursor-pointer shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] border group",
                isMe 
                    ? "bg-white/95 backdrop-blur-md border-pink-100" 
                    : "bg-white border-gray-100"
            )}
        >
            {/* Header */}
            <div className="p-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 shrink-0">
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-2 h-2 text-white fill-current">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[14px] font-black tracking-tight text-gray-900">@{username}</span>
                            <span className="text-[11px] text-gray-400 font-bold">· {formatTimeAgo(data.created_at)}</span>
                        </div>
                        <span className="text-[9px] font-bold text-pink-500 uppercase tracking-widest opacity-60">
                            Shared {type.toLowerCase()}
                        </span>
                    </div>
                </div>
                <button className="p-2 text-gray-300 hover:text-gray-500 transition-colors">
                    <MoreHorizontal className="w-4.5 h-4.5" />
                </button>
            </div>

            {/* Media Preview (Prominent) */}
            {mediaUrl ? (
                <div className="px-3 pb-3">
                    <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden bg-gray-50 border border-gray-50 group-hover:shadow-inner transition-all">
                        <img src={getMediaUrl(mediaUrl)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                                    <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                            </div>
                        )}
                        {type === 'REEL' && (
                            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/10">
                                <Video className="w-3 h-3 text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Reel</span>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="px-5 py-4 bg-gray-50/50 mx-3 mb-3 rounded-[24px] border border-gray-50">
                    <p className="text-[15px] font-bold text-gray-800 leading-relaxed italic line-clamp-4">
                        “{caption}”
                    </p>
                </div>
            )}

            {/* Content Info (If media exists, caption is below) */}
            {mediaUrl && (
                <div className="px-5 pb-4">
                    <p className="text-[13px] font-bold text-gray-700 leading-snug line-clamp-2">
                        {caption}
                    </p>
                    {caption.includes('#') && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {caption.match(/#[a-z0-9_]+/gi)?.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] font-black text-pink-500 uppercase tracking-wider">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                        <span className="text-[12px] font-black text-gray-400">{data.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                        <span className="text-[12px] font-black text-gray-400">{data.comments_count || 0}</span>
                    </div>
                    <Send className="w-5 h-5 text-gray-400 hover:text-primary transition-colors" />
                </div>
                <Bookmark className="w-5 h-5 text-gray-400 hover:text-yellow-500 transition-colors" />
            </div>
        </motion.div>
    );
};

const MoreHorizontal: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>
    </svg>
);

export default SharedContentCard;
