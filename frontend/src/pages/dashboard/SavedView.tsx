import { type FC, useState, useEffect } from 'react';
import { 
    Bookmark, 
    ArrowLeft, 
    Clapperboard, 
    Loader2,
    Heart,
    MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';
import PostCard from '../../components/post/PostCard';
import { X as CloseIcon } from 'lucide-react';
import { nullString } from '../../utils/string';

interface SavedViewProps {
    isSettingsView?: boolean;
}

const SavedView: FC<SavedViewProps> = ({ isSettingsView }) => {
    const navigate = useNavigate();
    const [savedItems, setSavedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        fetchSavedItems();
    }, []);

    const fetchSavedItems = async () => {
        setLoading(true);
        try {
            // Fetch both saved reels and saved posts
            const [reelsRes, postsRes] = await Promise.all([
                api.get('/reels/saved'),
                api.get('/posts/saved')
            ]);
            
            const reelsData = reelsRes.data.data?.reels || reelsRes.data.reels || reelsRes.data.data || reelsRes.data || [];
            const postsData = postsRes.data.data?.posts || postsRes.data.posts || postsRes.data.data || postsRes.data || [];
            
            const reels = Array.isArray(reelsData) ? reelsData : [];
            const posts = Array.isArray(postsData) ? postsData : [];
            
            // Merge and sort by created_at descending (approximate if mixed)
            const allItems = [...reels, ...posts].sort((a, b) => 
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            );
            
            setSavedItems(allItems);
        } catch (error) {
            console.error('Failed to fetch saved items:', error);
            toast.error('Failed to load saved items');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-bg-base">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                <span className="text-xs font-black uppercase tracking-widest text-text-muted">Loading your collection...</span>
            </div>
        );
    }

    return (
        <div className={cn("bg-transparent min-h-full", !isSettingsView && "p-4 md:p-8")}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                {!isSettingsView && (
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-bg-card rounded-full transition-colors text-text-muted hover:text-text-base"
                            >
                                <ArrowLeft className="w-7 h-7" />
                            </button>
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-black text-text-base flex items-center gap-2">
                                    <Bookmark className="w-7 h-7 text-primary fill-primary/10" />
                                    Saved Items
                                </h1>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Your private collection</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                {savedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="w-24 h-24 bg-bg-card rounded-[32px] flex items-center justify-center mb-6 shadow-sm border border-border-base/50">
                            <Bookmark className="w-10 h-10 text-text-muted/20" />
                        </div>
                        <h2 className="text-xl font-black text-text-base mb-2">Your collection is empty</h2>
                        <p className="text-sm text-text-muted font-medium max-w-[280px]">
                            Save posts and reels you love to see them here later.
                        </p>
                        <button 
                            onClick={() => navigate('/dashboard/reels')}
                            className="mt-8 px-8 py-3 bg-primary text-white font-black uppercase tracking-[2px] text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all cursor-pointer"
                        >
                            Explore Reels
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {savedItems.map((item) => (
                            <motion.div
                                layoutId={`saved-${item.media_type || 'reel'}-${item.id}`}
                                key={`${item.media_type || 'reel'}-${item.id}`}
                                onClick={() => {
                                    if (item.video_url && !item.media_type) {
                                        navigate(`/dashboard/reels?id=${item.id}`);
                                    } else {
                                        setSelectedItem(item);
                                    }
                                }}
                                className={cn(
                                    "bg-bg-card rounded-2xl overflow-hidden group cursor-pointer relative shadow-sm hover:shadow-xl transition-all border border-border-base/50",
                                    (item.video_url && !item.media_type) ? "aspect-[9/16]" : "aspect-square"
                                )}
                            >
                                {item.video_url || item.VideoURL || item.media_type === 'video' ? (
                                    <video
                                        src={getMediaUrl(item.video_url || item.VideoURL || item.media_url)}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        muted
                                        playsInline
                                        loop
                                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.pause();
                                            e.currentTarget.currentTime = 0;
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={getMediaUrl(item.media_url || item.video_url, FALLBACKS.POST)}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt=""
                                    />
                                )}
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 text-white p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Heart className="w-5 h-5 fill-white" />
                                            <span className="text-sm font-black">{item.likes_count || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MessageCircle className="w-5 h-5 fill-white" />
                                            <span className="text-sm font-black">{item.comments_count || 0}</span>
                                        </div>
                                    </div>
                                    {item.video_url && (
                                        <div className="absolute top-4 right-4">
                                            <Clapperboard className="w-5 h-5 text-white drop-shadow-lg" />
                                        </div>
                                    )}
                                    {nullString(item.caption) && (
                                        <p className="text-[10px] font-bold text-center line-clamp-3 mt-2 px-2 opacity-90 italic">
                                            {nullString(item.caption)}
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Item Detail Modal (Reuses PostCard style) */}
            <AnimatePresence>
                {selectedItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8"
                        onClick={() => setSelectedItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute -top-12 right-0 md:-right-12 p-2 text-white/60 hover:text-white transition-colors"
                            >
                                <CloseIcon className="w-8 h-8" />
                            </button>
                            <div className="bg-bg-card rounded-3xl overflow-hidden shadow-2xl">
                                {selectedItem.video_url ? (
                                    <div className="aspect-[9/16] bg-black relative">
                                        <video 
                                            src={getMediaUrl(selectedItem.video_url)}
                                            className="w-full h-full object-contain"
                                            controls
                                            autoPlay
                                        />
                                    </div>
                                ) : (
                                    <PostCard 
                                        post={selectedItem}
                                        onDelete={() => {
                                            setSelectedItem(null);
                                            fetchSavedItems();
                                        }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SavedView;
