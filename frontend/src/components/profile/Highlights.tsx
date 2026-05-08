import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { nullString } from '../../utils/string';

interface HighlightItem {
    id: string;
    title: string;
    cover_url: string;
}

interface HighlightsProps {
    highlights?: HighlightItem[];
    onAdd?: () => void;
    onView?: (highlight: HighlightItem) => void;
    isOwnProfile?: boolean;
}

const Highlights: FC<HighlightsProps> = ({ highlights = [], onAdd, onView, isOwnProfile }) => {
    return (
        <div className="flex items-center gap-6 md:gap-10 overflow-x-auto no-scrollbar py-2">
            {isOwnProfile && (
                <div 
                    onClick={onAdd}
                    className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
                >
                    <div className="w-16 h-16 md:w-[77px] md:h-[77px] rounded-full border border-border-base flex items-center justify-center bg-bg-card group-hover:bg-bg-base transition-colors">
                        <Plus className="w-8 h-8 md:w-10 md:h-10 text-text-muted/30 group-hover:text-text-muted/50" />
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-text-base">New</span>
                </div>
            )}
            
            {highlights.map((h) => (
                <div 
                    key={h.id} 
                    className="flex flex-col items-center gap-2 group cursor-pointer shrink-0"
                    onClick={() => onView?.(h)}
                >
                    <div className="w-16 h-16 md:w-[77px] md:h-[77px] rounded-full p-[2.5px] border border-border-base flex items-center justify-center bg-bg-card group-hover:border-primary transition-all">
                        <div className="w-full h-full rounded-full overflow-hidden relative">
                            {nullString(h.cover_url).match(/\.(mp4|webm|mov)$|video/i) ? (
                                <video 
                                    src={getMediaUrl(nullString(h.cover_url))}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                    muted
                                    playsInline
                                    onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                    onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                                />
                            ) : (
                                <img 
                                    src={getMediaUrl(nullString(h.cover_url), FALLBACKS.POST)} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                    alt={h.title} 
                                />
                            )}
                        </div>
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-text-base truncate max-w-[70px]">
                        {h.title || 'Collection'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Highlights;
