import { useState, useEffect } from 'react';
import { X, Video, MapPin, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import UploadComponent from './UploadComponent';
import UniversalCropModal from '../ui/UniversalCropModal';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateReelModal = ({ isOpen, onClose, onSuccess }: CreateReelModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState('');
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Cleanup: Revoke URL to prevent memory leaks
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setIsEditing(true);
    setError('');
  };



  const handleSubmit = async () => {
    if (!file) {
      setError('Please select media for your reel.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const position: any = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      }).catch(() => null);

      // Progress Simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 15, 90));
      }, 500);

      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload', formData);
      const videoUrl = uploadRes.data.url;

      clearInterval(progressInterval);
      setUploadProgress(95);

      await api.post('/reels', {
        video_url: videoUrl,
        caption: caption.trim(),
        is_ai_generated: isAiGenerated,
        latitude: position?.coords?.latitude || 0,
        longitude: position?.coords?.longitude || 0,
        has_location: !!position,
      });

      setUploadProgress(100);
      await new Promise(r => setTimeout(r, 600));

      setFile(null);
      setCaption('');
      onSuccess();
      // Reload page to show new reel immediately as requested by user
      window.location.reload();
    } catch (err: any) {
      console.error('Reel upload error:', err);
      setError(err.response?.data?.error || 'Failed to share reel. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-stretch md:items-center justify-center bg-black/70 backdrop-blur-xl p-0 md:px-4 md:py-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-none md:rounded-[32px] w-full md:max-w-lg h-full md:h-auto md:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Share Reel</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-10">
              {/* Media Section */}
              <div className="relative w-full aspect-[4/3] rounded-[24px] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden shrink-0">
                {file && previewUrl ? (
                  <div className="w-full h-full relative group">
                    {file.type.startsWith('image/') ? (
                        <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <video
                          ref={(el) => {
                            if (el) {
                              el.play().catch(e => console.error("Autoplay failed", e));
                            }
                          }}
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          autoPlay
                          loop
                          muted
                          playsInline
                        />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                        <button 
                            onClick={() => { setFile(null); setIsEditing(false); }}
                            className="px-6 py-2.5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                            Change Media
                        </button>
                    </div>
                  </div>
                ) : (
                    <UploadComponent onFileSelect={handleFileSelect} />
                )}
              </div>

              {/* Caption Section */}
              <div className="space-y-3">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's the vibe today? #social #live"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-700 placeholder:text-gray-300 resize-none outline-none focus:ring-2 focus:ring-pink-200 transition-all"
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Settings Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setIsAiGenerated(!isAiGenerated)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${isAiGenerated ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-primary/20 hover:bg-primary/5'}`}
                 >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAiGenerated ? 'bg-primary text-white shadow-lg' : 'bg-white border border-gray-100'}`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">AI Generated</p>
                      <p className="text-[8px] font-bold opacity-60">Transparency tag</p>
                    </div>
                 </button>

                 <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 text-gray-400">
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest">Location</p>
                      <p className="text-[8px] font-bold opacity-60">Smart geotagging</p>
                    </div>
                 </div>
              </div>

              {/* Publishing Progress */}
              <AnimatePresence>
                  {isUploading && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-primary">
                              <span>Publishing Magic...</span>
                              <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-brand-gradient" />
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>

              {error && (
                  <p className="text-xs text-red-500 font-bold bg-red-50 p-4 rounded-2xl border border-red-100">
                      {error}
                  </p>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                  <button onClick={onClose} className="px-6 py-4 bg-gray-100 text-gray-600 text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all cursor-pointer">
                      Discard
                  </button>
                  <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={isUploading || !file}
                      className="flex-1 py-4 bg-brand-gradient text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                  >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Share Reel <ArrowRight className="w-4 h-4" /></>}
                  </motion.button>
              </div>
            </div>
          </motion.div>
      </motion.div>

      {/* Advanced Crop Tool Overay */}
      {isEditing && file && (
          <UniversalCropModal
            isOpen={isEditing}
            file={file} 
            initialRatio="9/16"
            onConfirm={(_settings) => {
                // We'll store settings if needed, but for now Confirm closes it
                setIsEditing(false);
            }} 
            onCancel={() => { setFile(null); setIsEditing(false); }} 
          />
      )}
    </AnimatePresence>
  );
};

export default CreateReelModal;
