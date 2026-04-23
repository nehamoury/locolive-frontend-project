import { useState, type FC } from 'react';
import { 
  ArrowLeft, User, Shield, Bell, Lock, Mail, 
  Smartphone, Palette, Globe, HardDrive, 
  HelpCircle, Info, ChevronRight, LogOut,
  Camera, MapPin, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { cn } from '../../utils/helpers';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface SettingsViewProps {
  onBack: () => void;
}

type SettingsSection = 
  | 'account_info' | 'privacy' | 'security' | 'email_notifications' | 'push_notifications'
  | 'appearance' | 'content' | 'language' | 'data'
  | 'help' | 'about';

const SettingsView: FC<SettingsViewProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>('account_info');

  const menuGroups = [
    {
      title: 'Account',
      items: [
        { id: 'account_info', label: 'Account Information', desc: 'Edit your profile, username and more', icon: <User className="w-4 h-4" />, color: 'bg-pink-100 text-pink-600' },
        { id: 'privacy', label: 'Privacy', desc: 'Manage your privacy settings', icon: <Shield className="w-4 h-4" />, color: 'bg-purple-100 text-purple-600' },
        { id: 'security', label: 'Security', desc: 'Password, 2FA and login activity', icon: <Lock className="w-4 h-4" />, color: 'bg-blue-100 text-blue-600' },
        { id: 'email_notifications', label: 'Email Notifications', desc: 'Manage your email notifications', icon: <Mail className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-600' },
        { id: 'push_notifications', label: 'Push Notifications', desc: 'Manage your push notifications', icon: <Bell className="w-4 h-4" />, color: 'bg-rose-100 text-rose-600', dot: true },
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

  return (
    <div className="h-full bg-[#fcf5f8] flex flex-col md:flex-row overflow-hidden">
      
      {/* ── Left Sidebar: Menu ── */}
      <div className="w-full md:w-[380px] h-full bg-white border-r border-border-base/50 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
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
                    onClick={() => setActiveSection(item.id as SettingsSection)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-2xl transition-all group cursor-pointer",
                      activeSection === item.id 
                        ? "bg-pink-50/80 shadow-sm border border-pink-100" 
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
                          {item.dot && <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />}
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
      </div>

      {/* ── Right Content Area ── */}
      <div className="flex-1 h-full overflow-y-auto no-scrollbar p-8 md:p-12 lg:p-16">
        <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
          
          {activeSection === 'account_info' && (
            <>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-text-base">Account Information</h2>
                <p className="text-[14px] text-text-muted font-bold">Manage your personal information and account details</p>
              </div>

              {/* Account Details Card */}
              <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="divide-y divide-border-base/30">
                  <SettingField 
                    icon={<Camera className="w-5 h-5 text-pink-500" />} 
                    label="Profile Photo" 
                    desc="Change your profile picture"
                    action={
                      <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-bg-base shadow-md">
                        <img src={getMediaUrl(user?.avatar_url, FALLBACKS.AVATAR(user?.username))} className="w-full h-full object-cover" alt="" />
                      </div>
                    }
                  />
                  <SettingField label="Full Name" value={user?.full_name || "Not set"} desc="This is your display name" />
                  <SettingField label="Username" value={`@${user?.username}`} desc="Your unique username" />
                  <SettingField label="Bio" value={user?.bio || "Life is all about love ❤️"} desc="Tell people about yourself" />
                  <SettingField label="Email" value={user?.email || "neha@example.com"} desc="Your email address" />
                  <SettingField label="Phone" value="+91 98765 43210" desc="Your phone number" />
                  <SettingField label="Location" value="Raipur, Chhattisgarh" desc="Your location" icon={<MapPin className="w-5 h-5 text-pink-500" />} />
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-4 pt-6">
                <h3 className="text-[13px] font-black uppercase tracking-widest text-text-muted/60 px-2">Account Actions</h3>
                <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
                   <SettingField 
                      label="Switch Account" 
                      desc="Switch to another account" 
                      icon={<RefreshCw className="w-5 h-5 text-pink-500" />} 
                      hideArrow={false}
                    />
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={() => logout()}
                className="w-full flex items-center gap-4 p-6 bg-pink-50/50 hover:bg-pink-100/50 rounded-[32px] border border-pink-100/50 transition-all group cursor-pointer mt-6"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm border border-pink-100">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[15px] font-black text-pink-600 block">Log Out</span>
                  <p className="text-[12px] text-pink-600/60 font-bold">Log out from your account on this device</p>
                </div>
              </button>
            </>
          )}

          {activeSection !== 'account_info' && (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-20 h-20 bg-white rounded-[24px] flex items-center justify-center mb-6 shadow-sm border border-border-base/50">
                <Lock className="w-10 h-10 text-text-muted/30" />
              </div>
              <h3 className="text-xl font-black text-text-base mb-2 italic">Coming Soon</h3>
              <p className="text-[13px] text-text-muted font-bold max-w-[280px]">We are working hard to bring this feature to your settings experience.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// UI Components
const SettingField = ({ label, value, desc, icon, action, hideArrow = false }: { 
  label: string; 
  value?: string; 
  desc: string; 
  icon?: React.ReactNode;
  action?: React.ReactNode;
  hideArrow?: boolean;
}) => (
  <div className="flex items-center justify-between p-6 hover:bg-bg-base transition-colors group cursor-pointer">
    <div className="flex items-center gap-5">
      {icon && (
        <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 shadow-sm">
          {icon}
        </div>
      )}
      <div className="text-left">
        <h4 className="text-[15px] font-black text-text-base tracking-tight">{label}</h4>
        <p className="text-[12px] text-text-muted font-bold mt-0.5">{desc}</p>
      </div>
    </div>
    
    <div className="flex items-center gap-6">
      {value && <span className="text-[14px] font-bold text-text-muted/80">{value}</span>}
      {action}
      {!hideArrow && <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:translate-x-1 transition-transform" />}
    </div>
  </div>
);

export default SettingsView;
