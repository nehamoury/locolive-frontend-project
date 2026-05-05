import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import type { ExploreTab } from '../../pages/dashboard/ExplorePage';
import CastingGrid from '../casting/CastingGrid';
import { ExploreAllFeed } from './feeds/ExploreAllFeed';
import { ExploreNearbyUsers } from './feeds/ExploreNearbyUsers';
import { ExploreCrossings } from './feeds/ExploreCrossings';
import { ExploreStoriesFeed } from './feeds/ExploreStoriesFeed';

interface ExploreFeedProps {
  activeTab: ExploreTab;
  data: {
    nearbyUsers: any[];
    crossings: any[];
    suggestedUsers: any[];
    mapStories: any[];
    loading: {
      nearby: boolean;
      crossings: boolean;
      suggested: boolean;
      stories: boolean;
      heatmap: boolean;
    };
  };
  onUserSelect?: (id: string) => void;
  onStoryClick?: (stories: any[], index: number) => void;
  onRefresh: {
    nearby: () => void;
    crossings: () => void;
    suggested: () => void;
    stories: () => void;
    heatmap: () => void;
  };
  onRemoveSuggested: (id: string) => void;
  onRemoveNearby: (id: string) => void;
}

export const ExploreFeed: React.FC<ExploreFeedProps> = ({
  activeTab,
  data,
  onUserSelect,
  onStoryClick,
  onRefresh,
  onRemoveSuggested,
  onRemoveNearby
}) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'all':
        return (
          <ExploreAllFeed
            nearbyUsers={data.nearbyUsers}
            crossings={data.crossings}
            stories={data.mapStories}
            loading={data.loading.nearby || data.loading.crossings || data.loading.stories}
            onUserSelect={onUserSelect}
            onStoryClick={onStoryClick}
            onMatch={async (id) => {
              try {
                // Optimistic removal
                onRemoveNearby(id);
                onRemoveSuggested(id);
                await api.post('/connections/request', { target_user_id: id });
                toast.success('Connection Request Sent!');
              } catch (err) {
                console.error('Match failed:', err);
                toast.error('Failed to send request');
                onRefresh.nearby();
                onRefresh.suggested();
              }
            }}
            onPass={(id) => {
              onRemoveNearby(id);
              onRemoveSuggested(id);
              toast.success('User skipped');
            }}
          />
        );
      case 'nearby':
        return (
          <ExploreNearbyUsers
            users={data.nearbyUsers}
            loading={data.loading.nearby}
            onUserSelect={onUserSelect}
            onRefresh={onRefresh.nearby}
          />
        );
      case 'crossings':
        return (
          <ExploreCrossings
            crossings={data.crossings}
            loading={data.loading.crossings}
            onUserSelect={onUserSelect}
            onRefresh={onRefresh.crossings}
          />
        );
      case 'casting':
        return (
          <CastingGrid
            users={data.suggestedUsers}
            loading={data.loading.suggested}
            onMatch={async (id) => {
              try {
                onRemoveSuggested(id);
                await api.post('/connections/request', { target_user_id: id });
                toast.success('Connection Request Sent!');
              } catch (err) {
                console.error('Match failed:', err);
                toast.error('Failed to send request');
                onRefresh.suggested();
              }
            }}
            onPass={(id) => {
              onRemoveSuggested(id);
              toast.success('User skipped');
            }}
            onViewProfile={onUserSelect || (() => { })}
          />
        );
      case 'stories':
        return (
          <ExploreStoriesFeed
            stories={data.mapStories}
            loading={data.loading.stories}
            onRefresh={onRefresh.stories}
            onStoryClick={onStoryClick}
          />
        );
      case 'heatmap':
        return (
          <div className="flex flex-col items-center justify-center h-full p-20 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Flame className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-text-base mb-4">Heatmap is only available in Map View</h3>
            <p className="text-sm font-bold text-text-muted max-w-sm mb-8">Switching you to Map View now to see real-time activity clusters...</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggle_explore_view', { detail: 'map' }))}
              className="px-8 py-3 bg-brand-gradient text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Switch to Map View Now
            </button>
          </div>
        )
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
