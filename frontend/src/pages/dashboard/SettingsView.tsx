import { useState, type FC, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, User, Shield, Bell, Lock, Mail, 
  Palette, Globe, HardDrive, 
  HelpCircle, Info, ChevronRight, LogOut,
  Camera, MapPin, RefreshCw, Sun, Moon, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
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
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = searchParams.get('section') as SettingsSection || 'account_info';
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  // Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  // Username Check States
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'|'error'>('idle');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Privacy Settings States
  const [whoCanMessage, setWhoCanMessage] = useState('connections');
  const [whoCanSeeStories, setWhoCanSeeStories] = useState('connections');
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingPrivacy, setLoadingPrivacy] = useState(false);

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (username === user?.username) {
      setUsernameStatus('idle');
      setUsernameMsg('');
      setSuggestions([]);
      return;
    }
    if (!username) {
      setUsernameStatus('idle');
      setUsernameMsg('');
      setSuggestions([]);
      return;
    }
    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMsg('Min 3 chars required');
      setSuggestions([]);
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-username?username=${encodeURIComponent(username)}`);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameMsg('Username is available');
          setSuggestions([]);
        } else {
          setUsernameStatus('taken');
          setUsernameMsg('Username is already taken');
          if (res.data.suggestions) setSuggestions(res.data.suggestions);
        }
      } catch (err: any) {
        setUsernameStatus('error');
        setUsernameMsg(err.response?.data?.error || 'Error checking username');
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, user?.username]);

  // Fetch Privacy Settings
  useEffect(() => {
    if (activeSection === 'privacy') {
      fetchPrivacyData();
    }
  }, [activeSection]);

  const fetchPrivacyData = async () => {
    setLoadingPrivacy(true);
    try {
      const [privacyRes, blockedRes] = await Promise.all([
        api.get('/privacy'),
        api.get('/users/blocked')
      ]);
      setWhoCanMessage(privacyRes.data.who_can_message || 'connections');
      setWhoCanSeeStories(privacyRes.data.who_can_see_stories || 'connections');
      setBlockedUsers(blockedRes.data || []);
    } catch (err) {
      console.error('Failed to fetch privacy data', err);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const updatePrivacySetting = async (key: 'who_can_message' | 'who_can_see_stories', value: string) => {
    try {
      const payload = {
        who_can_message: key === 'who_can_message' ? value : whoCanMessage,
        who_can_see_stories: key === 'who_can_see_stories' ? value : whoCanSeeStories,
        show_location: true // Default
      };
      await api.put('/privacy', payload);
      if (key === 'who_can_message') setWhoCanMessage(value);
      if (key === 'who_can_see_stories') setWhoCanSeeStories(value);
      import('react-hot-toast').then(({ toast }) => toast.success('Privacy updated!'));
    } catch (err) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to update privacy'));
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await api.delete(`/users/block/${blockedId}`);
      setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
      import('react-hot-toast').then(({ toast }) => toast.success('User unblocked!'));
    } catch (err) {
      import('react-hot-toast').then(({ toast }) => toast.error('Failed to unblock'));
    }
  };

  const handleTogglePrivacy = async () => {
    setUpdatingPrivacy(true);
    try {
      const newPrivate = !isPrivate;
      const { data } = await api.patch('/user/privacy', { is_private: newPrivate });
      setIsPrivate(data.is_private);
      updateUser({ is_private: data.is_private });
      import('react-hot-toast').then(({ toast }) => toast.success(data.message || 'Privacy settings updated!'));
    } catch (err: any) {
      import('react-hot-toast').then(({ toast }) => toast.error(err.response?.data?.error || 'Failed to update privacy settings'));
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleSaveProfile = async () => {
    if (usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'error') {
      import('react-hot-toast').then(({ toast }) => toast.error('Please resolve username issues before saving.'));
      return;
    }

    setSaving(true);
    try {
      let avatarUrl = user?.avatar_url || '';

      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await api.post('/upload', formData);
        avatarUrl = uploadRes.data.url;
      }

      const { data: updatedProfile } = await api.put('/profile', {
        full_name: fullName,
        username: username,
        bio: bio,
        avatar_url: avatarUrl,
      });

      updateUser(updatedProfile);
      import('react-hot-toast').then(({ toast }) => toast.success('Profile updated successfully!'));
    } catch (err: any) {
      import('react-hot-toast').then(({ toast }) => toast.error(err.response?.data?.error || 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

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
                    onClick={() => handleSectionChange(item.id as SettingsSection)}
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
                  <div className="flex items-center justify-between p-6 hover:bg-bg-base transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 shadow-sm">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-[15px] font-black text-text-base tracking-tight">Profile Photo</h4>
                        <p className="text-[12px] text-text-muted font-bold mt-0.5">Change your profile picture</p>
                      </div>
                    </div>
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-bg-base shadow-md relative group/avatar">
                        <img src={avatarPreview || getMediaUrl(user?.avatar_url, FALLBACKS.AVATAR(user?.username))} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </label>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Full Name</label>
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-[#fcf5f8] border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Username</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full bg-[#fcf5f8] border rounded-2xl pl-5 pr-10 py-3.5 text-sm font-bold text-text-base outline-none transition-all ${
                              (usernameStatus === 'invalid' || usernameStatus === 'taken' || usernameStatus === 'error') ? 'border-red-500/50 focus:border-red-500' :
                              usernameStatus === 'available' ? 'border-green-500/50 focus:border-green-500' :
                              'border-border-base/50 focus:border-pink-500/50'
                            }`}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                            {usernameStatus === 'checking' && <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                            {usernameStatus === 'available' && <Check className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                        {usernameMsg && (
                          <p className={`text-[10px] font-bold px-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                            {usernameMsg}
                          </p>
                        )}
                        {suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {suggestions.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setUsername(sug)}
                                className="px-2 py-1 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors cursor-pointer"
                              >
                                @{sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Bio</label>
                      <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={3}
                        className="w-full bg-[#fcf5f8] border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 opacity-60">
                        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Email</label>
                        <input type="text" value={user?.email || "Not set"} disabled className="w-full bg-gray-50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-muted cursor-not-allowed" />
                      </div>
                      <div className="space-y-2 opacity-60">
                        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Phone</label>
                        <input type="text" value={user?.phone || "Not set"} disabled className="w-full bg-gray-50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-muted cursor-not-allowed" />
                      </div>
                    </div>

                    {/* Location - Read Only */}
                    <div className="flex items-center justify-between py-4 border-t border-border-base/30 mt-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 shadow-sm">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-text-base">Current Location</h4>
                          <p className="text-[11px] text-text-muted font-bold mt-0.5">Raipur, Chhattisgarh (Auto-detected)</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-full border border-green-100">Default</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 p-6 bg-brand-gradient hover:opacity-90 text-white rounded-[32px] shadow-lg shadow-primary/20 transition-all group cursor-pointer disabled:opacity-50"
              >
                <div className="text-center">
                  <span className="text-[15px] font-black block">
                    {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                  </span>
                </div>
              </button>

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

          {activeSection === 'privacy' && (
            <div className="space-y-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-text-base">Privacy Settings</h2>
                <p className="text-[14px] text-text-muted font-bold">Control who can see your profile and content</p>
              </div>

              {loadingPrivacy ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="p-8 space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm">
                            <Lock className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-[16px] font-black text-text-base tracking-tight">Private Account</h4>
                            <p className="text-[13px] text-text-muted font-bold mt-0.5 max-w-[400px]">
                              When your account is private, only people you approve can see your photos and videos.
                            </p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleTogglePrivacy}
                          disabled={updatingPrivacy}
                          className={cn(
                            "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                            isPrivate ? "bg-pink-500" : "bg-gray-200"
                          )}
                        >
                          <span className={cn(
                            "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                            isPrivate ? "translate-x-5" : "translate-x-0"
                          )} />
                        </button>
                      </div>

                      <div className="pt-6 border-t border-border-base/30 space-y-6">
                        <h3 className="text-[14px] font-black uppercase tracking-widest text-text-muted/60">Interactions</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Mentions (Who can see your stories)</label>
                            <select 
                              value={whoCanSeeStories}
                              onChange={(e) => updatePrivacySetting('who_can_see_stories', e.target.value)}
                              className="w-full bg-[#fcf5f8] border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="everyone">Everyone</option>
                              <option value="connections">Connections Only</option>
                              <option value="nobody">No One</option>
                            </select>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Messages</label>
                            <select 
                              value={whoCanMessage}
                              onChange={(e) => updatePrivacySetting('who_can_message', e.target.value)}
                              className="w-full bg-[#fcf5f8] border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all appearance-none cursor-pointer"
                            >
                              <option value="everyone">Everyone</option>
                              <option value="connections">Connections Only</option>
                              <option value="nobody">No One</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blocked Users Section */}
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-text-muted/60 px-2">Blocked Accounts</h3>
                    <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
                      {blockedUsers.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-[13px] text-text-muted font-bold">You haven't blocked anyone yet.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border-base/30">
                          {blockedUsers.map((u) => (
                            <div key={u.id} className="flex items-center justify-between p-6">
                              <div className="flex items-center gap-4">
                                <img src={getMediaUrl(u.avatar_url, FALLBACKS.AVATAR(u.username))} className="w-10 h-10 rounded-full object-cover" alt="" />
                                <div>
                                  <h4 className="text-[14px] font-black text-text-base">{u.full_name}</h4>
                                  <p className="text-[11px] text-text-muted font-bold">@{u.username}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleUnblock(u.id)}
                                className="px-4 py-2 bg-pink-50 text-pink-600 text-[11px] font-black uppercase rounded-xl hover:bg-pink-100 transition-colors cursor-pointer"
                              >
                                Unblock
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-10">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-text-base">Appearance</h2>
                <p className="text-[14px] text-text-muted font-bold">Customize how Locolive looks on your device</p>
              </div>

              <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="p-8">
                  <h3 className="text-[15px] font-black text-text-base mb-6">Choose Theme</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => theme === 'dark' && toggleTheme()}
                      className={cn(
                        "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all",
                        theme === 'light' ? "border-pink-500 bg-pink-50/30" : "border-border-base hover:border-pink-200"
                      )}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-pink-500">
                        <Sun className="w-6 h-6" />
                      </div>
                      <span className="font-black text-[13px] uppercase tracking-wider">Light Mode</span>
                    </button>
                    <button 
                      onClick={() => theme === 'light' && toggleTheme()}
                      className={cn(
                        "flex flex-col items-center gap-4 p-6 rounded-[24px] border-2 transition-all",
                        theme === 'dark' ? "border-pink-500 bg-pink-50/30" : "border-border-base hover:border-pink-200"
                      )}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 shadow-sm flex items-center justify-center text-pink-500">
                        <Moon className="w-6 h-6" />
                      </div>
                      <span className="font-black text-[13px] uppercase tracking-wider">Dark Mode</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection !== 'account_info' && activeSection !== 'appearance' && (
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
