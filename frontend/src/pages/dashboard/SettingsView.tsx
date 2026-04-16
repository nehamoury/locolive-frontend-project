import { useState, useEffect, type FC } from 'react';
import { 
  ArrowLeft, User, Shield, Bell, Sun, Moon, 
  Palette, MapPin, Ghost
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsViewProps {
  onBack: () => void;
}

type SettingsTab = 'account' | 'privacy' | 'notifications' | 'appearance';

const SettingsView: FC<SettingsViewProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [loading, setLoading] = useState(false);

  // Form States
  const [accountData, setAccountData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: 'Raipur, Chhattisgarh' // Placeholder or fetch if available
  });

  const [privacy, setPrivacy] = useState({
    who_can_message: 'everyone',
    who_can_see_stories: 'everyone',
    show_location: true,
    is_ghost_mode: user?.is_ghost_mode || false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    story_reactions: true,
    new_crossings: true,
    connection_requests: true,
    profile_views: false,
    direct_messages: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/privacy');
        setPrivacy(prev => ({
          ...prev,
          who_can_message: res.data.who_can_message || 'everyone',
          who_can_see_stories: res.data.who_can_see_stories || 'everyone',
          show_location: res.data.show_location ?? true,
        }));
      } catch (err) {
        console.error('Failed to fetch privacy settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleUpdateAccount = async () => {
    setLoading(true);
    try {
      await api.put('/profile', accountData);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacy = async (key: keyof typeof privacy, value: string | boolean) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    
    try {
      if (key === 'is_ghost_mode') {
         await api.put('/location/ghost-mode', { enabled: value, duration: 0 });
      } else {
         await api.put('/privacy', {
           who_can_message: updated.who_can_message,
           who_can_see_stories: updated.who_can_see_stories,
           show_location: updated.show_location
         });
      }
      toast.success('Privacy settings saved');
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const toggleNotification = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings updated');
  };

  const categories = [
    { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Style', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full bg-[#f8f9fa] dark:bg-bg-base text-slate-800 dark:text-text-base overflow-y-auto no-scrollbar pb-32 scroll-smooth">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-6">
            <button 
                onClick={onBack} 
                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-black tracking-tight italic">Settings</h1>
          </div>
        </div>

        {/* Tab Selection (Horizontal Scroll) */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
                <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id as SettingsTab)}
                    className={`
                        flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap
                        ${activeTab === cat.id 
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
                            : 'bg-white dark:bg-bg-card text-slate-500 dark:text-text-muted border border-slate-100 dark:border-white/5 hover:border-pink-200'}
                    `}
                >
                    {cat.icon} {cat.label}
                </button>
            ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'account' && (
              <section className="space-y-6">
                <div className="bg-white dark:bg-bg-card rounded-[32px] p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                        <h2 className="text-xl font-black">Account Information</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Manage your personal details</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <InputGroup 
                            label="Full Name" 
                            secondary="Displayed on your profile"
                            value={accountData.full_name}
                            onChange={(v) => setAccountData({...accountData, full_name: v})}
                        />
                        <InputGroup 
                            label="Username" 
                            secondary={`@${accountData.username}`}
                            value={accountData.username}
                            onChange={(v) => setAccountData({...accountData, username: v})}
                        />
                        <InputGroup 
                            label="Bio" 
                            secondary="Describe yourself in a few words"
                            value={accountData.bio}
                            onChange={(v) => setAccountData({...accountData, bio: v})}
                        />
                        <InputGroup 
                            label="Location" 
                            secondary="Your base city"
                            value={accountData.location}
                            onChange={(v) => setAccountData({...accountData, location: v})}
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={handleUpdateAccount}
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
              </section>
            )}

            {activeTab === 'notifications' && (
               <section className="space-y-6">
                <div className="bg-white dark:bg-bg-card rounded-[32px] p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
                    <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                        <h2 className="text-xl font-black">Notifications</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Choose what you get notified about</p>
                    </div>

                    <div className="space-y-1">
                        <ToggleItem 
                            title="Story reactions" 
                            description="When someone reacts to your story"
                            active={notificationSettings.story_reactions}
                            onToggle={() => toggleNotification('story_reactions')}
                        />
                        <ToggleItem 
                            title="New crossings" 
                            description="When you cross paths with someone"
                            active={notificationSettings.new_crossings}
                            onToggle={() => toggleNotification('new_crossings')}
                        />
                        <ToggleItem 
                            title="Connection requests" 
                            description="When someone wants to connect"
                            active={notificationSettings.connection_requests}
                            onToggle={() => toggleNotification('connection_requests')}
                        />
                        <ToggleItem 
                            title="Profile views" 
                            description="When someone views your profile"
                            active={notificationSettings.profile_views}
                            onToggle={() => toggleNotification('profile_views')}
                        />
                        <ToggleItem 
                            title="Direct messages" 
                            description="New message notifications"
                            active={notificationSettings.direct_messages}
                            onToggle={() => toggleNotification('direct_messages')}
                        />
                    </div>
                </div>
              </section>
            )}

            {activeTab === 'appearance' && (
              <section className="space-y-6">
                 <div className="bg-white dark:bg-bg-card rounded-[32px] p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                    <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                        <h2 className="text-xl font-black">Appearance</h2>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Customize your experience</p>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-black">Theme</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {theme === 'light' ? 'Light theme is currently active' : 'Dark theme is currently active'}
                            </p>
                        </div>
                        <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                            <button 
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${theme === 'light' ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500'}`}
                            >
                                <Sun className="w-4 h-4" /> Light
                            </button>
                            <button 
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`}
                            >
                                <Moon className="w-4 h-4" /> Dark
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-sm font-black">Language</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">App display language</p>
                        </div>
                        <select className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-3 rounded-2xl text-xs font-black outline-none min-w-[160px]">
                            <option>English</option>
                            <option>Hindi (Coming Soon)</option>
                            <option>Spanish (Coming Soon)</option>
                        </select>
                    </div>
                 </div>
              </section>
            )}

            {activeTab === 'privacy' && (
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <PrivacyCard 
                            icon={<Ghost className="w-5 h-5 text-indigo-500" />}
                            title="Ghost Mode"
                            description="Hide your location from the map and all discovery features"
                            active={privacy.is_ghost_mode}
                            onToggle={() => updatePrivacy('is_ghost_mode', !privacy.is_ghost_mode)}
                        />
                        <PrivacyCard 
                            icon={<MapPin className="w-5 h-5 text-pink-500" />}
                            title="Location Sharing"
                            description="Share your real-time position on the live community map"
                            active={privacy.show_location}
                            onToggle={() => updatePrivacy('show_location', !privacy.show_location)}
                        />
                    </div>

                    <div className="bg-white dark:bg-bg-card rounded-[32px] p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-black">Who can message me</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control who is allowed to send you direct messages</p>
                            </div>
                            <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                                {['everyone', 'connections', 'nobody'].map((opt) => (
                                    <button 
                                        key={opt}
                                        onClick={() => updatePrivacy('who_can_message', opt)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${privacy.who_can_message === opt ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-black">Who sees my stories</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control who can view your local stories</p>
                            </div>
                            <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                                {['everyone', 'connections', 'nobody'].map((opt) => (
                                    <button 
                                        key={opt}
                                        onClick={() => updatePrivacy('who_can_see_stories', opt)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${privacy.who_can_see_stories === opt ? 'bg-pink-500 text-white shadow-md' : 'text-slate-500'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-pink-50/50 dark:bg-pink-500/5 p-6 rounded-[24px] border border-pink-100 dark:border-pink-500/10 space-y-4">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-pink-500" />
                                <h4 className="text-sm font-black text-pink-600 dark:text-pink-400">Panic Mode</h4>
                            </div>
                            <p className="text-[11px] font-medium leading-relaxed text-pink-700/70 dark:text-pink-300/50">
                                Instantly and permanently deletes ALL your data — stories, messages, location history, and your account. This action cannot be undone under any circumstances.
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                <button className="px-6 py-2.5 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20">
                                    Activate Panic Mode
                                </button>
                                <button onClick={onBack} className="px-6 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Danger Zone (Always at bottom) */}
        <div className="mt-12 pt-12 border-t border-slate-200 dark:border-white/5 space-y-4">
             <div className="bg-red-500/5 rounded-[32px] p-8 border border-red-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                   <h3 className="text-lg font-black text-red-600 dark:text-red-400">Danger Zone</h3>
                   <p className="text-xs font-bold text-red-500/60 uppercase tracking-widest mt-1">Irreversible account actions</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => logout()}
                        className="px-6 py-3 rounded-2xl bg-white dark:bg-bg-card border border-slate-100 dark:border-white/5 font-black text-xs uppercase tracking-widest text-slate-500 hover:text-red-500 transition-all"
                    >
                        Sign Out
                    </button>
                    <button className="px-6 py-3 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">
                        Delete Account
                    </button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

// UI Helpers
const InputGroup = ({ label, secondary, value, onChange }: { label: string, secondary: string, value: string, onChange: (v: string) => void }) => (
    <div className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all group">
        <div className="flex-1">
            <h4 className="text-sm font-black">{label}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{secondary}</p>
        </div>
        <div className="flex-[0.6]">
            <input 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-5 py-3 rounded-xl text-xs font-bold focus:border-pink-500/50 outline-none transition-all" 
                placeholder={`Enrer ${label}`}
            />
        </div>
    </div>
);

const ToggleItem = ({ title, description, active, onToggle }: { title: string, description: string, active: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-all border-b border-transparent hover:border-slate-100 dark:border-white/5 last:border-0 group">
        <div>
            <h4 className="text-sm font-black transition-colors">{title}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{description}</p>
        </div>
        <button 
            onClick={onToggle}
            className={`w-14 h-7 rounded-full relative transition-all duration-300 flex items-center p-1 ${active ? 'bg-pink-500 shadow-inner' : 'bg-slate-200 dark:bg-white/10'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-7' : 'translate-x-0'}`} />
        </button>
    </div>
);

const PrivacyCard = ({ icon, title, description, active, onToggle }: { icon: React.ReactNode, title: string, description: string, active: boolean, onToggle: () => void }) => (
    <div className="bg-white dark:bg-bg-card p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4 group hover:border-pink-200 transition-all">
        <div className="flex items-center justify-between">
            <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <button 
                onClick={onToggle}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-400'}`}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                {active ? 'Active' : 'Inactive'}
            </button>
        </div>
        <div>
            <h4 className="text-sm font-black">{title}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose mt-1">{description}</p>
        </div>
        <button 
            onClick={onToggle}
            className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${active ? 'bg-pink-500 text-white border-transparent' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'}`}
        >
            {active ? 'Disable' : 'Enable Now'}
        </button>
    </div>
);


export default SettingsView;
