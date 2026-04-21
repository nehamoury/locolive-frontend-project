import { useState, type FC } from 'react';
import {
  Home, Compass, Search, User, Plus, Users, LogOut,
  ChevronLeft, ChevronRight, Video, MessageSquare,
  Download, Bell, Bookmark, Settings, HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePWA } from '../../hooks/usePWA';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import UserSearch from './UserSearch';

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
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isInstallable, installApp } = usePWA();

  const activeTab = pathname.split('/').pop() || 'home';
  const setActiveTab = (tab: string) => navigate(`/dashboard/${tab}`);

  return (
    <div className={`relative flex flex-col h-full bg-bg-sidebar border-r border-border-base transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-full md:w-[260px]'}`}>
      <aside className="flex-1 flex flex-col px-3 py-5 h-full overflow-y-auto no-scrollbar">

        {/* ── Logo ── */}
        <div className={`mb-7 px-1 flex items-center ${isCollapsed ? 'flex-col gap-3' : 'justify-between'}`}>
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
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-[17px] font-black tracking-tight text-primary">Locolive</span>
                <span className="text-[8px] font-bold text-text-muted uppercase tracking-[1.8px] mt-0.5">Discover Nearby</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-lg bg-bg-base border border-border-base text-text-muted hover:text-primary hover:border-primary/40 transition-all flex items-center justify-center flex-shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* ── User Search Drawer ── */}
        <UserSearch
          mode="sidebar-drawer"
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          isCollapsed={isCollapsed}
        />

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-1 mb-5">
          <NavItem icon={<Home className="w-[19px] h-[19px]" />} label="Home" active={activeTab === 'home' && !isSearchOpen} onClick={() => { setActiveTab('home'); setIsSearchOpen(false); }} isCollapsed={isCollapsed} />
          <NavItem icon={<Search className="w-[19px] h-[19px]" />} label="Search" active={isSearchOpen} onClick={() => setIsSearchOpen(!isSearchOpen)} isCollapsed={isCollapsed} />
          <NavItem icon={<Compass className="w-[19px] h-[19px]" />} label="Explore" active={activeTab === 'explore' && !isSearchOpen} onClick={() => { setActiveTab('explore'); setIsSearchOpen(false); }} isCollapsed={isCollapsed} />
          <NavItem icon={<Video className="w-[19px] h-[19px]" />} label="Reels" active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} isCollapsed={isCollapsed} />
          <NavItem icon={<MessageSquare className="w-[19px] h-[19px]" />} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} isCollapsed={isCollapsed} badge={unreadMessagesCount} />
          <NavItem icon={<Bell className="w-[19px] h-[19px]" />} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} isCollapsed={isCollapsed} badge={unreadCount} />
          <NavItem icon={<Users className="w-[19px] h-[19px]" />} label="Connections" active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} isCollapsed={isCollapsed} />
          <NavItem icon={<User className="w-[19px] h-[19px]" />} label="Profile" active={activeTab === 'profile'} onClick={() => navigate(`/dashboard/profile/${user?.id}`)} isCollapsed={isCollapsed} />
          <NavItem icon={<Bookmark className="w-[19px] h-[19px]" />} label="Saved" active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} isCollapsed={isCollapsed} />
          <NavItem icon={<Settings className="w-[19px] h-[19px]" />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} isCollapsed={isCollapsed} />
          <NavItem icon={<HelpCircle className="w-[19px] h-[19px]" />} label="Help" active={false} onClick={() => { }} isCollapsed={isCollapsed} />
        </nav>

        {/* ── Create Post + Actions ── */}
        <div className="space-y-2 mb-4 px-1">
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 8px 25px -5px rgba(255, 0, 110, 0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreatePost}
            className={`${isCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-3 px-4 rounded-[18px]'} bg-brand-gradient flex items-center justify-center gap-2 font-bold text-white text-[14px] shadow-lg shadow-primary/20 cursor-pointer transition-all`}
          >
            <Plus className="w-[20px] h-[20px] stroke-[3] shrink-0" />
            {!isCollapsed && <span>Create Post</span>}
          </motion.button>

          {isInstallable && (
            <button
              onClick={installApp}
              className={`${isCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-2.5 px-4 rounded-[18px]'} bg-bg-base border border-border-base flex items-center justify-center gap-2 font-medium text-text-muted text-[12px] hover:text-primary hover:border-primary/30 transition-all`}
            >
              <Download className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Install App</span>}
            </button>
          )}

          {notificationPermission === 'default' && (
            <button
              onClick={requestPermission}
              className={`${isCollapsed ? 'w-11 h-11 p-0 rounded-2xl' : 'w-full py-2.5 px-4 rounded-[18px]'} bg-accent/5 border border-accent/10 flex items-center justify-center gap-2 font-medium text-accent text-[12px] hover:bg-accent/10 transition-all`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Enable Alerts</span>}
            </button>
          )}
        </div>

        {/* ── Profile Footer ── */}
        <div className="border-t border-border-base pt-4 px-1">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
            <div
              className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 cursor-pointer flex-shrink-0 hover:ring-primary/40 transition-all"
              onClick={() => navigate(`/dashboard/profile/${user?.id}`)}
            >
              <img
                src={getMediaUrl(user?.avatar_url, FALLBACKS.AVATAR(user?.username))}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {!isCollapsed && (
              <>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => navigate(`/dashboard/profile/${user?.id}`)}
                >
                  <p className="text-[13px] font-bold text-text-base truncate leading-tight">{user?.full_name || user?.username}</p>
                  <p className="text-[11px] text-text-muted truncate">@{user?.username}</p>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg hover:bg-accent/5 text-text-muted hover:text-accent transition-all cursor-pointer flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
};

export default Sidebar;
