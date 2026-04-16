import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Footprints, Users, PlayCircle, ChevronRight } from 'lucide-react';
import CastingCard from '../../casting/CastingCard';
import { BACKEND } from '../../../utils/config';

interface ExploreAllFeedProps {
  nearbyUsers: any[];
  crossings: any[];
  stories: any[];
  loading: boolean;
  onUserSelect?: (id: string) => void;
}

export const ExploreAllFeed: React.FC<ExploreAllFeedProps> = ({ 
  nearbyUsers, 
  crossings, 
  stories, 
  loading,
  onUserSelect
}) => {
  const allStories = (stories || []).flatMap(cluster => cluster.stories || []).slice(0, 8);
  const featuredUsers = (nearbyUsers || []).slice(0, 6);
  const recentCrossings = (crossings || []).slice(0, 5);

  if (loading && nearbyUsers.length === 0) {
    return (
      <div className="p-8 space-y-12">
        <div className="h-40 bg-bg-card rounded-[40px] animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="aspect-[4/5] bg-bg-card rounded-[40px] animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-16">
      {/* Featured Stories Row */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-[12px] font-black text-text-muted uppercase tracking-[3px] flex items-center gap-2 italic">
            Live Moments <Sparkles className="w-4 h-4 text-purple-500" />
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
          {allStories.map((story, idx) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="relative w-36 aspect-[9/16] rounded-3xl overflow-hidden shrink-0 border border-border-base bg-bg-sidebar shadow-xl group cursor-pointer"
            >
              <img 
                src={story.media_url?.startsWith('http') ? story.media_url : `${BACKEND}${story.media_url}`} 
                alt="" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full border border-primary overflow-hidden">
                   <img src={`${BACKEND}${story.avatar_url}`} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="text-[8px] font-black text-white uppercase truncate max-w-[60px]">@{story.username}</span>
              </div>
            </motion.div>
          ))}
          {allStories.length === 0 && (
            <div className="w-full py-12 flex flex-col items-center justify-center bg-bg-card/50 rounded-[40px] border border-dashed border-border-base">
                <PlayCircle className="w-8 h-8 text-text-muted/20 mb-2" />
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">No active stories nearby</p>
            </div>
          )}
        </div>
      </section>

      {/* Nearby Discoveries Grid */}
      <section>
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-[12px] font-black text-text-muted uppercase tracking-[3px] flex items-center gap-2 italic">
            Nearby Discoveries <Users className="w-4 h-4 text-pink-500" />
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredUsers.map((user, idx) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
            >
              <CastingCard 
                user={user}
                onMatch={() => {}}
                onPass={() => {}}
                onViewProfile={onUserSelect || (() => {})}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Crossings Section */}
      <section className="pb-12">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="text-[12px] font-black text-text-muted uppercase tracking-[3px] flex items-center gap-2 italic">
            Recent Crossings <Footprints className="w-4 h-4 text-primary" />
          </h3>
        </div>
        <div className="space-y-3 max-w-2xl">
          {recentCrossings.map((crossing, idx) => (
             <motion.div
                key={crossing.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                onClick={() => onUserSelect?.(crossing.user_id)}
                className="group flex items-center p-4 bg-bg-card border border-border-base rounded-[28px] hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-bg-sidebar border border-border-base mr-4 group-hover:scale-105 transition-transform">
                  <img 
                    src={crossing.avatar_url?.startsWith('http') ? crossing.avatar_url : `${BACKEND}${crossing.avatar_url}`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-text-base truncate">@{crossing.username}</p>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Crossed Today</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted/20 group-hover:text-primary transition-colors" />
              </motion.div>
          ))}
          {recentCrossings.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center bg-bg-card/50 rounded-[40px] border border-dashed border-border-base">
                <Footprints className="w-8 h-8 text-text-muted/20 mb-2" />
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Go for a walk to see encounters</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
