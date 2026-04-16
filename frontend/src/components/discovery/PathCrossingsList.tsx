import React from 'react';
import { BACKEND } from '../../utils/config';

interface Crossing {
  user_id: string;
  username: string;
  avatar_url?: string;
  last_crossing_at?: string;
  crossing_count: number;
}

interface PathCrossingsListProps {
  crossings: Crossing[];
  onUserSelect?: (userId: string) => void;
}

const formatRelativeTime = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMins < 1) return 'Just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${Math.floor(diffInHours / 24)}d ago`;
};

export const PathCrossingsList: React.FC<PathCrossingsListProps> = ({ crossings, onUserSelect }) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[12px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 italic">
          Path Crossings <span className="text-lg">🏃</span>
        </h3>
      </div>
      
      <div className="flex flex-row gap-6 overflow-x-auto no-scrollbar pb-2 px-2">
        {crossings.length === 0 ? (
          <div className="min-w-full bg-bg-sidebar/50 border border-dashed border-border-base p-8 rounded-[32px] text-center">
             <p className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">No crossings yet</p>
          </div>
        ) : (
          crossings.map((c) => (
            <div 
              key={c.user_id} 
              onClick={() => onUserSelect?.(c.user_id)}
              className="flex flex-col items-center gap-3 group cursor-pointer transition-transform hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg shadow-primary/5 group-hover:from-primary group-hover:to-accent transition-all duration-300">
                  <div className="w-full h-full rounded-full bg-bg-card overflow-hidden flex items-center justify-center border-2 border-bg-card">
                    {c.avatar_url ? (
                      <img src={`${BACKEND}${c.avatar_url}`} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="font-bold text-primary text-lg italic">{(c.username?.charAt(0) || 'U').toUpperCase()}</span>
                    )}
                  </div>
                </div>
                {c.crossing_count > 1 && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold border-2 border-bg-card shadow-md">
                    {c.crossing_count}
                  </div>
                )}
              </div>
              <div className="text-center w-20">
                <h4 className="text-[11px] font-bold text-text-base italic tracking-tighter truncate uppercase group-hover:text-primary transition-colors">
                  @{c.username}
                </h4>
                <p className="text-[8px] font-medium text-text-muted/40 uppercase tracking-tight truncate">
                  {formatRelativeTime(c.last_crossing_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
