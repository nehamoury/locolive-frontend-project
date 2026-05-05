import { useState, type FC, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, User, Shield, Bell, Lock,
  Palette,
  HelpCircle, ChevronRight, LogOut, Bookmark, Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';

// Sub-sections
import AccountInfoSection from '../../components/settings/AccountInfoSection';
import PrivacySection from '../../components/settings/PrivacySection';
import AppearanceSection from '../../components/settings/AppearanceSection';
import SecuritySection from '../../components/settings/SecuritySection';
import NotificationsSection from '../../components/settings/NotificationsSection';
import SupportSection from '../../components/settings/SupportSection';
import SavedView from './SavedView';

interface SettingsViewProps {
  onBack: () => void;
}

export type SettingsSection =
  | 'account_info' | 'privacy' | 'security' | 'notifications' | 'email_notifications' | 'push_notifications'
  | 'appearance' | 'content' | 'language' | 'data'
  | 'help' | 'about' | 'saved';

const SettingsView: FC<SettingsViewProps> = ({ onBack }) => {
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const initialSection = searchParams.get('section') as SettingsSection || 'account_info';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [showDetail, setShowDetail] = useState(!!searchParams.get('section'));

  useEffect(() => {
    const handleLogout = () => logout();
    window.addEventListener('app_logout', handleLogout);
    return () => window.removeEventListener('app_logout', handleLogout);
  }, [logout]);

  useEffect(() => {
    const section = searchParams.get('section') as SettingsSection;
    if (section) {
      setActiveSection(section);
      setShowDetail(true);
    }
  }, [searchParams]);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
    setShowDetail(true);
    setSearchParams({ section });
  };

  const menuGroups = [
    {
      title: 'Account',
      items: [
        { id: 'account_info', label: 'Account Information', desc: 'Edit your profile, username and more', icon: <User className="w-4 h-4" />, color: 'bg-pink-100 text-pink-600' },
        { id: 'privacy', label: 'Privacy', desc: 'Manage your privacy settings', icon: <Shield className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600' },
        { id: 'security', label: 'Security', desc: 'Password, 2FA and login activity', icon: <Lock className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
        { id: 'notifications', label: 'Notifications', desc: 'Manage email and push alerts', icon: <Bell className="w-4 h-4" />, color: 'bg-rose-100 text-rose-600' },
        { id: 'saved', label: 'Saved Items', desc: 'Your private collection of posts and reels', icon: <Bookmark className="w-4 h-4" />, color: 'bg-amber-100 text-amber-600' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { id: 'appearance', label: 'Appearance', desc: 'Theme, color and app appearance', icon: <Palette className="w-4 h-4" />, color: 'bg-orange-100 text-orange-600' },
      ]
    },
    {
      title: 'Support & About',
      items: [
        { id: 'help', label: 'Help & Support', desc: 'Help center and support', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
        { id: 'logout', label: 'Log Out', desc: 'Sign out from your account', icon: <LogOut className="w-4 h-4" />, color: 'bg-pink-100 text-pink-600', isLogout: true },
      ]
    }
  ];

  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'account_info':
        return <AccountInfoSection />;
      case 'privacy':
        return <PrivacySection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'security':
        return <SecuritySection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'help':
        return <SupportSection />;
      case 'saved':
        return <SavedView isSettingsView />;
      default:
        return <AccountInfoSection />;
    }
  };

  return (
    <div className="h-full bg-bg-base flex flex-col md:flex-row overflow-hidden relative">

      {/* ── Left Sidebar: Menu ── */}
      <div className={cn(
        "w-full md:w-[400px] h-full bg-bg-sidebar border-r border-border-base/50 flex flex-col shrink-0 overflow-y-auto no-scrollbar transition-all duration-300",
        showDetail ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="px-6 pt-2 pb-6 sticky top-0 bg-bg-sidebar/80 backdrop-blur-xl z-20">
          <div className="relative flex items-center justify-center mb-8">
            <button
              onClick={onBack}
              className="absolute left-0 p-2 hover:bg-bg-base rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-text-base" />
            </button>
            <h1 className="text-xl font-black text-text-base tracking-tight">Settings and activity</h1>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-text-muted transition-colors group-focus-within:text-pink-500" />
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-text-base placeholder:text-text-muted/60 outline-none focus:ring-2 focus:ring-pink-500/10 focus:border-pink-500/30 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="px-2 pb-5 space-y-8">
          {filteredMenuGroups.length > 0 ? (
            filteredMenuGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="px-4 text-[11px] font-black uppercase tracking-widest text-text-muted/60 mb-3">{group.title}</h3>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                      if (item.isLogout) {
                        logout();
                      } else {
                        handleSectionChange(item.id as SettingsSection);
                      }
                    }}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group cursor-pointer",
                        activeSection === item.id
                          ? "bg-pink-50/20 dark:bg-pink-500/10 shadow-sm border border-pink-100/50 dark:border-pink-500/20"
                          : "hover:bg-bg-base border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", item.color)}>
                          {item.icon}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[14px] font-black tracking-tight transition-colors", activeSection === item.id ? "text-pink-600" : "text-text-base")}>
                              {item.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted font-bold leading-tight mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 transition-all", activeSection === item.id ? "text-pink-500 translate-x-1" : "text-text-muted/40 group-hover:translate-x-1")} />
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-text-muted/20" />
              </div>
              <h3 className="text-sm font-black text-text-base">No results found</h3>
              <p className="text-xs text-text-muted font-bold mt-1">Try searching for something else</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className={cn(
        "flex-1 h-full overflow-y-auto no-scrollbar transition-all duration-300 bg-bg-base",
        showDetail ? "flex flex-col" : "hidden md:flex flex-col"
      )}>
        {/* Mobile Sub-page Header */}
        <div className="md:hidden flex items-center justify-center px-6 pt-8 pb-4 sticky top-0 bg-bg-base/80 backdrop-blur-xl z-20 border-b border-border-base/30 shrink-0">
          <button
            onClick={() => {
              setShowDetail(false);
              setSearchParams({});
            }}
            className="absolute left-6 p-2 -ml-2 hover:bg-bg-sidebar rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-text-base" />
          </button>
          <h2 className="text-lg font-black text-text-base uppercase tracking-tight">
            {menuGroups.flatMap(g => g.items).find(i => i.id === activeSection)?.label || 'Settings'}
          </h2>
        </div>

        <div className="p-6 md:p-12 lg:p-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-right-4 duration-500">
          {renderActiveSection()}

        </div>
      </div>
    </div>
  );
};

export default SettingsView;
