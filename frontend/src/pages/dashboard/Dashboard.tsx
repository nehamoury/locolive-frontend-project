import { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Home, User, MessageSquare, Plus, Search, Bell, MapPin, Clapperboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { toast } from 'react-hot-toast';

// Views and Components
import Sidebar from '../../components/layout/Sidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import HomeView from './HomeView';
import { Profile } from './Profile';
import NotificationsView from './NotificationsView';
import ConnectionsView from './ConnectionsView';
import SettingsView from './SettingsView';
import SearchView from './SearchView';
import { ManageHighlights } from './ManageHighlights';
import ExplorePage from './ExplorePage';
import ReelsView from '../../components/reels/ReelsView';
import MapPage from './MapPage';
import SavedView from './SavedView';
import { useGeolocation } from '../../hooks/useGeolocation';
import { getMediaUrl } from '../../utils/media';

// Modals
import CreatePostModal from '../../components/post/CreatePostModal';
import CreateReelModal from '../../components/reels/CreateReelModal';
import StoryViewer from '../../components/story/StoryViewer';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatProfileSidebar from '../../components/chat/ChatProfileSidebar';
import { IOSInstallBanner } from '../../components/ui/IOSInstallBanner';

const MobileChatWrapper = ({ onUserSelect }: { onUserSelect: (id: string) => void }) => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isGroup = searchParams.get('isGroup') === 'true';

  if (!userId) return <Navigate to="/dashboard/messages" replace />;

  return (
    <div className="flex-1 w-full h-[100dvh]">
      <ChatWindow
        receiverId={userId}
        isGroup={isGroup}
        onBack={() => navigate('/dashboard/messages')}
        onToggleProfile={() => onUserSelect(userId)}
      />
    </div>
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
  const [searchParams] = useSearchParams();
  const isGroup = searchParams.get('isGroup') === 'true';
  const navigate = useNavigate();

  if (!userId) return <Navigate to="/dashboard/messages" replace />;

  return (
    <>
      <div className="flex-1 h-full w-full border-r border-border-base">
        <ChatWindow
          receiverId={userId}
          isGroup={isGroup}
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
            className="hidden lg:flex h-full shrink-0 bg-bg-card overflow-y-auto no-scrollbar border-l border-border-base"
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

const MobileNavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-primary/10 text-primary scale-110' : 'text-text-muted hover:text-primary active:scale-90'}`}
  >
    {icon}
  </button>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  useTheme(); // keep theme context mounted
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();


  // Real-time & Location Hooks
  const { position: currentGeoPos } = useGeolocation(true);
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
  const [isSyncingStats, setIsSyncingStats] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const storiesCount = 0;
  const crossingsCount = 0;
  const [refreshKey, setRefreshKey] = useState(0);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [fullscreenOverlay, setFullscreenOverlay] = useState(false);

  useEffect(() => {
    const open = () => setFullscreenOverlay(true);
    const close = () => setFullscreenOverlay(false);
    window.addEventListener('highlight_viewer_open', open);
    window.addEventListener('highlight_viewer_close', close);
    return () => {
      window.removeEventListener('highlight_viewer_open', open);
      window.removeEventListener('highlight_viewer_close', close);
    };
  }, []);

  const handleActivatePanicMode = async () => {
    try {
      await api.post('/users/panic');
      toast.success('Panic Mode Activated! Disappearing...');
      // The backend will force logout via WebSocket, but let's be safe
      setTimeout(() => logout(), 1000);
    } catch (err) {
      toast.error('Failed to activate panic mode');
    } finally {
      setShowPanicConfirm(false);
    }
  };

  const [showChatProfile, setShowChatProfile] = useState(false);

  // Stats fetching logic (no dependencies to avoid recreating on every render)
  const fetchStats = useCallback(async (coords?: { lat: number, lng: number }) => {
    setIsSyncingStats(true);
    try {
      if (!coords) {
        // Can't fetch nearby without coordinates — skip silently
        setNearbyCount(0);
        return;
      }
      // /users/nearby requires lat & lng as query params
      const res = await api.get(`/users/nearby?lat=${coords.lat}&lng=${coords.lng}`);
      const nearbyUsers = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setNearbyCount(nearbyUsers.length);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setIsSyncingStats(false);
    }
  }, []);

  const fetchStories = useCallback(async (coords?: { lat: number, lng: number }) => {
    setLoadingStories(true);
    try {
      if (!coords) {
        // /feed requires latitude & longitude — skip until we have coords
        setLoadingStories(false);
        return;
      }
      // Backend getFeedRequest uses "latitude" and "longitude" (not lat/lng)
      const url = `/feed?latitude=${coords.lat}&longitude=${coords.lng}`;
      const res = await api.get(url);
      const feedItems = res.data?.stories || [];
      const userStories = res.data?.my_stories || [];
      const allStories = [...userStories, ...feedItems];
      const uniqueStories = Array.from(new Map(allStories.map(s => [s.id, s])).values());
      setStories(uniqueStories);
    } catch (err) {
      console.error('Failed to fetch stories', err);
    } finally {
      setLoadingStories(false);
    }
  }, []);

  useEffect(() => {
    if (!currentGeoPos) return; // Wait for geolocation before fetching
    fetchStats(currentGeoPos);
    fetchStories(currentGeoPos);
  }, [currentGeoPos, refreshKey]);



  const handleStoryClick = (userStories: any[], index: number) => {
    setViewingStories(userStories);
    setViewingStoryIndex(index);
  };

  const handleUserSelect = (userData: string | { id: string, username?: string }) => {
    if (typeof userData === 'string') {
      navigate(`/dashboard/user/${userData}`);
    } else {
      const path = userData.username ? `/dashboard/u/${userData.username}` : `/dashboard/user/${userData.id}`;
      navigate(path);
    }
  };

  const showRightSidebar = !pathname.includes('profile') && !pathname.includes('user') && !pathname.includes('settings') && !pathname.includes('notifications') && !pathname.includes('explore') && !pathname.includes('connections') && !pathname.includes('manage-highlights');

  // ─── Memoized Sub-Routes ───────────────────────────────────────────────────
  // We useMemo here to prevent the entire route tree from remounting 
  // every time the Dashboard re-renders (e.g. when geolocation updates).
  const renderedRoutes = useMemo(() => {
    return (
      <Routes>
        <Route path="home" element={
          <HomeView
            stories={stories}
            user={user}
            loading={loadingStories}
            onCreateStory={() => setIsCreateModalOpen(true)}
            onStoryClick={handleStoryClick}
          />
        } />
        <Route path="explore" element={<ExplorePage onUserSelect={handleUserSelect} onStoryClick={handleStoryClick} userPosition={currentGeoPos ? [currentGeoPos.lat, currentGeoPos.lng] : null} />} />
        <Route path="reels" element={<ReelsView onCreateReel={() => setIsCreateReelModalOpen(true)} />} />
        <Route path="map" element={<MapPage />} />
        <Route path="connections" element={
          <ConnectionsView
            initialTab={(searchParams.get('tab') as any) || 'followers'}
            onUserSelect={handleUserSelect}
            onMessage={(id) => navigate(`/dashboard/messages/${id}`)}
          />
        } />
        <Route path="notifications" element={<NotificationsView />} />
        <Route path="settings/*" element={<SettingsView onBack={() => navigate('/dashboard/home')} />} />
        <Route path="search" element={<SearchView />} />
        <Route path="user/:id" element={<Profile onCreatePost={() => setIsCreateModalOpen(true)} />} />
        <Route path="profile/:id" element={<Profile onCreatePost={() => setIsCreateModalOpen(true)} />} />
        <Route path="u/:id" element={<Profile onCreatePost={() => setIsCreateModalOpen(true)} />} />
        <Route path="saved" element={<SavedView />} />
        <Route path="manage-highlights" element={<ManageHighlights onBack={() => navigate(-1)} />} />

        <Route path="messages/*" element={
          <div className="flex-1 flex flex-col h-full bg-white md:rounded-[32px] overflow-hidden border border-border-base/40 shadow-sm">
            <div className="flex flex-col h-full">
              <div className="flex flex-1 overflow-hidden relative z-10 bg-white">
                <div className={`h-full border-r border-border-base/30 w-full md:w-[340px] lg:w-[380px] shrink-0 bg-white/40 ${pathname.includes('/dashboard/messages/') && pathname.split('/').pop() !== 'messages'
                  ? 'hidden md:flex'
                  : 'flex'
                  }`}>
                  <ChatList
                    onSelect={(id, isGroup) => navigate(`/dashboard/messages/${id}${isGroup ? '?isGroup=true' : ''}`)}
                    selectedId={pathname.split('/').pop()}
                  />
                </div>

                <div className={`flex-1 flex overflow-hidden bg-white ${!(pathname.includes('/dashboard/messages/') && pathname.split('/').pop() !== 'messages')
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
                      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-bg-base/5">
                        <div className="w-24 h-24 bg-bg-card rounded-4xl shadow-2xl shadow-black/10 flex items-center justify-center mb-6 border border-border-base/40 relative">
                          <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                          <MessageSquare className="w-10 h-10 text-primary/50 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black text-text-base mb-2 tracking-tight">Your Inbox</h3>
                        <p className="max-w-xs text-[10px] font-black text-text-muted/60 leading-relaxed uppercase tracking-[0.3em]">
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
  }, [stories, loadingStories, currentGeoPos, pathname, showChatProfile, totalUnreadCount, unreadMessagesCount]);

  return (
    <div className="h-[100dvh] w-full bg-bg-base text-text-base font-body flex overflow-hidden p-0 md:gap-0 transition-colors duration-400">

      {/* 1. Left Sidebar - Desktop/Tablet */}
      {!fullscreenOverlay && (
        <div className="hidden md:flex flex-col h-full bg-bg-sidebar md:rounded-[24px] lg:rounded-[28px] shadow-soft relative shrink-0 border border-border-base transition-all duration-300 overflow-hidden z-[110]">
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
      )}


      {/* 2. Main Desktop Structure */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden h-full gap-0 relative">

        {/* Desktop Content Row */}
        <div className="flex-1 flex overflow-hidden gap-0">
          <main className="flex-1 relative flex flex-col overflow-y-auto bg-transparent z-10 no-scrollbar">
            {renderedRoutes}
          </main>

          {/* Right Sidebar Desktop */}
          {!fullscreenOverlay && showRightSidebar && !pathname.includes('messages') && !pathname.includes('reels') && (
            <div className="hidden xl:flex w-72 xl:w-80 shrink-0 h-full">
              <div className="w-full h-full bg-bg-sidebar border-l border-border-base overflow-hidden shadow-sm">
                <RightSidebar
                  crossingsToday={crossingsCount}
                  nearbyCount={nearbyCount}
                  storiesCount={storiesCount}
                  isSyncing={isSyncingStats}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Mobile View Structure */}
      <main className="md:hidden flex-1 flex flex-col relative overflow-hidden h-[100dvh] w-full bg-bg-base">


        {/* Mobile Main Content Area - Scrollable */}
        <div className={`flex-1 overflow-y-auto no-scrollbar ${(pathname.includes('reels') || (pathname.includes('/dashboard/messages/') && pathname.split('/').length > 3)) ? 'pb-0' : 'pb-20'}`}>
          {/* Mobile Header - Only visible on Home page */}
          {pathname.endsWith('/home') && !isCreateModalOpen && (
            <div className="w-full pt-2 pb-2 px-3 flex items-center justify-between bg-bg-base/80 backdrop-blur-xl relative z-[100] shrink-0">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard/explore')}>
                <div className="w-10 h-10 rounded-full bg-bg-card flex items-center justify-center shadow-[0_4px_20px_rgba(255,59,142,0.15)] border border-primary/5">
                  <MapPin className="w-5.5 h-5.5 text-primary fill-primary/5" />
                </div>
                <span className="text-[24px] font-black tracking-tight text-primary font-brand">Locolive</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Messages Button */}
                <button
                  onClick={() => navigate('/dashboard/messages')}
                  className="relative p-2 text-text-muted hover:text-primary active:scale-90 transition-all"
                >
                  <MessageSquare className="w-6 h-6 stroke-[2.2]" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute top-0 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                {/* Notifications Button */}
                <button
                  onClick={() => navigate('/dashboard/notifications')}
                  className="relative p-2 text-text-muted hover:text-primary active:scale-90 transition-all"
                >
                  <Bell className="w-6 h-6 stroke-[2.2]" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute top-0 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                      {totalUnreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
          <Routes>
            <Route path="home" element={
              <HomeView
                stories={stories}
                user={user}
                loading={loadingStories}
                onCreateStory={() => setIsCreateModalOpen(true)}
                onStoryClick={handleStoryClick}
              />
            } />
            <Route path="explore" element={<ExplorePage onUserSelect={handleUserSelect} onStoryClick={handleStoryClick} userPosition={currentGeoPos ? [currentGeoPos.lat, currentGeoPos.lng] : null} />} />
            <Route path="reels" element={<ReelsView onCreateReel={() => setIsCreateReelModalOpen(true)} />} />
            <Route path="map" element={<MapPage />} />
            <Route path="connections" element={
              <ConnectionsView
                initialTab={(searchParams.get('tab') as any) || 'followers'}
                onUserSelect={handleUserSelect}
                onMessage={(id) => navigate(`/dashboard/messages/${id}`)}
              />
            } />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="settings/*" element={<SettingsView onBack={() => navigate('/dashboard/home')} />} />
            <Route path="search" element={<SearchView />} />
            <Route path="user/:id" element={<Profile />} />
            <Route path="profile/:id" element={<Profile />} />
            <Route path="manage-highlights" element={<ManageHighlights onBack={() => navigate(-1)} />} />
            <Route path="messages/*" element={
              <div className="flex-1 flex flex-col h-full bg-bg-card overflow-hidden">
                <Routes>
                  <Route path=":userId" element={<MobileChatWrapper onUserSelect={handleUserSelect} />} />
                  <Route path="/" element={
                    <ChatList onSelect={(id) => navigate(`/dashboard/messages/${id}`)} selectedId={pathname.split('/').pop()} />
                  } />
                </Routes>
              </div>
            } />
            <Route path="/" element={<Navigate to="home" replace />} />
          </Routes>
        </div>

        <IOSInstallBanner />

        {/* Mobile Tab Bar */}
        {!fullscreenOverlay && !pathname.includes('reels') && !(pathname.includes('messages') && pathname.split('/').length > 3) && (
          <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-bg-sidebar/90 backdrop-blur-xl flex items-center justify-around z-[100] border-t border-border-base px-6 safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
            <MobileNavItem icon={<Home className="w-7 h-7" />} active={pathname.includes('home')} onClick={() => navigate('/dashboard/home')} />
            <MobileNavItem icon={<Search className="w-7 h-7" />} active={pathname.includes('search')} onClick={() => navigate('/dashboard/search')} />
            
            {/* Center Add Button with Pink Glow */}
            <div className="relative -mt-10">
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full scale-150 animate-pulse" />
              <motion.button
                whileTap={{ scale: 0.85, rotate: 90 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="relative w-14 h-14 bg-brand-gradient rounded-[22px] flex items-center justify-center shadow-[0_8px_20px_rgba(255,59,142,0.4)] text-white"
              >
                <Plus className="w-9 h-9 stroke-[3]" />
              </motion.button>
            </div>

            <MobileNavItem icon={<Clapperboard className="w-7 h-7" />} active={pathname.includes('reels')} onClick={() => navigate('/dashboard/reels')} />
            <MobileNavItem
              icon={user?.avatar_url ? (
                <div className={`w-8 h-8 rounded-full p-[1.5px] ${pathname.includes('profile') ? 'bg-primary' : 'bg-bg-card border border-border-base'}`}>
                  <img
                    src={getMediaUrl(user.avatar_url)}
                    className="w-full h-full rounded-full object-cover bg-bg-card"
                    alt=""
                  />
                </div>
              ) : (
                <User className="w-7 h-7" />
              )}
              active={pathname.includes('profile')}
              onClick={() => navigate(`/dashboard/profile/${user?.id}`)}
            />
          </nav>
        )}
      </main>

      {/* Modals & Overlays */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { fetchStories(); setRefreshKey(prev => prev + 1); }}
        onRequestReelModal={() => { setIsCreateModalOpen(false); setIsCreateReelModalOpen(true); }}
      />
      <CreateReelModal
        isOpen={isCreateReelModalOpen}
        onClose={() => setIsCreateReelModalOpen(false)}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
      {viewingStoryIndex !== null && (
        <StoryViewer
          stories={viewingStories}
          initialIndex={viewingStoryIndex}
          onClose={() => { setViewingStoryIndex(null); setViewingStories([]); }}
          currentUser={user?.username}
          currentUserID={user?.id}
          onDelete={(storyId) => {
            setStories(prev => prev.filter(s => s.id !== storyId));
            setViewingStories(prev => prev.filter(s => s.id !== storyId));
          }}
        />
      )}
      {showPanicConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-6">
          <div className="bg-bg-card rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-border-base text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-text-base mb-2">Are you sure?</h2>
            <p className="text-text-muted mb-8 font-medium">This will immediately hide your location and profile from everyone nearby.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleActivatePanicMode}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 active:scale-95 transition-all"
              >
                YES, DISAPPEAR NOW
              </button>
              <button onClick={() => setShowPanicConfirm(false)} className="w-full py-4 bg-bg-base text-text-base rounded-2xl font-bold border border-border-base">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
