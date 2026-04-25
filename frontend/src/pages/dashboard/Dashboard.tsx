import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Home, User, MessageSquare, Plus, Bell, Search, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { Toaster } from 'react-hot-toast';
import { useNotifications } from '../../hooks/useNotifications';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

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
import { useGeolocation } from '../../hooks/useGeolocation';

// Modals
import CreatePostModal from '../../components/post/CreatePostModal';
import CreateReelModal from '../../components/reels/CreateReelModal';
import StoryViewer from '../../components/story/StoryViewer';
import ChatList from '../../components/chat/ChatList';
import ChatWindow from '../../components/chat/ChatWindow';
import ChatProfileSidebar from '../../components/chat/ChatProfileSidebar';
import { IOSInstallBanner } from '../../components/ui/IOSInstallBanner';

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
      <div className="flex-1 h-full w-full border-r border-gray-100">
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

const MobileNavItem = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl transition-all duration-300 ${active ? 'bg-primary/10 text-primary scale-110' : 'text-slate-400 hover:text-primary active:scale-90'}`}
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPanicConfirm, setShowPanicConfirm] = useState(false);
  const [showChatProfile, setShowChatProfile] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStoryClick = (userStories: any[], index: number) => {
    setViewingStories(userStories);
    setViewingStoryIndex(index);
  };

  const handleUserSelect = (userId: string) => {
    navigate(`/dashboard/user/${userId}`);
  };

  const showRightSidebar = !pathname.includes('profile') && !pathname.includes('settings') && !pathname.includes('notifications') && !pathname.includes('explore') && !pathname.includes('connections');

  const renderRoutes = () => {
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
        <Route path="reels" element={<ReelsView />} />
        <Route path="connections" element={
          <ConnectionsView 
            initialTab={(searchParams.get('tab') as any) || 'requests'} 
            onUserSelect={handleUserSelect}
            onMessage={(id) => navigate(`/dashboard/messages/${id}`)}
          />
        } />
        <Route path="notifications" element={<NotificationsView />} />
        <Route path="settings/*" element={<SettingsView onBack={() => navigate('/dashboard/home')} />} />
        <Route path="search" element={<SearchView />} />
        <Route path="user/:id" element={<Profile onLogout={logout} />} />
        <Route path="profile/:id" element={<Profile onLogout={logout} />} />
        <Route path="profile/manage-highlights" element={<ManageHighlights onBack={() => navigate('/dashboard/home')} />} />
        
        <Route path="messages/*" element={
          <div className="flex-1 flex flex-col h-full bg-white md:rounded-[28px] overflow-hidden border border-pastel">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-pastel shrink-0">
                <h2 className="text-[18px] font-black text-slate-800 tracking-tight">Messages</h2>
                 <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                     <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-primary/20" />
                     <div className="w-8 h-8 rounded-full border-2 border-bg-card bg-accent/20" />
                   </div>
                 </div>
              </div>

              <div className="flex flex-1 overflow-hidden relative z-10">
                <div className={`h-full border-r border-border-base w-full md:w-[320px] lg:w-95 shrink-0 bg-transparent ${pathname.includes('/dashboard/messages/') && pathname.split('/').pop() !== 'messages'
                  ? 'hidden md:flex'
                  : 'flex'
                  }`}>
                  <ChatList
                    onSelect={(id, isGroup) => navigate(`/dashboard/messages/${id}${isGroup ? '?isGroup=true' : ''}`)}
                    selectedId={pathname.split('/').pop()}
                  />
                </div>

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
                        <div className="w-24 h-24 bg-white rounded-4xl shadow-2xl shadow-primary/5 flex items-center justify-center mb-6 border border-white/60">
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
    <div className="h-screen w-full bg-bg-base text-text-base font-body flex overflow-hidden p-0 md:p-3 lg:p-4 md:gap-3 lg:gap-4 transition-colors duration-400">

      {/* 1. Left Sidebar - Desktop/Tablet */}
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

      <Toaster position="top-right" reverseOrder={false} />

      {/* 2. Main Desktop/Tablet Structure */}
      <div className="hidden md:flex flex-1 flex-col overflow-hidden h-full gap-3 lg:gap-4 relative">
        
        {/* Global Desktop Header - Only on Home Feed */}
        {pathname.includes('/dashboard/home') && (
          <header className="shrink-0 flex items-center justify-between px-2">
            <div className="flex-1 flex justify-center">
              <div
                className="flex items-center gap-3 bg-bg-card border border-border-base rounded-full px-6 py-2.5 cursor-pointer shadow-sm hover:shadow-md transition-all group w-full max-w-[400px]"
                onClick={() => navigate('/dashboard/search')}
              >
                <Search className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors shrink-0" />
                <span className="text-text-muted text-[13px] font-medium leading-none select-none">Search Locolive</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-card border border-border-base text-text-muted hover:text-primary hover:border-primary/40 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/notifications')}
                className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-card border border-border-base text-text-muted hover:text-primary hover:border-primary/40 transition-all shadow-sm cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {totalUnreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] bg-primary text-[9px] font-black text-white rounded-full flex items-center justify-center border-2 border-bg-card px-0.5 shadow-sm">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                )}
              </motion.button>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-2xl overflow-hidden cursor-pointer shadow-sm ring-2 ring-transparent hover:ring-primary/30 transition-all ml-1 border border-border-base"
                onClick={() => navigate(`/dashboard/profile/${user?.id}`)}
              >
                <img
                  src={getMediaUrl(user?.avatar_url, FALLBACKS.AVATAR(user?.username))}
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              </motion.div>
            </div>
          </header>
        )}

        {/* Desktop Content Row */}
        <div className="flex-1 flex overflow-hidden gap-3 lg:gap-4">
          <main className="flex-1 relative flex flex-col overflow-hidden bg-transparent z-10 no-scrollbar">
             {renderRoutes()}
          </main>

          {/* Right Sidebar Desktop - Hidden on small laptops/tablets (< 1150px approx for comfort) */}
          {showRightSidebar && !pathname.includes('messages') && !pathname.includes('reels') && (
            <div className="hidden xl:flex w-72 xl:w-80 shrink-0 h-full">
              <div className="w-full h-full bg-bg-sidebar border border-border-base rounded-[24px] lg:rounded-[28px] overflow-hidden shadow-sm">
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
      <main className="md:hidden flex-1 flex flex-col relative overflow-hidden h-full bg-bg-base">
          {/* Mobile Header */}
          {!pathname.includes('reels') && !pathname.includes('search') && (
            <div className="w-full pt-5 pb-3 px-6 flex items-center justify-between bg-bg-base/80 backdrop-blur-xl sticky top-0 z-[100] border-b border-border-base/10 shrink-0">
               <div className="flex items-center gap-2.5 active:scale-95 transition-all cursor-pointer" onClick={() => navigate('/dashboard/home')}>
                  <div className="w-8.5 h-8.5 rounded-[12px] bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M12 21C16 17 20 13.4183 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 13.4183 8 17 12 21Z" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-[22px] font-black italic tracking-tighter text-primary">Locolive</span>
               </div>
               <div className="flex items-center gap-2.5">
                 <button onClick={() => navigate('/dashboard/search')} className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card border border-border-base shadow-sm"><Search className="w-5 h-5 text-text-muted" /></button>
                 <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-card border border-border-base shadow-sm"><MoreVertical className="w-5 h-5 text-text-muted" /></button>
               </div>
            </div>
          )}

          {/* Mobile Main Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
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
              <Route path="reels" element={<ReelsView />} />
              <Route path="connections" element={
          <ConnectionsView 
            initialTab={(searchParams.get('tab') as any) || 'requests'} 
            onUserSelect={handleUserSelect}
            onMessage={(id) => navigate(`/dashboard/messages/${id}`)}
          />
        } />
              <Route path="notifications" element={<NotificationsView />} />
              <Route path="settings/*" element={<SettingsView onBack={() => navigate('/dashboard/home')} />} />
              <Route path="search" element={<SearchView />} />
              <Route path="user/:id" element={<Profile onLogout={logout} />} />
              <Route path="profile/:id" element={<Profile onLogout={logout} />} />
              <Route path="profile/manage-highlights" element={<ManageHighlights onBack={() => navigate('/dashboard/home')} />} />
              <Route path="messages/*" element={
                <div className="flex-1 flex flex-col h-full bg-bg-card overflow-hidden">
                  <ChatList onSelect={(id) => navigate(`/dashboard/messages/${id}`)} selectedId={pathname.split('/').pop()} />
                </div>
              } />
              <Route path="/" element={<Navigate to="home" replace />} />
            </Routes>
          </div>

          <IOSInstallBanner />

          {/* Mobile Tab Bar - Premium Glass Feel */}
          {!pathname.includes('reels') && (
            <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-bg-card/80 backdrop-blur-2xl flex items-center justify-around z-[100] border-t border-border-base/50 px-6 safe-area-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
               <MobileNavItem icon={<Home className="w-[22px] h-[22px]" />} active={pathname.includes('home')} onClick={() => navigate('/dashboard/home')} />
               <MobileNavItem icon={<Search className="w-[22px] h-[22px]" />} active={pathname.includes('search')} onClick={() => navigate('/dashboard/search')} />
               <motion.button 
                 whileTap={{ scale: 0.9, rotate: 90 }} 
                 onClick={() => setIsCreateModalOpen(true)} 
                 className="w-13 h-13 bg-brand-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 text-white -mt-8 border-4 border-bg-base"
               >
                 <Plus className="w-7 h-7 stroke-[3]" />
               </motion.button>
               <MobileNavItem icon={<Video className="w-[22px] h-[22px]" />} active={pathname.includes('reels')} onClick={() => navigate('/dashboard/reels')} />
               <MobileNavItem icon={<User className="w-[22px] h-[22px]" />} active={pathname.includes('profile')} onClick={() => navigate(`/dashboard/profile/${user?.id}`)} />
            </nav>
          )}
      </main>

      {/* Modals & Overlays - Responsive Optimized */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => { fetchStories(); setRefreshKey(prev => prev + 1); }}
        onRequestReelModal={() => { setIsCreateModalOpen(false); setIsCreateReelModalOpen(true); }}
      />
      {/* ... (other modals kept same for brevity, but ensuring they use semantic colors inside) */}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/20 backdrop-blur-xl p-6">
           <div className="bg-bg-card rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-border-base text-center">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-text-base mb-2">Are you sure?</h2>
              <p className="text-text-muted mb-8 font-medium">This will immediately hide your location and profile from everyone nearby.</p>
              <div className="flex flex-col gap-3">
                 <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 active:scale-95 transition-all">YES, DISAPPEAR NOW</button>
                 <button onClick={() => setShowPanicConfirm(false)} className="w-full py-4 bg-bg-base text-text-base rounded-2xl font-bold border border-border-base">CANCEL</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
