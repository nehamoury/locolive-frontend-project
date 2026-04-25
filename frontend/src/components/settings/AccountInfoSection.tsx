import { useState, type FC, useEffect } from 'react';
import { Camera, MapPin, RefreshCw, Check } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { useAuth } from '../../context/AuthContext';

interface AccountInfoSectionProps {}

const AccountInfoSection: FC<AccountInfoSectionProps> = () => {
  const { user, updateUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Username Check States
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'|'error'>('idle');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

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

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Account Information</h2>
        <p className="text-[14px] text-text-muted font-bold">Manage your personal information and account details</p>
      </div>

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

      <div className="space-y-4 pt-6">
        <h3 className="text-[13px] font-black uppercase tracking-widest text-text-muted/60 px-2">Account Actions</h3>
        <div className="bg-white rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
           <div className="flex items-center justify-between p-6 hover:bg-bg-base transition-colors group cursor-pointer">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500 shadow-sm">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-[15px] font-black text-text-base tracking-tight">Switch Account</h4>
                <p className="text-[12px] text-text-muted font-bold mt-0.5">Switch to another account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoSection;
