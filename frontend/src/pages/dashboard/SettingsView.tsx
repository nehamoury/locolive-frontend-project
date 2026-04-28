import { useState, type FC, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, User, Shield, Bell, Lock, 
  Palette, Globe, HardDrive, 
  HelpCircle, Info, ChevronRight, LogOut,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/helpers';

// Sub-sections
import AccountInfoSection from '../../components/settings/AccountInfoSection';
import PrivacySection from '../../components/settings/PrivacySection';
import AppearanceSection from '../../components/settings/AppearanceSection';
import SecuritySection from '../../components/settings/SecuritySection';
import NotificationsSection from '../../components/settings/NotificationsSection';
import DataStorageSection from '../../components/settings/DataStorageSection';
import SupportSection from '../../components/settings/SupportSection';
import ComingSoonSection from '../../components/settings/ComingSoonSection';

interface SettingsViewProps {
  onBack: () => void;
}

export type SettingsSection = 
  | 'account_info' | 'privacy' | 'security' | 'notifications' | 'email_notifications' | 'push_notifications'
  | 'appearance' | 'content' | 'language' | 'data'
  | 'help' | 'about';

const SettingsView: FC<SettingsViewProps> = ({ onBack }) => {
  const { logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('section') as SettingsSection || 'account_info';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  useEffect(() => {
    const section = searchParams.get('section') as SettingsSection;
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
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
      ]
    },
    {
      title: 'Preferences',
      items: [
        { id: 'appearance', label: 'Appearance', desc: 'Theme, color and app appearance', icon: <Palette className="w-4 h-4" />, color: 'bg-orange-100 text-orange-600' },
        { id: 'content', label: 'Content Preferences', desc: 'Content and media preferences', icon: <RefreshCw className="w-4 h-4" />, color: 'bg-teal-100 text-teal-600' },
        { id: 'language', label: 'Language', desc: 'App language and region', icon: <Globe className="w-4 h-4" />, color: 'bg-cyan-100 text-cyan-600' },
        { id: 'data', label: 'Data & Storage', desc: 'Data usage and storage settings', icon: <HardDrive className="w-4 h-4" />, color: 'bg-amber-100 text-amber-600' },
      ]
    },
    {
      title: 'Support & About',
      items: [
        { id: 'help', label: 'Help & Support', desc: 'Help center and support', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-green-100 text-green-600' },
        { id: 'about', label: 'About', desc: 'App info, terms and policies', icon: <Info className="w-4 h-4" />, color: 'bg-slate-100 text-slate-600' },
      ]
    }
  ];

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
      case 'content':
        return <ComingSoonSection title="Content Preferences" desc="Content and media preferences" />;
      case 'language':
        return <ComingSoonSection title="Language" desc="App language and region" />;
      case 'data':
        return <DataStorageSection />;
      case 'help':
        return <SupportSection />;
      case 'about':
        return <ComingSoonSection title="About" desc="App info, terms and policies" />;
      default:
        return <AccountInfoSection />;
    }
  };

  return (
    <div className="h-full bg-bg-base flex flex-col md:flex-row overflow-hidden">
      
      {/* ── Left Sidebar: Menu ── */}
      <div className="w-full md:w-[380px] h-full bg-bg-sidebar border-r border-border-base/50 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
        <div className="px-8 pt-10 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-bg-base rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-text-base" />
            </button>
            <h1 className="text-2xl font-black text-text-base tracking-tight">Settings</h1>
          </div>
          <p className="text-[13px] text-text-muted font-bold ml-11">Manage your account, privacy and preferences</p>
        </div>

        <div className="px-6 pb-20 space-y-8">
          {menuGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h3 className="px-4 text-[11px] font-black uppercase tracking-widest text-text-muted/60 mb-3">{group.title}</h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id as SettingsSection)}
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
          ))}
        </div>

        {/* Logout Button in Sidebar */}
        <div className="mt-auto px-6 pb-8">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-4 p-4 bg-pink-50/10 hover:bg-pink-100/20 rounded-2xl border border-pink-100/20 transition-all group cursor-pointer"
          >
            <div className="w-8 h-8 bg-bg-card rounded-lg flex items-center justify-center text-pink-500 shadow-sm border border-pink-100/20">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-sm font-black text-pink-600 block">Log Out</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 h-full overflow-y-auto no-scrollbar p-8 md:p-12 lg:p-16">
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
          {renderActiveSection()}
          
          {/* Global Logout at bottom of Account Info */}
          {activeSection === 'account_info' && (
             <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-4 p-6 bg-pink-50/10 hover:bg-pink-100/20 rounded-[32px] border border-pink-100/20 transition-all group cursor-pointer mt-10"
              >
                <div className="w-10 h-10 bg-bg-card rounded-xl flex items-center justify-center text-pink-500 shadow-sm border border-pink-100/20">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[15px] font-black text-pink-600 block">Log Out</span>
                  <p className="text-[12px] text-pink-600/60 font-bold">Log out from your account on this device</p>
                </div>
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
