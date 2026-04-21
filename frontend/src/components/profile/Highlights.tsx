import { type FC } from 'react';
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
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-4 px-2">
            {isOwnProfile && (
                <div className="flex flex-col items-center gap-3 shrink-0">
                    <button 
                        onClick={onAdd}
                        className="w-20 h-20 rounded-full border-2 border-dashed border-pastel flex items-center justify-center text-slate-300 hover:text-pastel-pink-accent hover:border-pastel-pink-accent transition-all active:scale-95 cursor-pointer bg-white"
                    >
                        <Plus className="w-8 h-8" />
                    </button>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">New</span>
                </div>
            )}
            
            {highlights.map((h) => (
                <div 
                    key={h.id} 
                    className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer"
                    onClick={() => onView?.(h.id)}
                >
                    <div className="w-20 h-20 rounded-full p-[2px] border-2 border-transparent group-hover:border-pastel-pink-accent transition-all active:scale-95">
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-slate-50 shadow-soft">
                            <img 
                                src={getMediaUrl(h.cover_url, FALLBACKS.POST)} 
                                className="w-full h-full object-cover" 
                                alt="" 
                            />
                        </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                        {h.title || 'Collection'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Highlights;
