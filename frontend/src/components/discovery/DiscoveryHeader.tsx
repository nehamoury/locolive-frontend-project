import React from 'react';
import { MapPin } from 'lucide-react';

interface DiscoveryHeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  locationName: string;
}

export const DiscoveryHeader: React.FC<DiscoveryHeaderProps> = ({ activeTab, setActiveTab, locationName }) => {
  return (
    <div className="p-8 pb-4 flex flex-col gap-6 sticky top-0 z-20 bg-bg-base/80 backdrop-blur-2xl transition-all duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black text-text-base tracking-tight italic uppercase">Connect</h1>
        <p className="text-sm font-medium text-text-muted italic">Discover vibrant souls around you.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center p-1 bg-bg-sidebar/50 backdrop-blur-md border border-border-base rounded-2xl shadow-sm">
          <TabButton 
            label="Suggestions" 
            active={activeTab === 'suggestions' || activeTab === 'both' || activeTab === 'stories'} 
            onClick={() => setActiveTab('suggestions')} 
          />
          <TabButton 
            label="Requests" 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')} 
          />
          <TabButton 
            label="Following" 
            active={activeTab === 'following'} 
            onClick={() => setActiveTab('following')} 
          />
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-base rounded-full shadow-lg shadow-pink-500/5 group hover:border-primary/30 transition-all cursor-pointer">
          <MapPin className="w-3.5 h-3.5 text-primary animate-bounce" />
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-[0.1em]">{locationName || "Raipur, CG"}</span>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 relative overflow-hidden group cursor-pointer
      ${active 
        ? 'text-white bg-brand-gradient shadow-lg shadow-primary/25' 
        : 'text-text-muted hover:text-text-base'}`}
  >
    {active && (
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    )}
    <span className="relative z-10">{label}</span>
  </button>
);
