import { useState, type FC } from 'react';
import { Home, Compass, User, Plus, Users, LogOut, ChevronLeft, ChevronRight, Video, MessageSquare, Download, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePWA } from '../../hooks/usePWA';
import { BACKEND } from '../../utils/config';


interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick: () => void;
  isCollapsed?: boolean;
}

const NavItem = ({ icon, label, active, badge, onClick, color, isCollapsed }: NavItemProps & { color?: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-4 py-3 rounded-2xl transition-all duration-300 relative group cursor-pointer
      ${active
        ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20'
        : 'text-text-muted hover:bg-primary/5 hover:text-primary'
      }`}
  >
    <div className={`relative flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : color || 'text-text-muted group-hover:text-primary'}`}>
      {icon}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-bg-sidebar">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </div>
    {!isCollapsed && (
      <span className={`ml-3.5 font-semibold text-[14px] tracking-tight ${active ? 'text-white' : 'text-text-muted group-hover:text-primary'}`}>
        {label}
      </span>
    )}
    {active && !isCollapsed && (
      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
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
  notificationPermission,
  requestPermission
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isInstallable, installApp } = usePWA();

  const activeTab = pathname.split('/').pop() || 'home';
  const setActiveTab = (tab: string) => navigate(`/dashboard/${tab}`);

  return (
    <div className={`relative flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>

      <aside className="flex-1 flex flex-col px-3 py-6 z-20 h-full overflow-y-auto no-scrollbar font-brand">

      {/* Logo Area + Collapse Toggle */}
      <div className={`mb-8 px-2 flex flex-col ${isCollapsed ? 'items-center' : 'items-start'} cursor-default select-none`}>
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4' : 'flex-row items-center justify-between'} w-full`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/30 flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21C16 17 20 13.4183 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 13.4183 8 17 12 21Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="2.5" fill="white" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-[22px] font-black tracking-tighter text-primary leading-none">Locolive</span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Discover Nearby</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 rounded-xl bg-bg-base border border-border-base text-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 mb-6">
          <NavItem icon={<Home className="w-5 h-5" />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} color="text-[#FF4D97]" isCollapsed={isCollapsed} />
          <NavItem icon={<Compass className="w-5 h-5" />} label="Explore" active={activeTab === 'explore'} onClick={() => setActiveTab('explore')} color="text-[#A436EE]" isCollapsed={isCollapsed} />
          <NavItem icon={<MessageSquare className="w-5 h-5" />} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} color="text-[#339AF0]" isCollapsed={isCollapsed} badge={unreadMessagesCount} />
          <NavItem icon={<Video className="w-5 h-5" />} label="Reels" active={activeTab === 'reels'} onClick={() => setActiveTab('reels')} color="text-[#FF006E]" isCollapsed={isCollapsed} />
          <NavItem icon={<Users className="w-5 h-5" />} label="Connections" active={activeTab === 'connections'} onClick={() => setActiveTab('connections')} color="text-[#4DABF7]" isCollapsed={isCollapsed} />
          <NavItem icon={<User className="w-5 h-5" />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} color="text-[#495057]" isCollapsed={isCollapsed} />
        </nav>

        {/* Action Buttons Section */}
        <div className="mb-4 space-y-2 flex flex-col justify-center px-1">
          {/* Create Post Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreatePost}
            className={`${isCollapsed ? 'w-11 h-11 p-0 rounded-full' : 'w-full py-3 px-4 rounded-[20px]'} bg-brand-gradient flex items-center justify-center gap-2 font-bold text-white text-[14px] shadow-[0_10px_20px_-5px_rgba(255,0,110,0.3)] cursor-pointer transition-all`}
          >
            <Plus className="w-5 h-5 stroke-[3] shrink-0" />
            {!isCollapsed && <span>Create Post</span>}
          </motion.button>

          {/* PWA Install Button */}
          {isInstallable && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={installApp}
              className={`${isCollapsed ? 'w-11 h-11 p-0 rounded-full' : 'w-full py-2.5 px-4 rounded-[20px]'} bg-primary/10 border border-primary/20 flex items-center justify-center gap-2 font-bold text-primary text-[13px] hover:bg-primary/15 transition-all`}
            >
              <Download className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Install App</span>}
            </motion.button>
          )}

          {/* Enable Notifications Button */}
          {notificationPermission === 'default' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestPermission}
              className={`${isCollapsed ? 'w-11 h-11 p-0 rounded-full' : 'w-full py-2.5 px-4 rounded-[20px]'} bg-orange-500/10 border border-orange-500/20 flex items-center justify-center gap-2 font-bold text-orange-500 text-[13px] hover:bg-orange-500/15 transition-all`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Enable Alerts</span>}
            </motion.button>
          )}
        </div>

        {/* Profile Snippet */}
        <div className="border-t border-border-base pt-4">
          <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-1 py-2'} rounded-2xl group select-none relative gap-3`}>
            <div
              className="w-10 h-10 rounded-full p-[2px] bg-brand-gradient flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setActiveTab('profile')}
            >
              <div className="w-full h-full rounded-full bg-bg-sidebar overflow-hidden">
                {user?.avatar_url ? (
                  <img src={`${BACKEND}${user.avatar_url}`} alt="avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary font-black text-sm">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {!isCollapsed && (
              <>
                <div className="flex flex-col text-left flex-1 min-w-0 cursor-pointer" onClick={() => setActiveTab('profile')}>
                  <p className="font-bold text-sm text-text-base truncate leading-tight">{user?.full_name || user?.username}</p>
                  <p className="text-text-muted text-xs truncate">@{user?.username}</p>
                </div>
                <button onClick={logout} className="p-2 rounded-lg hover:bg-primary/5 transition-colors text-text-muted hover:text-primary cursor-pointer flex-shrink-0" title="Logout">
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
