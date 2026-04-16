import React, { useState, useRef } from 'react';
import { X, Camera, Edit3, Video, Calendar, Globe, MapPin, Flame, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BACKEND } from '../../utils/config';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateStoryModal = ({ isOpen, onClose, onSuccess }: CreateStoryModalProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showLocation, setShowLocation] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('story'); // 'story', 'text', 'video', 'event'
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size too large (max 50MB)');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    // Validation: Require file for Story and Video tabs
    if ((activeTab === 'story' || activeTab === 'video') && !file) {
      setError(`Please select a ${activeTab === 'video' ? 'video' : 'photo'} for your ${activeTab}.`);
      fileInputRef.current?.click();
      return;
    }
    // Validation: Require caption for text posts
    if (activeTab === 'text' && !caption.trim()) {
      setError('Please write something for your text post.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      let position: any;
      try {
        position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
      } catch {
        // Fallback to default location (Delhi) if geolocation fails
        position = { coords: { latitude: 28.6139, longitude: 77.2090 } };
      }

      let mediaUrl = '';
      let mediaType = 'text';

      // 1. Determine MediaType based on tab
      if (activeTab === 'story') mediaType = file?.type.startsWith('video') ? 'video' : 'image';
      else if (activeTab === 'video') mediaType = 'video';
      else if (activeTab === 'text') mediaType = 'text';
      else if (activeTab === 'event') mediaType = 'text'; // Events for now are text-based stories

      // 2. Upload media if present
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/upload', formData);
        mediaUrl = uploadRes.data.url;
      }

      // 3. Create the story
      await api.post('/stories', {
        media_url: mediaUrl,
        media_type: mediaType,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        is_anonymous: isAnonymous,
        show_location: showLocation,
        caption: caption.trim(),
      });

      // 4. Success cleanup
      setFile(null);
      setCaption('');
      setIsAnonymous(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Story Creation Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sharing.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 px-4">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-2">
          <h2 className="text-xl font-black text-gray-900 tracking-wide">Create Post</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-5">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D1794A] flex items-center justify-center overflow-hidden flex-shrink-0">
               {user?.avatar_url ? (
                  <img src={user.avatar_url.startsWith('http') ? user.avatar_url : `${BACKEND}${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                  <span className="text-white font-bold">{user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'P'}</span>
               )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm leading-tight">{user?.full_name || user?.username || 'Priya Sharma'}</span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-pink-500">
                <Globe className="w-3 h-3 text-blue-500" />
                Everyone • Near Raipur
              </div>
            </div>
          </div>

          {/* Post Tabs */}
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={() => { setActiveTab('story'); fileInputRef.current?.click(); }}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all ${activeTab === 'story' || file ? 'border-pink-400 bg-pink-50/10' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <Camera className={`w-5 h-5 ${activeTab === 'story' || file ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-bold ${activeTab === 'story' || file ? 'text-pink-500' : 'text-gray-500'}`}>
                 {file ? 'Media Attached' : 'Story'}
              </span>
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all ${activeTab === 'text' && !file ? 'border-pink-400 bg-pink-50/10' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <Edit3 className={`w-5 h-5 ${activeTab === 'text' && !file ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-bold ${activeTab === 'text' && !file ? 'text-pink-500' : 'text-gray-500'}`}>Text Post</span>
            </button>
            <button 
              onClick={() => { setActiveTab('video'); fileInputRef.current?.click(); }}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all ${activeTab === 'video' ? 'border-pink-400 bg-pink-50/10' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <Video className={`w-5 h-5 ${activeTab === 'video' ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-bold ${activeTab === 'video' ? 'text-pink-500' : 'text-gray-500'}`}>Video</span>
            </button>
            <button 
              onClick={() => setActiveTab('event')}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all justify-center ${activeTab === 'event' ? 'border-pink-400 bg-pink-50/10' : 'border-gray-200 hover:bg-gray-50'}`}
            >
              <Calendar className={`w-5 h-5 ${activeTab === 'event' ? 'text-pink-500' : 'text-gray-500'}`} />
              <span className={`text-[10px] font-bold ${activeTab === 'event' ? 'text-pink-500' : 'text-gray-500'}`}>Event</span>
            </button>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's happening near you? Share with your local community..."
              className="w-full h-24 p-4 rounded-xl border border-pink-400 bg-white placeholder:text-gray-400 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-100 resize-none shadow-sm"
              maxLength={280}
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="text-red-500 text-xs font-semibold px-2">{error}</div>
          )}

          {/* Mini Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${isAnonymous ? 'border-gray-400 text-gray-700 bg-gray-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <Globe className="w-3.5 h-3.5" /> Anonymous
            </button>
            <button 
              onClick={() => setShowLocation(!showLocation)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${showLocation ? 'border-pink-400 text-pink-500 bg-pink-50/10' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <MapPin className="w-3.5 h-3.5" /> Share Location
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs font-semibold transition-colors">
              <Flame className="w-3.5 h-3.5 text-orange-500" /> 24h Story
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between mt-2 flex-shrink-0">
          <span className="text-xs font-medium text-gray-400">
            {caption.length} / 280
          </span>
          <button
            onClick={handleSubmit}
            disabled={isUploading || (!file && !caption.trim())}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold text-sm rounded-full disabled:opacity-50 hover:shadow-lg hover:shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center min-w-[100px]"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post →'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateStoryModal;
