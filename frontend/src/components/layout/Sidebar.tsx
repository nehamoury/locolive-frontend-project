import { useState, type FC, useRef, useEffect } from 'react';
import {
  Home, Compass, Search, User, Plus, Users, LogOut,
  ChevronLeft, ChevronRight, Video, MessageSquare,
  Download, Bell, Bookmark, Settings,
  Menu, Activity, Sun, AlertCircle, RefreshCw,
  Flame, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePWA } from '../../hooks/usePWA';
import { useTheme } from '../../context/ThemeContext';
import UserSearch from './UserSearch';
import { gamificationService, type StreakData } from '../../services/gamificationService';
import { toast } from 'react-hot-toast';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
  isCollapsed?: boolean;
}

const NavItem: FC<NavItemProps> = ({ icon, label, active, badge, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${isCollapsed ? 'justify-center py-3 px-0' : 'justify-start px-3 py-2.5'} rounded-xl transition-all duration-200 relative group cursor-pointer
      ${active
        ? 'bg-primary/10 text-primary'
        : 'text-text-muted hover:bg-primary/5 hover:text-primary'
      }`}
  >
    <div className="relative flex-shrink-0">
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-primary rounded-full text-[9px] font-black text-white flex items-center justify-center border border-bg-sidebar shadow-sm">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    {!isCollapsed && (
      <span className={`ml-3 text-[13.5px] tracking-tight ${active ? 'font-bold text-primary' : 'font-medium text-text-muted group-hover:text-primary transition-colors'}`}>
        {label}
      </span>
    )}
  </button>
);

interface SidebarProps {
  user: any;
  unreadMessagesCount?: number;
  unreadCount?: number;
  notificationPermission?: 'default' | 'granted' | 'denied';
  requestPermission?: () => void;
  logout: () => void;
  onCreatePost: () => void;
}

const Sidebar: FC<SidebarProps> = ({
  user,
  logout,
  onCreatePost,
  unreadMessagesCount = 0,
  unreadCount = 0,
  notificationPermission,
  requestPermission
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, installApp } = usePWA();

  const activeTab = pathname.split('/').pop() || 'home';
  const setActiveTab = (tab: string) => navigate(`/dashboard/${tab}`);

  // Sidebar collapses automatically when search is open
  const isSettingsPage = pathname.includes('settings');
  const effectiveCollapsed = isCollapsed || isSearchOpen || isSettingsPage;

  // Handle click outside for more menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      gamificationService.getStreak().then(setStreakData).catch(() => {});
    }
  }, [user?.id]);

  const moreMenuItems = [
    { icon: <Settings className="w-4.5 h-4.5" />, label: 'Settings', onClick: () => navigate('/dashboard/settings') },
    { icon: <Activity className="w-4.5 h-4.5" />, label: 'Your activity', onClick: () => { toast.success('Activity tracking coming soon!'); } },
    { icon: <Bookmark className="w-4.5 h-4.5" />, label: 'Saved', onClick: () => navigate(`/dashboard/profile/${user?.id}?tab=saved`) },
    { icon: theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />, label: theme === 'dark' ? 'Light mode' : 'Dark mode', onClick: toggleTheme },
    { icon: <AlertCircle className="w-4.5 h-4.5" />, label: 'Report a problem', onClick: () => { toast.success('Thank you for reporting! We will look into it.'); } },
    { divider: true },
    { icon: <RefreshCw className="w-4.5 h-4.5" />, label: 'Switch accounts', onClick: () => { toast.error('You only have one account active.'); } },
    { icon: <LogOut className="w-4.5 h-4.5" />, label: 'Log out', onClick: logout, color: 'text-red-500' },
  ];

  return (
    <div className={`relative flex flex-col h-full bg-bg-sidebar border-r border-border-base transition-all duration-300 ${isSearchOpen ? 'w-0 overflow-hidden border-none' : (effectiveCollapsed ? 'w-20' : 'w-full md:w-[260px]')}`}>
      <aside className="flex-1 flex flex-col px-3 py-5 h-full overflow-y-auto no-scrollbar">

        {/* ── Logo ── */}
        <div className={`mb-7 px-1 flex items-center ${effectiveCollapsed ? 'flex-col gap-3' : 'justify-between'}`}>
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => navigate('/dashboard/home')}
          >
            <div className="w-9 h-9 rounded-[14px] bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                <path d="M12 21C16 17 20 13.4183 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 13.4183 8 17 12 21Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
            {!effectiveCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-[17px] font-black tracking-tight text-primary">Locolive</span>
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-[1.8px] mt-0.5">Discover Nearby</span>
              </div>
            )}
          </div>
          {!isSearchOpen && (
            <div className="flex items-center gap-2">
              {streakData && streakData.current_streak > 0 && !effectiveCollapsed && (
                <div 
                  onClick={() => navigate(`/dashboard/profile/${user?.id}`)}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-lg cursor-pointer hover:bg-orange-500/20 transition-all border border-orange-500/20 group"
                  title="Your current streak"
                >
                  <span className="text-[12px] font-black text-orange-600">{streakData.current_streak}</span>
                  <Flame className="w-3.5 h-3.5 fill-orange-600 text-orange-600 animate-pulse group-hover:scale-125 transition-transform" />
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-7 h-7 rounded-lg bg-bg-base border border-border-base text-text-muted hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center flex-shrink-0"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* ── User Search Drawer ── */}
        <UserSearch
          mode="sidebar-drawer"
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          isCollapsed={effectiveCollapsed}
        />

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-1 mb-5">
          <NavItem icon={<Home className="w-6 h-6" />} label="Home" active={activeTab === 'home' && !isSearchOpen} onClick={() => { setActiveTab('home'); setIsSearchOpen(false); }} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<Search className="w-6 h-6" />} label="Search" active={isSearchOpen} onClick={() => setIsSearchOpen(!isSearchOpen)} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<Compass className="w-6 h-6" />} label="Explore" active={activeTab === 'explore' && !isSearchOpen} onClick={() => { setActiveTab('explore'); setIsSearchOpen(false); }} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<Video className="w-6 h-6" />} label="Reels" active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<MessageSquare className="w-6 h-6" />} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} isCollapsed={effectiveCollapsed} badge={unreadMessagesCount} />
          <NavItem icon={<Bell className="w-6 h-6" />} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} isCollapsed={effectiveCollapsed} badge={unreadCount} />
          <NavItem icon={<Users className="w-6 h-6" />} label="Connections" active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<User className="w-6 h-6" />} label="Profile" active={activeTab === 'profile'} onClick={() => navigate(`/dashboard/profile/${user?.id}`)} isCollapsed={effectiveCollapsed} />
        </nav>

        {/* ── More Button & Menu ── */}
        <div className="relative mb-4 px-1" ref={moreMenuRef}>
          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`absolute bottom-full left-0 mb-4 w-64 bg-white dark:bg-bg-sidebar border border-border-base rounded-2xl shadow-2xl z-[150] overflow-hidden ${effectiveCollapsed ? 'left-2' : ''}`}
              >
                <div className="p-2 py-3">
                  {moreMenuItems.map((item, idx) => (
                    item.divider ? (
                      <div key={`div-${idx}`} className="h-px bg-border-base my-2 mx-2" />
                    ) : (
                      <button
                        key={item.label}
                        onClick={() => { item.onClick?.(); setIsMoreMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg-base transition-colors group cursor-pointer ${item.color || 'text-text-base'}`}
                      >
                        <span className="text-text-muted group-hover:text-primary transition-colors">{item.icon}</span>
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </button>
                    )
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`w-full flex items-center ${effectiveCollapsed ? 'justify-center py-3' : 'px-3 py-2.5'} rounded-xl transition-all hover:bg-bg-base group cursor-pointer ${isMoreMenuOpen ? 'bg-bg-base font-bold' : ''}`}
          >
            <Menu className={`w-6 h-6 ${isMoreMenuOpen ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
            {!effectiveCollapsed && (
              <span className={`ml-3 text-[14px] tracking-tight ${isMoreMenuOpen ? 'font-black text-text-base translate-x-1' : 'font-medium text-text-muted group-hover:text-primary'}`}>
                More
              </span>
            )}
          </button>
        </div>

        {/* ── Create Post + Actions ── */}
        <div className="space-y-2 mb-4 px-1">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 8px 25px -5px rgba(255, 0, 110, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreatePost}
            className={`${effectiveCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-3 px-4 rounded-[18px]'} bg-brand-gradient flex items-center justify-center gap-2 font-bold text-white text-[14px] shadow-lg shadow-primary/20 cursor-pointer transition-all`}
          >
            <Plus className="w-[20px] h-[20px] stroke-[3] shrink-0" />
            {!effectiveCollapsed && <span>Create Post</span>}
          </motion.button>

          {isInstallable && (
            <button
              onClick={installApp}
              className={`${effectiveCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-2.5 px-4 rounded-[18px]'} bg-bg-base border border-border-base flex items-center justify-center gap-2 font-medium text-text-muted text-[12px] hover:text-primary hover:border-primary/30 transition-all`}
            >
              <Download className="w-4 h-4 shrink-0" />
              {!effectiveCollapsed && <span>Install App</span>}
            </button>
          )}

          {notificationPermission === 'default' && (
            <button
              onClick={requestPermission}
              className={`${effectiveCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-2.5 px-4 rounded-[18px]'} bg-accent/5 border border-accent/10 flex items-center justify-center gap-2 font-medium text-accent text-[12px] hover:bg-accent/10 transition-all`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              {!effectiveCollapsed && <span>Enable Alerts</span>}
            </button>
          )}
        </div>

      </aside>
    </div>
  );
};

export default Sidebar;
