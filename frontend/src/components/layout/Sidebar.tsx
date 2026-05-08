import { useState, type FC, useRef, useEffect } from 'react';
import {
  Home, Compass, Search, User, Plus, LogOut,
  ChevronLeft, ChevronRight, MessageSquare,
  Download, Bell, Bookmark, Settings,
  Menu, Sun,
  Flame, Moon, Clapperboard
} from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePWA } from '../../hooks/usePWA';
import { useTheme } from '../../context/ThemeContext';
import UserSearch from './UserSearch';
import { gamificationService, type StreakData } from '../../services/gamificationService';
import LogoImg from '../../assets/WhatsApp Image 2026-04-28 at 4.00.46 PM.png';

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
    { icon: <Bookmark className="w-4.5 h-4.5" />, label: 'Saved', onClick: () => navigate('/dashboard/saved') },
    { icon: theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />, label: theme === 'dark' ? 'Light mode' : 'Dark mode', onClick: toggleTheme },
    { divider: true },
    { icon: <LogOut className="w-4.5 h-4.5" />, label: 'Log out', onClick: logout, color: 'text-red-500' },
  ];

  return (
    <div className={`relative flex flex-col h-full bg-bg-sidebar border-r border-border-base transition-all duration-300 ${effectiveCollapsed ? 'w-20' : 'w-full md:w-[260px]'}`}>
      <aside className="flex-1 flex flex-col px-3 py-5 h-full overflow-y-auto no-scrollbar">

        {/* ── Logo ── */}
        <div className={`mb-7 px-1 flex items-center ${effectiveCollapsed ? 'flex-col gap-3' : 'justify-between'}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/dashboard/home')}
          >
            <img 
              src={LogoImg} 
              alt="Locolive" 
              className={`rounded-xl object-cover shadow-lg shadow-primary/10 border border-border-base/50 transition-all duration-300 ${effectiveCollapsed ? 'w-10 h-10' : 'w-9 h-9'}`}
            />
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
                  className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg cursor-pointer hover:bg-orange-500/20 dark:hover:bg-orange-500/30 transition-all border border-orange-500/20 group"
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
        <nav className="space-y-1 mb-5">
          <NavItem icon={<Home className="w-6 h-6" />} label="Home" active={activeTab === 'home' && !isSearchOpen} onClick={() => { setActiveTab('home'); setIsSearchOpen(false); }} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<Search className="w-6 h-6" />} label="Search" active={isSearchOpen} onClick={() => setIsSearchOpen(!isSearchOpen)} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<Compass className="w-6 h-6" />} label="Explore" active={activeTab === 'explore' && !isSearchOpen} onClick={() => { setActiveTab('explore'); setIsSearchOpen(false); }} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<Clapperboard className="w-6 h-6" />} label="Reels" active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} isCollapsed={effectiveCollapsed} />
          <NavItem icon={<MessageSquare className="w-6 h-6" />} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} isCollapsed={effectiveCollapsed} badge={unreadMessagesCount} />
          <NavItem icon={<Bell className="w-6 h-6" />} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} isCollapsed={effectiveCollapsed} badge={unreadCount} />
          <NavItem 
            icon={user?.avatar_url ? (
              <img 
                src={getMediaUrl(user.avatar_url)} 
                className="w-6 h-6 rounded-full object-cover border border-border-base" 
                alt="" 
              />
            ) : (
              <User className="w-6 h-6" />
            )} 
            label="Profile" 
            active={activeTab === 'profile'} 
            onClick={() => navigate(`/dashboard/profile/${user?.id}`)} 
            isCollapsed={effectiveCollapsed} 
          />
        </nav>

        {/* ── Bottom Actions (More, Create Post, etc.) ── */}
        <div className="mt-auto space-y-4">
          <div className="relative px-1" ref={moreMenuRef}>
          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`absolute bottom-full left-0 mb-4 ${isSettingsPage ? 'w-16' : 'w-64'} bg-bg-card border border-border-base rounded-2xl shadow-2xl z-[150] overflow-hidden ${effectiveCollapsed ? 'left-2' : ''}`}
              >
                <div className="p-2 py-3">
                  {moreMenuItems.map((item, idx) => (
                    item.divider ? (
                      <div key={`div-${idx}`} className="h-px bg-border-base my-2 mx-2" />
                    ) : (
                      <button
                        key={item.label}
                        onClick={() => { item.onClick?.(); setIsMoreMenuOpen(false); }}
                        className={`w-full flex items-center ${isSettingsPage ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl hover:bg-bg-base transition-colors group cursor-pointer ${item.color || 'text-text-base'}`}
                      >
                        <span className={`text-text-muted group-hover:text-primary transition-colors ${isSettingsPage ? '' : ''}`}>{item.icon}</span>
                        {!isSettingsPage && <span className="text-[14px] font-medium">{item.label}</span>}
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
              className={`${effectiveCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-2.5 px-4 rounded-[18px]'} bg-bg-card border border-border-base flex items-center justify-center gap-2 font-medium text-text-muted text-[12px] hover:text-primary hover:border-primary/30 transition-all`}
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
      </div>
    </aside>
    </div>
  );
};

export default Sidebar;
