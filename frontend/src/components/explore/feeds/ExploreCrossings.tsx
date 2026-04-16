import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, MapPin, Clock, ChevronRight, RefreshCcw } from 'lucide-react';
import { BACKEND } from '../../../utils/config';

interface ExploreCrossingsProps {
  crossings: any[];
  loading: boolean;
  onUserSelect?: (id: string) => void;
  onRefresh: () => void;
}

export const ExploreCrossings: React.FC<ExploreCrossingsProps> = ({ 
  crossings, 
  loading, 
  onUserSelect,
  onRefresh
}) => {
  const isToday = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const sections = [
    { title: 'Today', items: crossings.filter(c => isToday(c.last_crossing_at || c.crossed_at)) },
    { title: 'Earlier', items: crossings.filter(c => !isToday(c.last_crossing_at || c.crossed_at)) },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Footprints className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-text-base">Path Crossings</h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Discover who you've met</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-3.5 bg-bg-card hover:bg-bg-sidebar border border-border-base rounded-2xl transition-all active:rotate-180 duration-500"
        >
          <RefreshCcw className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      {loading && crossings.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-bg-card rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : crossings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-bg-card rounded-[40px] flex items-center justify-center mb-6">
            <Footprints className="w-10 h-10 text-text-muted/20" />
          </div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter mb-2 text-text-base">No encounters yet</h3>
          <p className="text-xs font-bold text-text-muted max-w-[240px] leading-relaxed">
            New people will appear here when you naturally cross paths with them.
          </p>
        </div>
      ) : (
        <div className="space-y-12 max-w-2xl">
          {sections.map(section => section.items.length > 0 && (
            <div key={section.title}>
              <h2 className="text-[10px] font-black uppercase tracking-[5px] text-text-muted/40 mb-6 px-2">{section.title}</h2>
              <div className="space-y-3">
                <AnimatePresence>
                  {section.items.map((crossing, idx) => (
                    <motion.div
                      key={crossing.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => onUserSelect?.(crossing.user_id)}
                      className="group relative flex items-center p-5 bg-bg-card border border-border-base rounded-[32px] hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all cursor-pointer"
                    >
                      <div className="relative shrink-0 mr-5">
                        <div className="w-16 h-16 rounded-[24px] overflow-hidden bg-bg-sidebar border border-border-base group-hover:rotate-[-3deg] transition-transform duration-500">
                          {crossing.avatar_url ? (
                            <img 
                              src={crossing.avatar_url.startsWith('http') ? crossing.avatar_url : `${BACKEND}${crossing.avatar_url}`} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-black text-text-muted/20 text-xl italic">
                              {(crossing.full_name || crossing.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-black text-lg text-text-base tracking-tight leading-none truncate">
                            {crossing.full_name || crossing.username}
                          </p>
                          {crossing.crossing_count > 1 && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded-full">
                              {crossing.crossing_count}x Encounters
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-[10px] font-bold text-text-muted/40">
                          <span className="flex items-center gap-1.5 uppercase tracking-widest leading-none mt-0.5">
                            <MapPin className="w-3 h-3 text-primary" />
                            Nearby Area
                          </span>
                          <span className="flex items-center gap-1.5 uppercase tracking-widest leading-none mt-0.5">
                            <Clock className="w-3 h-3 text-accent" />
                            {new Date(crossing.last_crossing_at || crossing.crossed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-5 h-5 text-text-muted/20" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
