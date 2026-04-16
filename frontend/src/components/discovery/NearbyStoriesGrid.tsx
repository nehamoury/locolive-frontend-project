import React from 'react';
import { BACKEND } from '../../utils/config';

interface Story {
  id: string;
  username: string;
  media_url: string;
  distance?: string;
}

interface NearbyStoriesGridProps {
  stories: Story[];
}

export const NearbyStoriesGrid: React.FC<NearbyStoriesGridProps> = ({ stories = [] }) => {
  if (!Array.isArray(stories) || stories.length === 0) return null;
  
  return (
    <div className="flex flex-col gap-4 mb-4">
      <h3 className="text-xs font-black text-text-muted uppercase italic tracking-widest px-2">Nearby Stories</h3>
      <div className="grid grid-cols-3 gap-2">
        {stories.slice(0, 9).map((s, i) => (
          <div key={i} className="aspect-square bg-bg-sidebar rounded-2xl overflow-hidden relative group cursor-pointer border border-border-base/50 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95">
            {s?.media_url && <img src={`${BACKEND}${s.media_url}`} className="w-full h-full object-cover relative z-0" alt="" />}
            
            {/* Dark overlay for text readability */}
            <div className="absolute z-10 inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 opacity-90 transition-opacity">
              <span className="text-[11px] font-bold text-white leading-tight truncate uppercase tracking-tighter italic">
                @{s.username || 'user'}
              </span>
              {s.distance && (
                <span className="text-[9px] font-semibold text-white/60 uppercase tracking-widest mt-0.5">
                  {s.distance}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
