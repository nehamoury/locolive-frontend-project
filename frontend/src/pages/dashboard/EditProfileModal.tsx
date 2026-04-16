import { useState, type FC } from 'react';
import { X, Camera, Loader2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BACKEND } from '../../utils/config';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      let avatarUrl = user?.avatar_url || '';

      // Upload avatar first if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await api.post('/upload', formData);
        avatarUrl = uploadRes.data.url;
      }

      await api.put('/profile', {
        full_name: fullName,
        bio: bio,
        avatar_url: avatarUrl,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to show new data
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white border border-primary/10 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-primary/10">
          <h3 className="text-lg font-bold text-black">Edit Profile</h3>
          <button 
            onClick={onClose} 
            aria-label="Close edit modal"
            className="p-2 hover:bg-primary/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-black/40" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <label htmlFor="avatar-upload" className="relative cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-3xl font-bold overflow-hidden text-white shadow-lg shadow-primary/20">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : user?.avatar_url ? (
                  <img src={`${BACKEND}${user.avatar_url}`} alt="Current Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.charAt(0) || 'U'
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="full-name" className="text-xs font-bold text-black/40 uppercase tracking-widest ml-1">Name</label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              autoComplete="name"
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Your full name"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="text-xs font-bold text-black/40 uppercase tracking-widest ml-1">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={150}
              className="w-full bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:border-primary/50 transition-colors resize-none"
              placeholder="Tell the world about yourself…"
            />
            <p className="text-[10px] text-black/60 text-right">{bio.length}/150</p>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-400/10 py-2 px-4 rounded-xl text-center">{error}</p>}
          {success && <p className="text-sm text-green-400 bg-green-400/10 py-2 px-4 rounded-xl text-center">Profile updated!</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Changes</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
