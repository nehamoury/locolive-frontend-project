import { useState, useRef, type FC, useEffect } from 'react';
import { X, Camera, Type, MapPin, Zap, Clock, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onRequestReelModal?: () => void;
}

type PostType = 'story' | 'post' | 'reel';

const CreatePostModal: FC<CreatePostModalProps> = ({ isOpen, onClose, onSuccess, onRequestReelModal }) => {
  const [postType, setPostType] = useState<PostType>('post');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('image');
  const [caption, setCaption] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [locationName, setLocationName] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
        setPostType('post');
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('video') ? 'video' : 'image');
  };

  const handleSubmit = async () => {
    if (mediaType !== 'text' && !mediaFile) {
      setError('Please select an image or video.');
      return;
    }
    if (mediaType === 'text' && !bodyText.trim()) {
      setError('Please write something for your text post.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let mediaUrl = '';

      // Upload media if present
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const uploadRes = await api.post('/upload', formData);
        mediaUrl = uploadRes.data.url;
      }

      // Get current location for stories
      let lat = 28.6139, lng = 77.2090, hasLocation = false;
      if (postType === 'story') {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          hasLocation = true;
        } catch { /* use defaults */ }
      }

      if (postType === 'story') {
        await api.post('/stories', {
          media_url: mediaUrl,
          media_type: mediaType,
          caption,
          latitude: lat,
          longitude: lng,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      } else {
        await api.post('/posts', {
          media_url: mediaUrl || 'text',
          media_type: mediaType,
          caption,
          body_text: bodyText,
          location_name: locationName,
          has_location: hasLocation,
          latitude: lat,
          longitude: lng,
        });
      }

      // Reset state
      setCaption('');
      setBodyText('');
      setLocationName('');
      setMediaFile(null);
      setMediaPreview(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setCaption('');
      setBodyText('');
      setLocationName('');
      setMediaFile(null);
      setMediaPreview(null);
      setError('');
      onClose();
    }
  };

  const handleTypeChange = (key: PostType) => {
      if (key === 'reel' && onRequestReelModal) {
          onRequestReelModal();
          return;
      }
      setPostType(key);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Create</h2>
              <button
                onClick={handleClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
               >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Type Switcher: Story vs Post vs Reel */}
              <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl">
                {([
                  { key: 'story', label: 'Story', icon: Zap },
                  { key: 'post', label: 'Post', icon: Clock },
                  { key: 'reel', label: 'Reel', icon: Video },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => handleTypeChange(key as PostType)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      postType === key
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Type badge info */}
              <p className="text-xs text-gray-400 text-center font-medium">
                {postType === 'story'
                  ? '⚡ Stories disappear after 24 hours'
                  : '📌 Posts stay on your profile forever'}
              </p>

              {/* Media Type */}
              <div className="flex gap-2">
                {(['image', 'video', 'text'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setMediaType(t)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold capitalize transition-all ${
                      mediaType === t
                        ? 'bg-gradient-to-r from-[#FF3B8E] to-[#A436EE] text-white shadow-md'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Media Upload Zone */}
              {mediaType !== 'text' && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden relative"
                >
                  {mediaPreview ? (
                    mediaType === 'video' ? (
                      <video src={mediaPreview} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-3">
                        <Camera className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-sm font-bold text-gray-400">Tap to upload</p>
                      <p className="text-xs text-gray-300 mt-1">
                        {mediaType === 'video' ? 'Video file' : 'JPG, PNG, WEBP'}
                      </p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Text post area */}
              {mediaType === 'text' && (
                <div className="rounded-[24px] bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 p-6 min-h-[180px]">
                  <Type className="w-5 h-5 text-pink-300 mb-3" />
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent resize-none outline-none text-gray-800 font-medium text-lg placeholder:text-gray-300"
                    rows={5}
                    maxLength={500}
                  />
                </div>
              )}

              {/* Caption (for both media and text posts) */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={mediaType === 'text' ? "Add hashtags or description (optional)..." : "Write a caption..."}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-700 placeholder:text-gray-300 resize-none outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                rows={3}
                maxLength={500}
              />

              {/* Location (Posts only) */}
              {postType === 'post' && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Add location (optional)"
                    className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-300"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-red-500 font-medium text-center px-2">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full py-4 bg-gradient-to-r from-[#FF3B8E] to-[#A436EE] text-white rounded-full font-bold text-base shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {uploading
                  ? 'Sharing...'
                  : postType === 'story'
                    ? '⚡ Share Story'
                    : '📌 Share Post'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
