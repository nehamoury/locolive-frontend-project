import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Home, Map as MapIcon, User, MessageSquare, Plus, Bell, Sun, Moon, Users, Search, Video, MoreVertical, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { Toaster } from 'react-hot-toast';
import { useNotifications } from '../../hooks/useNotifications';

// Views and Components
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import HomeView from './HomeView';
import { Profile } from './Profile';
import NotificationsView from './NotificationsView';
import ConnectionsView from './ConnectionsView';
import SettingsView from './SettingsView';
import SearchView from './SearchView';
import MemberProfileDetail from './MemberProfileDetail';
import { ManageHighlights } from './ManageHighlights';
import ExplorePage from './ExplorePage';
import ReelsView from '../../components/reels/ReelsView';
import { useGeolocation } from '../../hooks/useGeolocation';

// Modals
import CreatePostModal from '../../components/post/CreatePostModal';
import CreateReelModal from '../../components/reels/CreateReelModal';
import StoryViewer from '../../components/story/StoryViewer';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatProfileSidebar from '../../components/chat/ChatProfileSidebar';
import { IOSInstallBanner } from '../../components/ui/IOSInstallBanner';

const MemberProfileWrapper = ({ onMessage }: { onMessage: (id: string) => void }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  if (!id) return <Navigate to="/dashboard/home" replace />;
  return (
    <MemberProfileDetail
      userId={id}
      onBack={() => navigate(-1)}
      onMessage={onMessage}
    />
  );
};

