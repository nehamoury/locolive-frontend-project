import { useState, type FC, useEffect } from 'react';
import { Camera, MapPin, RefreshCw, Check, ChevronRight } from 'lucide-react';
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
      return;
    }
    if (!username) {
      setUsernameStatus('idle');
      setUsernameMsg('');
      return;
    }
    if (username.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMsg('Min 3 chars required');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/users/check-username?username=${encodeURIComponent(username)}`);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameMsg('Username is available');
        } else {
          setUsernameStatus('taken');
          setUsernameMsg('Username is already taken');
        }
      } catch (err: any) {
        setUsernameStatus('error');
        setUsernameMsg(err.response?.data?.error || 'Error checking username');
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
    <div className="space-y-6 pb-20">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Account Information</h2>
        <p className="text-[14px] text-text-muted font-bold">Manage your personal information and account details</p>
      </div>

      {/* 1. Profile Photo Section */}
      <div className="bg-bg-card rounded-[32px] border border-border-base/50 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 shadow-sm">
            <Camera className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="text-[16px] font-black text-text-base tracking-tight">Profile Photo</h4>
            <p className="text-[12px] text-text-muted font-bold mt-0.5">Change your profile picture</p>
          </div>
        </div>
        <label htmlFor="avatar-upload" className="cursor-pointer">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-bg-base shadow-md relative group/avatar">
            <img src={avatarPreview || getMediaUrl(user?.avatar_url, FALLBACKS.AVATAR(user?.username))} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </label>
      </div>

      {/* 2. Personal Details Section */}
      <div className="bg-bg-card rounded-[32px] border border-border-base/50 p-8 space-y-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-6 py-4 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all shadow-inner"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Username</label>
            <div className="relative">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full bg-bg-base/50 border rounded-2xl pl-6 pr-12 py-4 text-sm font-bold text-text-base outline-none transition-all shadow-inner ${
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
              <p className={`text-[10px] font-bold px-1 mt-1 ${usernameStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>
                {usernameMsg}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Email</label>
            <input type="text" value={user?.email || "Not set"} disabled className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-6 py-4 text-sm font-bold text-text-muted cursor-not-allowed" />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">Phone</label>
            <input type="text" value={user?.phone || "Not set"} disabled className="w-full bg-bg-base/50 border border-border-base/50 rounded-2xl px-6 py-4 text-sm font-bold text-text-muted cursor-not-allowed" />
          </div>
        </div>
      </div>

      {/* 3. Bio Section */}
      <div className="bg-bg-card rounded-[32px] border border-border-base/50 p-8 space-y-3 shadow-sm">
        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted/60 ml-1">About Me / Bio</label>
        <textarea 
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full bg-bg-base/50 border border-border-base/50 rounded-3xl px-6 py-4 text-sm font-bold text-text-base outline-none focus:border-pink-500/50 transition-all resize-none shadow-inner"
          placeholder="Write something about yourself..."
        />
      </div>

      {/* 4. Location Section */}
      <div className="bg-bg-card rounded-[32px] border border-border-base/50 p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h4 className="text-[15px] font-black text-text-base tracking-tight">Current Location</h4>
            <p className="text-[12px] text-text-muted font-bold mt-0.5">Raipur, Chhattisgarh (Auto-detected)</p>
          </div>
        </div>
        <span className="px-4 py-1.5 bg-green-500/10 text-green-600 text-[10px] font-black uppercase rounded-full border border-green-500/20">Default</span>
      </div>

      {/* 5. Save Button */}
      <button 
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full flex items-center justify-center gap-3 p-6 bg-brand-gradient hover:opacity-90 text-white rounded-[32px] shadow-xl shadow-pink-500/20 transition-all group cursor-pointer disabled:opacity-50 active:scale-[0.98]"
      >
        <span className="text-[16px] font-black">
          {saving ? 'Saving Changes...' : 'Save All Changes'}
        </span>
      </button>

      {/* 6. Account Actions Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-[13px] font-black uppercase tracking-widest text-text-muted/60 px-4">More Actions</h3>
        <button className="w-full bg-bg-card rounded-[32px] border border-border-base/50 p-6 flex items-center justify-between hover:bg-bg-base transition-all group cursor-pointer">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h4 className="text-[15px] font-black text-text-base tracking-tight">Switch Account</h4>
              <p className="text-[12px] text-text-muted font-bold mt-0.5">Switch to another Locolive account</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted/30 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
};

export default AccountInfoSection;
