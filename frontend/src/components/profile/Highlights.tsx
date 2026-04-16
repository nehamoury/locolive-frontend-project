import { type FC } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface HighlightItem {
    id: string;
    title: string;
    cover_url: string;
}

interface HighlightsProps {
    highlights?: HighlightItem[];
    onAdd?: () => void;
    onView?: (id: string) => void;
    isOwnProfile?: boolean;
}

const Highlights: FC<HighlightsProps> = ({ highlights = [], onAdd, onView, isOwnProfile }) => {
    return (
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-6 px-1">
            {isOwnProfile && (
                <button
                    onClick={onAdd}
                    className="flex flex-col items-center gap-2.5 shrink-0 group"
                >
                    <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 group-hover:border-primary/50 transition-all duration-300 shadow-inner">
                        <Plus className="w-6 h-6 text-primary group-hover:scale-125 transition-transform" />
                    </div>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] group-hover:text-primary transition-colors">New</span>
                </button>
            )}

            {highlights.map((item, idx) => (
                <motion.button
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 200, damping: 15 }}
                    onClick={() => onView?.(item.id)}
                    className="flex flex-col items-center gap-2.5 shrink-0 group"
                >
                    <div className="relative w-[72px] h-[72px] rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-secondary shadow-lg shadow-primary/10 group-active:scale-90 transition-transform">
                        <div className="w-full h-full rounded-full bg-bg-base p-[2px]">
                            <img
                                src={getMediaUrl(item.cover_url, FALLBACKS.HIGHLIGHT)}
                                alt={item.title}
                                className="w-full h-full rounded-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                        {/* Glow reflection */}
                        <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-[10px] font-black text-text-base truncate w-[72px] text-center uppercase tracking-widest group-hover:text-primary transition-colors">
                        {item.title}
                    </span>
                </motion.button>
            ))}

            {highlights.length === 0 && !isOwnProfile && (
                <div className="flex flex-col items-center gap-3 px-4 opacity-20 grayscale">
                   <div className="w-[72px] h-[72px] rounded-full border-2 border-border-base bg-bg-card/20" />
                   <div className="h-2 w-12 bg-text-muted rounded-full" />
                </div>
            )}
        </div>
    );
};

export default Highlights;
