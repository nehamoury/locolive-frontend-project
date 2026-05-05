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
  Layout,
  ArrowLeft
} from 'lucide-react';
import { useExploreData } from '../../hooks/useExploreData';
import { ExploreFeed } from '../../components/explore/ExploreFeed';
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
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('map');

  const setActiveTab = (tab: ExploreTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
    if (tab === 'heatmap') {
      setViewMode('map');
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get('tab') as ExploreTab;
    if (tabParam && tabParam !== activeTab) {
      setActiveTabState(tabParam);
    }
    // Always force map view for heatmap tab
    if (tabParam === 'heatmap') {
      setViewMode('map');
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const mode = (e as CustomEvent).detail as 'feed' | 'map';
      if (mode) setViewMode(mode);
    };
    window.addEventListener('toggle_explore_view', handleToggle);
    return () => window.removeEventListener('toggle_explore_view', handleToggle);
  }, []);

  const position = useMemo(() =>
    userPosition ? { lat: userPosition[0], lng: userPosition[1] } : null
    , [userPosition]);

  const {
    nearbyUsers,
    crossings,
    suggestedUsers,
    mapStories,
    loading,
    refresh,
    dismissUser
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

      {/* ─── Map View Overlay UI (Floating) ─── */}
      <AnimatePresence>
        {viewMode === 'map' && (
          <>
            {/* Minimalist Back to Feed Toggle (Naked Arrow) */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute top-6 left-4 z-[700]"
            >
              <button
                onClick={() => setViewMode('feed')}
                className="w-10 h-10 flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-all"
              >
                <ArrowLeft className="w-7 h-7 stroke-[2.5]" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Feed View Header (Structured) ─── */}
      <AnimatePresence>
        {viewMode === 'feed' && (
          <motion.header
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 sm:px-8 pt-6 pb-4 bg-bg-base/80 backdrop-blur-xl border-b border-border-base sticky top-0 z-30 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex flex-col">
                <h1 className="text-2xl sm:text-3xl font-black  uppercase tracking-tighter text-text-base">Explore</h1>
                <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-[3px] mt-1">Discover your world</p>
              </div>

              <div className="flex items-center gap-1.5 bg-bg-card p-1 rounded-2xl border border-border-base shadow-sm">
                <button
                  onClick={() => setViewMode('feed')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all bg-gradient-to-r from-primary to-accent text-white shadow-lg`}
                >
                  <Layout className="w-4 h-4" />
                  <span>Feed View</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all text-text-muted hover:text-text-base`}
                >
                  <MapIcon className="w-4 h-4" />
                  <span>Map View</span>
                </button>
              </div>
            </div>

            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ExploreTab)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeTab === tab.id
                      ? 'bg-text-base text-bg-base border-text-base shadow-xl'
                      : 'bg-bg-card text-text-muted border-border-base hover:border-text-muted/30'
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </motion.header>
        )}
      </AnimatePresence>


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
                  onStoryClick={onStoryClick}
                  onRefresh={refresh}
                  onRemoveSuggested={dismissUser}
                  onRemoveNearby={dismissUser}
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

      </div>
    </div>
  );
};

export default ExplorePage;
