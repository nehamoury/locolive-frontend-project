import React from 'react';
import { DiscoveryHeader } from './DiscoveryHeader';
import { PeopleNearbyCard } from './PeopleNearbyCard';
import { PathCrossingsList } from './PathCrossingsList';
import { NearbyStoriesGrid } from './NearbyStoriesGrid';
import { AnimatePresence } from 'framer-motion';

interface DiscoveryPanelProps {
  activeTab: 'stories' | 'heatmap' | 'both';
  setActiveTab: (tab: 'stories' | 'heatmap' | 'both') => void;
  locationName: string;
  nearbyUser?: any;
  crossings: any[];
  nearbyStories: any[];
  onUserSelect?: (userId: string) => void;
  onConnect?: (userId: string) => void;
  onSkip?: () => void;
  onFavorite?: (userId: string) => void;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  activeTab,
  setActiveTab,
  locationName,
  nearbyUser,
  crossings,
  nearbyStories,
  onUserSelect,
  onConnect,
  onSkip,
  onFavorite
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto no-scrollbar flex flex-col bg-bg-base border-border-base transition-colors duration-300">
      <DiscoveryHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        locationName={locationName} 
      />

      <div className="p-8 flex flex-col gap-10">
        {/* People Nearby Section */}
        <section className="flex flex-col gap-6 overflow-hidden">
           <h3 className="text-[12px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 italic px-2">
              People Nearby <span className="text-lg">💫</span>
           </h3>
           <AnimatePresence mode="wait">
             <PeopleNearbyCard 
               key={nearbyUser?.userId || nearbyUser?.id || 'guest'}
               user={nearbyUser || { username: "Guest", bio: "No more users nearby", distance: "" }} 
               onConnect={onConnect}
               onProfileClick={onUserSelect}
               onSkip={onSkip}
               onFavorite={onFavorite}
             />
           </AnimatePresence>
        </section>

        {/* Path Crossings Section */}
        <PathCrossingsList crossings={crossings} onUserSelect={onUserSelect} />

        {/* Nearby Stories Grid */}
        <NearbyStoriesGrid stories={nearbyStories} />
      </div>
    </div>
  );
};
