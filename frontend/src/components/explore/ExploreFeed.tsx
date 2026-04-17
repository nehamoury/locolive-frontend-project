import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
            onViewProfile={onUserSelect || (() => {})}
          />
        );
      case 'stories':
        return (
          <ExploreStoriesFeed 
            stories={data.mapStories}
            loading={data.loading.stories}
            onRefresh={onRefresh.stories}
          />
        );
      case 'heatmap':
        return (
          <div className="flex flex-col items-center justify-center h-full p-20 text-center">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-text-base mb-4">You're in Heatmap Mode</h3>
            <p className="text-sm font-bold text-text-muted max-w-sm">Switch to Map View in the top right to see real-time activity clusters in your area.</p>
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
