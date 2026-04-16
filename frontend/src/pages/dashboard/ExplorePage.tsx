import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Map as MapIcon, 
  Users, 
  Footprints, 
  Sparkles, 
  PlayCircle, 
  Flame,
  Layout
} from 'lucide-react';
import { useExploreData } from '../../hooks/useExploreData';
import { ExploreFeed } from '../../components/explore/ExploreFeed';
import { ExploreSummary } from '../../components/explore/ExploreSummary';
import MapPage from './MapPage';

interface ExplorePageProps {
  onUserSelect?: (userId: string) => void;
  onStoryClick?: (stories: any[], index: number) => void;
  userPosition: [number, number] | null;
}

export type ExploreTab = 'all' | 'nearby' | 'crossings' | 'casting' | 'stories' | 'heatmap';

const ExplorePage = ({ onUserSelect, onStoryClick, userPosition }: ExplorePageProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState<ExploreTab>((searchParams.get('tab') as ExploreTab) || 'all');
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');

  const setActiveTab = (tab: ExploreTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ExploreTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
  }, [searchParams, activeTab]);
  
  const position = useMemo(() => 
    userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
  , [userPosition]);

  const { 
    nearbyUsers, 
    crossings, 
    suggestedUsers, 
    mapStories, 
    loading,
    refresh
  } = useExploreData(position);

  const tabs = [
    { id: 'all', label: 'All', icon: <Compass className="w-4 h-4" /> },
    { id: 'nearby', label: 'Nearby Users', icon: <Users className="w-4 h-4" /> },
    { id: 'crossings', label: 'Crossings', icon: <Footprints className="w-4 h-4" /> },
    { id: 'casting', label: 'Casting', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'stories', label: 'Stories', icon: <PlayCircle className="w-4 h-4" /> },
    { id: 'heatmap', label: 'Heatmap', icon: <Flame className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full w-full bg-bg-base flex flex-col overflow-hidden relative transition-colors duration-300">
      {/* Header & Tabs */}
      <header className="px-4 sm:px-8 pt-4 sm:pt-6 pb-4 bg-bg-base/80 backdrop-blur-xl border-b border-border-base sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-text-base">Explore</h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-[3px] mt-0.5 sm:mt-1">Discover your world</p>
          </div>

          <div className="flex items-center gap-1.5 bg-bg-card p-1 rounded-2xl border border-border-base self-start sm:self-auto">
            <button
              onClick={() => setViewMode('feed')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                viewMode === 'feed' 
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-pink-500/20' 
                  : 'text-text-muted hover:text-text-base'
              }`}
            >
              <Layout className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Feed View</span>
              <span className="xs:hidden">Feed</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all ${
                viewMode === 'map' 
                  ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-pink-500/20' 
                  : 'text-text-muted hover:text-text-base'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Map View</span>
              <span className="xs:hidden">Map</span>
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as ExploreTab);
                if (tab.id === 'heatmap') setViewMode('map');
              }}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeTab === tab.id
                  ? 'bg-text-base text-bg-base border-text-base shadow-xl scale-105 z-10'
                  : 'bg-bg-card text-text-muted border-border-base hover:border-text-muted/30'
              }`}
            >
              <span className="sm:hidden scale-90">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>


      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto no-scrollbar relative min-w-0">
          <AnimatePresence mode="wait">
            {viewMode === 'feed' ? (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
              >
                <ExploreFeed 
                  activeTab={activeTab}
                  data={{ nearbyUsers, crossings, suggestedUsers, mapStories, loading }}
                  onUserSelect={onUserSelect}
                  onRefresh={refresh}
                />
              </motion.div>
            ) : (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full"
              >
                <MapPage 
                  onUserSelect={onUserSelect} 
                  onStorySelect={onStoryClick}
                  userPosition={userPosition} 
                  // In map view, we might want to override some filters based on activeTab
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Dynamic Summary Panel */}
        <aside className="hidden xl:block w-80 border-l border-border-base bg-bg-card/30 backdrop-blur-sm overflow-y-auto no-scrollbar">
          <ExploreSummary 
            stats={{
              nearby: nearbyUsers.length,
              stories: mapStories.reduce((acc, c) => acc + (c.count || 0), 0),
              todayCrossings: crossings.filter(c => {
                const today = new Date().toISOString().split('T')[0];
                return c.last_crossing_at?.startsWith(today);
              }).length
            }}
            loading={loading.nearby || loading.crossings || loading.stories}
          />
        </aside>
      </div>
    </div>
  );
};

export default ExplorePage;