const MessageThreadWrapper = ({
  onViewFullProfile,
  setShowChatProfile,
  showChatProfile
}: {
  onViewFullProfile: (id: string) => void;
  setShowChatProfile: React.Dispatch<React.SetStateAction<boolean>>;
  showChatProfile: boolean;
}) => {
  const { userId } = useParams();
  const navigate = useNavigate();

  if (!userId) return <Navigate to="/dashboard/messages" replace />;

  return (
    <>
      <div className="flex-1 h-full w-full border-r border-gray-100">
        <ChatWindow
          receiverId={userId}
          onBack={() => navigate('/dashboard/messages')}
          onToggleProfile={() => setShowChatProfile(prev => !prev)}
        />
      </div>
      <AnimatePresence>
        {showChatProfile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden lg:flex h-full shrink-0 bg-white overflow-y-auto no-scrollbar border-l border-gray-100"
          >
            <ChatProfileSidebar
              userId={userId}
              onViewFullProfile={onViewFullProfile}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Local Routing Helpers
  const activeTab = pathname.split('/').pop() || 'home';
  const setActiveTab = (tab: string) => navigate(`/dashboard/${tab}`);

  // Real-time & Location Hooks
  const { position: currentGeoPos, permissionState: geoPermission } = useGeolocation(true);
  const {
    unreadCount: totalUnreadCount,
    unreadMessagesCount,
    notificationPermission,
    requestPermission
  } = useNotifications();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateReelModalOpen, setIsCreateReelModalOpen] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [viewingStories, setViewingStories] = useState<any[]>([]);
  const [viewingStoryIndex, setViewingStoryIndex] = useState<number | null>(null);

  const activeConnectionTab = 'suggestions'; // Simplified for now
  const [, setPanicSequence] = useState('');
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRightSidebar] = useState(true);
  const [showChatProfile, setShowChatProfile] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click outside listener for mobile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Sidebar Stats State
  const [crossingsCount, setCrossingsCount] = useState<number>(0);
  const [nearbyCount, setNearbyCount] = useState<number>(0);
  const [storiesCount, setStoriesCount] = useState<number>(0);
  const [isSyncingStats, setIsSyncingStats] = useState(false);

  // Router-aware visibility
  const showSidebarRoutes = ['home', 'discovery']; // Tab IDs where sidebar is visible
  const isSidebarVisible = showSidebarRoutes.includes(activeTab);

  // Core Data Fetching
  const fetchStories = useCallback(async () => {
    setLoadingStories(prev => {
      if (prev) return prev;
      return true;
    });
    try {
      // Use the stable coordinate from useGeolocation instead of calling browser API again
      const coords = currentGeoPos;
      const requestOptions = coords ? { params: { latitude: coords.lat, longitude: coords.lng } } : undefined;

      console.log('[Dashboard] Fetching stories...', coords ? `with coords: ${coords.lat}, ${coords.lng}` : 'without coords');

      const promises: any[] = [
        api.get('/stories/connections').catch(() => ({ data: [] })),
        api.get('/stories/me').catch(() => ({ data: [] }))
      ];

      if (coords) {
        promises.push(api.get('/feed', requestOptions).catch(() => ({ data: { stories: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { stories: [] } }));
      }

      const [connResponse, meResponse, feedResponse] = await Promise.all(promises);

      const mapStories = feedResponse.data?.stories || [];
      const connStories = connResponse.data || [];
      const myStories = meResponse.data || [];

      console.log('[Dashboard] API responses:', {
        mapStories: mapStories.length,
        connStories: connStories.length,
        myStories: myStories.length,
        feedData: feedResponse.data
      });

      const allStories = [...mapStories, ...connStories, ...myStories];
      const uniqueMap = new Map();
      allStories.forEach(s => {
        if (!uniqueMap.has(s.id)) {
          uniqueMap.set(s.id, s);
        }
      });
      const uniqueStories = Array.from(uniqueMap.values());
      uniqueStories.sort((a, b) => new Date(Object(b).created_at).getTime() - new Date(Object(a).created_at).getTime());

      console.log(`[Dashboard] Total unique stories: ${uniqueStories.length}`);
      setStories(uniqueStories);
    } catch (err: any) {
      console.error('[Dashboard] Failed to fetch stories:', err.response?.data || err.message);
      setStories([]);
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoadingStories(false);
    }
  }, [logout, currentGeoPos]);

  // Removed manual message unread count (now handled by useNotifications)


  const fetchSidebarStats = useCallback(async () => {
    setIsSyncingStats(true);
    try {
      // Always fetch crossings (no location needed)
      const crossRes = await api.get('/crossings').catch(() => ({ data: [] }));
      const data = crossRes.data || [];
      const today = new Date().toISOString().split('T')[0];
      const todayCrossings = data.filter((c: any) => c.last_crossing_at?.startsWith(today));
      setCrossingsCount(todayCrossings.length);

      // Use the stable coordinate from useGeolocation
      if (currentGeoPos) {
        const lat = currentGeoPos.lat;
        const lng = currentGeoPos.lng;

        const [nearbyRes, feedRes] = await Promise.all([
          api.get('/users/nearby', { params: { lat, lng, radius: 5 } }).catch(() => ({ data: [] })),
          api.get('/feed', { params: { latitude: lat, longitude: lng } }).catch(() => ({ data: { stories: [] } }))
        ]);

        setNearbyCount(nearbyRes.data?.length || 0);
        setStoriesCount(feedRes.data?.stories?.length || 0);
      }

    } catch (err) {
      console.error('Failed to sync sidebar stats:', err);
    } finally {
      setTimeout(() => setIsSyncingStats(false), 1000);
    }
  }, [currentGeoPos]);

  // Panic & Data Polling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const char = e.key.toUpperCase();
      if ("DELETE".includes(char)) {
        setPanicSequence((prev: string) => {
          const next = (prev + char).slice(-6);
          if (next === "DELETE") setShowPanicConfirm(true);
          return next;
        });
      } else {
        setPanicSequence('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    fetchStories();
    fetchSidebarStats();

    const handleConnectionAccepted = () => {
      console.log('Connection accepted, refreshing stories & stats...');
      fetchStories();
      fetchSidebarStats();
    };

    window.addEventListener('connection_accepted', handleConnectionAccepted);

    const interval = setInterval(() => {
      fetchSidebarStats();
    }, 10000); // Faster sync: 10 seconds for "real-time" feel

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('connection_accepted', handleConnectionAccepted);
      clearInterval(interval);
    };
  }, [fetchStories, fetchSidebarStats]);

  useEffect(() => {
    if (activeTab === 'home') {
      fetchStories();
    }
  }, [activeTab, fetchStories]);

  const handlePanic = async () => {
    try {
      await api.post('/location/panic');
      logout();
      navigate('/login');
    } catch (err) {
      console.error("Panic failed:", err);
    }
  };

  const handleUserSelect = (userId: string) => {
    navigate(`/dashboard/user/${userId}`);
  };

  const handleStartMessage = (userId: string) => {
    navigate(`/dashboard/messages/${userId}`);
  };

  // ─── Render Routing ────────────────────────────────────────────────────────
  const renderRoutes = () => {
    return (
      <Routes>
        <Route path="home" element={
          <HomeView
            key={`home-${refreshKey}`}
            stories={stories}
            user={user}
            loading={loadingStories}
            onCreateStory={() => setIsCreateModalOpen(true)}
            onStoryClick={(userStories, index) => {
              setViewingStories(userStories);
              setViewingStoryIndex(index);
            }}
            unreadNotificationsCount={totalUnreadCount}
            unreadMessagesCount={unreadMessagesCount}
          />
        } />
        <Route path="profile/:id?" element={<Profile onLogout={logout} />} />
        <Route path="manage-highlights" element={<ManageHighlights onBack={() => navigate(`/dashboard/profile/${user?.id}`)} />} />
        <Route path="notifications" element={<NotificationsView onUserSelect={handleUserSelect} />} />
        <Route 
          path="explore" 
          element={
            <ExplorePage 
              onUserSelect={handleUserSelect} 
              onStoryClick={(userStories, index) => {
                setViewingStories(userStories);
                setViewingStoryIndex(index);
              }}
              userPosition={currentGeoPos ? [currentGeoPos.lat, currentGeoPos.lng] : null} 
            />
          } 
        />
        <Route path="connections" element={
          <ConnectionsView
            initialTab={activeConnectionTab}
            onUserSelect={handleUserSelect}
            onMessage={handleStartMessage}
          />
        } />
        <Route path="settings" element={<SettingsView onBack={() => navigate(`/dashboard/profile/${user?.id}`)} />} />
        <Route path="search" element={<SearchView onUserSelect={handleUserSelect} />} />
        <Route path="user/:id" element={<MemberProfileWrapper onMessage={handleStartMessage} />} />
        <Route path="crossings" element={<Navigate to="/dashboard/explore?tab=crossings" replace />} />
        <Route path="casting" element={<Navigate to="/dashboard/explore?tab=casting" replace />} />
        <Route path="discovery" element={<Navigate to="/dashboard/explore?tab=all" replace />} />
        <Route path="reels" element={<ReelsView onCreateReel={() => setIsCreateReelModalOpen(true)} />} />

        <Route path="messages/*" element={
          <div className="flex flex-col h-full w-full overflow-hidden bg-transparent pt-2 pb-6 px-0 md:px-2">
            <div className="flex flex-col h-full w-full overflow-hidden bg-bg-card md:rounded-[32px] border border-border-base/50 shadow-2xl relative">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-base bg-bg-card/50 backdrop-blur-md shrink-0 z-20">
                <h2 className="text-xl font-black text-gray-900 italic tracking-tight">Messages</h2>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {/* Visual flair: Active avatars placeholder */}
                    <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-primary/20" />
                    <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-accent/20" />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden relative z-10">
                {/* Left Sidebar: Conversations List (Persistent) */}
                <div className={`h-full border-r border-border-base w-full md:w-[320px] lg:w-[380px] shrink-0 bg-transparent ${pathname.includes('/dashboard/messages/') && pathname.split('/').pop() !== 'messages'
                  ? 'hidden md:flex'
                  : 'flex'
                  }`}>
                  <ChatList
                    onSelect={(id) => navigate(`/dashboard/messages/${id}`)}
                    selectedId={pathname.split('/').pop()}
                  />
                </div>

                {/* Main Area: Chat Window + Profile Sidebar (Dynamic) */}
                <div className={`flex-1 flex overflow-hidden ${!(pathname.includes('/dashboard/messages/') && pathname.split('/').pop() !== 'messages')
                  ? 'hidden md:flex'
                  : 'flex'
                  }`}>
                  <Routes>
                    <Route path=":userId" element={
                      <MessageThreadWrapper
                        onViewFullProfile={handleUserSelect}
                        setShowChatProfile={setShowChatProfile}
                        showChatProfile={showChatProfile}
                      />
                    } />
                    <Route path="/" element={
                      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-gray-50/20">
                        <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl shadow-primary/5 flex items-center justify-center mb-6 border border-white/60">
                          <MessageSquare className="w-10 h-10 text-primary/30" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight italic">Your Inbox</h3>
                        <p className="max-w-xs text-[10px] font-black text-gray-400 leading-relaxed uppercase tracking-[0.2em]">
                          Select a conversation from the left to start a new journey
                        </p>
                      </div>
                    } />
                  </Routes>
                </div>
              </div>
            </div>
          </div>
        } />

        <Route path="/" element={<Navigate to="home" replace />} />
      </Routes>
    );
  };

  return (
    <div className="h-screen w-full bg-bg-base text-text-base font-poppins flex overflow-hidden p-0 md:p-4 md:gap-4 transition-colors duration-300">

      {/* 1. Left Sidebar - Desktop Only */}
      <div className="hidden md:flex flex-col h-full bg-bg-sidebar md:rounded-[28px] shadow-xl relative flex-shrink-0 border border-border-base transition-all duration-300 overflow-hidden z-[110]">
        <Sidebar
          user={user}
          logout={logout}
          unreadCount={totalUnreadCount}
          unreadMessagesCount={unreadMessagesCount}
          notificationPermission={notificationPermission}
          requestPermission={requestPermission}
          onCreatePost={() => setIsCreateModalOpen(true)}
        />
      </div>

      <Toaster position="top-right" reverseOrder={false} />

      {/* 2. Main Content Center (Scrollable) */}
      <main className={`flex-1 relative ${pathname.includes('reels') ? 'overflow-hidden h-full' : 'overflow-y-auto'} md:overflow-hidden flex flex-col bg-transparent z-10 w-full ${pathname.includes('messages') ? 'md:max-w-none xl:max-w-none px-0 md:px-4' : 'md:max-w-5xl xl:max-w-6xl mx-auto'} transition-colors duration-300 ${pathname.includes('reels') ? 'pb-0' : 'pb-20'} md:pb-0 no-scrollbar`}>

        {/* Mobile Header — Ultra Premium Glass (Now Scrolling) */}
        <div className={`md:hidden relative w-full pt-6 pb-4 px-6 flex items-center justify-between bg-transparent transition-all ${pathname.includes('reels') ? 'hidden' : 'flex'}`}>
          <div
            className="flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            onClick={() => navigate('/dashboard/home')}
          >
            <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21C16 17 20 13.4183 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 13.4183 8 17 12 21Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xl font-black italic tracking-tighter text-primary">Locolive</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard/search')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#fff5f7]/60 dark:bg-pink-500/10 backdrop-blur-xl border border-pink-200/30 dark:border-white/10 shadow-sm active:scale-95 transition-all text-indigo-500"
              aria-label="Search"
            >
              <Search className="w-5 h-5 transition-transform group-active:scale-90" />
            </button>
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-xl border shadow-sm transition-all active:scale-95 ${isMenuOpen ? 'bg-[#fff5f7] text-pink-600 border-pink-300/50 shadow-pink-100/30' : 'bg-[#fff5f7]/60 dark:bg-pink-500/10 text-pink-500 border-pink-200/30 dark:border-white/10'}`}
              aria-label="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Premium Mobile Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="absolute top-16 right-4 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-2xl z-[100]"
                >
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { navigate('/dashboard/connections'); setIsMenuOpen(false); }}
                      className="w-44 h-11 px-3 bg-brand-gradient rounded-xl flex items-center gap-3 shadow-lg shadow-primary/20 active:scale-95 transition-all text-white"
                    >
                      <Users className="w-5 h-5" />
                      <span className="text-[13px] font-bold tracking-wide">Connections</span>
                    </button>

                    <button
                      onClick={() => { toggleTheme(); setIsMenuOpen(false); }}
                      className="w-44 h-11 px-3 bg-white/5 dark:bg-white/5 hover:bg-white/10 backdrop-blur-3xl border border-white/10 rounded-xl flex items-center gap-3 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <span className="text-[13px] font-bold text-slate-100">Appearance</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('notifications'); setIsMenuOpen(false); }}
                      className="w-44 h-11 px-3 bg-white/5 dark:bg-white/5 hover:bg-white/10 backdrop-blur-3xl border border-white/10 rounded-xl flex items-center gap-3 shadow-sm active:scale-95 transition-all"
                    >
                      <div className="relative w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <Bell className="w-5 h-5" />
                        {totalUnreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white dark:border-black flex items-center justify-center shadow-sm">
                            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] font-bold text-slate-100">Notifications</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Location Permission Warning Banner */}
        {geoPermission === 'denied' && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span className="text-amber-800">
              Location access denied. Enable it in your browser settings to see nearby content.
            </span>
            <button
              onClick={() => window.open('https://support.google.com/chrome/answer/142065', '_blank')}
              className="text-amber-700 underline hover:text-amber-900 font-medium ml-2"
            >
              Learn how
            </button>
          </div>
        )}

        {/* Dynamic Route View */}
        <div className="flex-1 overflow-visible md:overflow-hidden relative">
          {renderRoutes()}
        </div>

        {/* Mobile Bottom Navigation — Full Width Bar (Hidden on Reels for Immersion) */}
        {!pathname.includes('reels') && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around bg-bg-sidebar z-[100] safe-area-bottom border-t border-border-base transition-all duration-300">
            <div className="flex-1 flex items-center justify-around h-16 pointer-events-auto px-4">
              <MobileNavItem icon={<Home className="w-5 h-5" />} active={pathname.includes('home')} onClick={() => navigate('/dashboard/home')} />
              <MobileNavItem icon={<MapIcon className="w-5 h-5" />} active={pathname.includes('explore')} onClick={() => navigate('/dashboard/explore')} />

              <div className="relative mx-1 h-full flex items-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-12 h-12 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 text-white"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                </motion.button>
              </div>

              <MobileNavItem icon={<Video className="w-5 h-5" />} active={pathname.includes('reels')} onClick={() => navigate('/dashboard/reels')} />
              <MobileNavItem icon={<User className="w-5 h-5" />} active={pathname.includes('profile')} onClick={() => navigate(`/dashboard/profile/${user?.id}`)} />
            </div>
          </nav>
        )}
      </main>


      {/* Right Sidebar — collapsible */}
      <div
        className={`hidden lg:flex flex-col overflow-hidden transition-all duration-300 ease-in-out bg-transparent md:rounded-[24px] relative z-[110] ${showRightSidebar && isSidebarVisible ? 'w-80 opacity-100 px-0' : 'w-0 opacity-0 px-0 invisible'
          }`}
      >
        <div className="h-full bg-bg-sidebar border border-border-base md:rounded-[24px] overflow-hidden transition-colors duration-300">
          <RightSidebar
            crossingsToday={crossingsCount}
            nearbyCount={nearbyCount}
            storiesCount={storiesCount}
            isSyncing={isSyncingStats}
          />
        </div>
      </div>

      {/* Overlays / Modals */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchStories();
          setRefreshKey(prev => prev + 1);
        }}
        onRequestReelModal={() => {
          setIsCreateModalOpen(false);
          setIsCreateReelModalOpen(true);
        }}
      />

      <CreateReelModal
        isOpen={isCreateReelModalOpen}
        onClose={() => setIsCreateReelModalOpen(false)}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />

      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={viewingStories}
          initialIndex={viewingStoryIndex}
          onClose={() => {
            setViewingStoryIndex(null);
            setViewingStories([]);
          }}
          currentUser={user?.username}
          currentUserID={user?.id}
          onDelete={(storyId) => {
            setStories(prev => prev.filter(s => s.id !== storyId));
            setViewingStories(prev => prev.filter(s => s.id !== storyId));
          }}
        />
      )}

      {showPanicConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/10 backdrop-blur-xl p-6">
          <div className="bg-white border border-gray-100 p-8 rounded-[40px] max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <ShieldAlert className="w-11 h-11" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">System Purge?</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">
              This will permanently wipe all your data from this device and the server. This action cannot be undone.
            </p>
            <div className="space-y-3">
              <button
                onClick={handlePanic}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-100"
              >
                Execute Purge
              </button>
              <button
                onClick={() => setShowPanicConfirm(false)}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <IOSInstallBanner />
    </div>
  );
};

// Mobile Nav Item helper
const MobileNavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-label="Navigate"
    aria-current={active ? 'page' : undefined}
    className={`relative flex flex-col items-center justify-center p-3 transition-all duration-300 rounded-2xl ${active
      ? 'text-primary'
      : 'text-slate-900/60 hover:text-slate-900 transition-colors'
      }`}
  >

    <motion.div
      animate={{
        scale: active ? 1.05 : 1,
        y: active ? -1 : 0
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className="relative z-10"
    >
      {icon}
    </motion.div>
    {active && (
      <motion.div
        layoutId="active-mobile-nav-indicator"
        className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,0,110,0.6)]"
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

export default Dashboard;
