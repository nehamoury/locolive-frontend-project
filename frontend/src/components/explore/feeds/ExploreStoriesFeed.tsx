import React from 'react';
import { motion } from 'framer-motion';
import { PlayCircle, RefreshCcw } from 'lucide-react';
import { BACKEND } from '../../../utils/config';

interface ExploreStoriesFeedProps {
  stories: any[];
  loading: boolean;
  onRefresh: () => void;
  onStoryClick?: (stories: any[], index: number) => void;
}

export const ExploreStoriesFeed: React.FC<ExploreStoriesFeedProps> = ({ 
  stories, 
  loading, 
  onRefresh,
  onStoryClick
}) => {
  const allStoriesRaw = (stories || []).flatMap(cluster => cluster.stories || []);
  
  const storiesByUser = allStoriesRaw.reduce((acc: Record<string, any[]>, s: any) => {
    if (!s) return acc;
    const uid = s.user_id || s.userId || s.id || 'unknown';
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(s);
    return acc;
  }, {});

  const nearbyUserStories = Object.values(storiesByUser).map((userStories: any) => {
    const sorted = [...userStories].sort((a, b) => {
       const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
       const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
       return timeB - timeA;
    });
    return {
      latest: sorted[0],
      all: sorted
    };
  }).filter(group => group.latest);

  const totalStoriesCount = allStoriesRaw.length;

  const isActuallyLoading = loading && nearbyUserStories.length === 0;

  if (isActuallyLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="aspect-[9/16] bg-bg-card rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center">
            <PlayCircle className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-text-base">Live Stories</h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{totalStoriesCount} stories from {nearbyUserStories.length} users near you</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-3.5 bg-bg-card hover:bg-bg-sidebar border border-border-base rounded-2xl transition-all active:rotate-180 duration-500"
        >
          <RefreshCcw className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {nearbyUserStories.map((group, idx) => (
          <motion.div
            key={`story-feed-group-${group.latest.id || group.latest.username || idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.03 }}
            onClick={() => onStoryClick?.(group.all, 0)}
            className="group relative aspect-[9/16] rounded-3xl overflow-hidden border border-border-base bg-bg-sidebar shadow-xl cursor-pointer active:scale-95 transition-all"
          >
            {group.latest.media_url ? (
               <img 
                src={group.latest.media_url.startsWith('http') ? group.latest.media_url : `${BACKEND}${group.latest.media_url}`} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <PlayCircle className="w-10 h-10 text-white/50" />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-primary overflow-hidden bg-bg-card">
                  {group.latest.avatar_url && (
                    <img src={`${BACKEND}${group.latest.avatar_url}`} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-wider">@{group.latest.username || 'user'}</span>
              </div>
              <p className="text-white text-[10px] font-bold line-clamp-2 leading-relaxed">{group.latest.caption || 'Live Moment'}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
