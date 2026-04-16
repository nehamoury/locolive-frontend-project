import React from 'react';
import { Loader2, Users, Footprints, PlayCircle, TrendingUp } from 'lucide-react';

interface ExploreSummaryProps {
  stats: {
    nearby: number;
    stories: number;
    todayCrossings: number;
  };
  loading: boolean;
}

export const ExploreSummary: React.FC<ExploreSummaryProps> = ({ stats, loading }) => {
  return (
    <div className="p-8 flex flex-col gap-8">
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-muted mb-6">Discovery Stats</h3>
        
        <div className="space-y-4">
          <StatCard 
            icon={<Users className="w-4 h-4 text-[#FF006E]" />} 
            label="Nearby Now" 
            value={stats.nearby} 
            loading={loading}
          />
          <StatCard 
            icon={<PlayCircle className="w-4 h-4 text-[#833AB4]" />} 
            label="Live Stories" 
            value={stats.stories} 
            loading={loading}
          />
          <StatCard 
            icon={<Footprints className="w-4 h-4 text-primary" />} 
            label="Path Crossings" 
            value={stats.todayCrossings} 
            loading={loading}
          />
        </div>
      </div>

      <div className="pt-8 border-t border-border-base">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-text-muted" />
          <h3 className="text-[10px] font-black uppercase tracking-[3px] text-text-muted">Trending Circles</h3>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-bg-card border border-border-base rounded-2xl animate-pulse">
            <div className="h-4 bg-bg-sidebar rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-bg-sidebar rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, loading }: { icon: any, label: string, value: number, loading: boolean }) => (
  <div className="p-5 bg-bg-card border border-border-base rounded-[24px] flex items-center justify-between hover:border-text-muted/20 transition-all group">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-bg-sidebar flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-text-muted">{label}</p>
        <div className="flex items-baseline gap-1">
          {loading ? (
            <Loader2 className="w-4 h-4 text-text-muted animate-spin mt-1" />
          ) : (
            <span className="text-2xl font-black italic text-text-base">{value}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);
