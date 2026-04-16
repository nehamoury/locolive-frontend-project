import { useState } from 'react';
import { X, Video, MapPin, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import UploadComponent from './UploadComponent';
import CropModal from './CropModal';

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

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setIsEditing(true);
  };

  const handleCropConfirm = (processed: any) => {
    setIsEditing(false);
    // In a real production app, we would process the image/video here
    // For now, we use the original file but the UI shows the intent
    setFile(processed);
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
      onClose();
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
        className="fixed inset-0 z-[7500] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4 py-8"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-4xl bg-bg-card border border-border-base rounded-[3rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row transition-all duration-500"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-2.5 rounded-2xl bg-black/5 hover:bg-black/10 text-text-muted hover:text-text-base border border-border-base transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* LEFT: Media Section */}
          <div className="relative w-full md:w-[380px] h-[360px] md:h-auto bg-zinc-950 flex flex-col items-center justify-center border-r border-border-base overflow-hidden">
            {file ? (
              <div className="w-full h-full relative group">
                {file.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                ) : (
                    <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
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

          {/* RIGHT: Content Section */}
          <div className="flex-1 flex flex-col p-10 gap-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-black italic text-text-base tracking-tight uppercase">LocoReel Pro</h2>
              </div>
              <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.3em] pl-11">Advanced Creator Studio</p>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-widest text-text-muted">Caption & Insights</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's the vibe today? #social #live"
                className="w-full h-32 bg-bg-sidebar/50 border border-border-base rounded-2xl p-5 text-[14px] font-medium resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <div className="flex justify-end pr-2">
                <span className="text-[10px] font-bold text-text-muted">{caption.length}/500</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <button
                  onClick={() => setIsAiGenerated(!isAiGenerated)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${isAiGenerated ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-bg-sidebar/30 border-border-base text-text-muted hover:border-primary/20 hover:bg-primary/5'}`}
               >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAiGenerated ? 'bg-primary text-white shadow-lg' : 'bg-zinc-100'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-widest">AI Generated</p>
                    <p className="text-[9px] font-bold opacity-60">Transparency tag</p>
                  </div>
               </button>

               <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg-sidebar/30 border border-border-base text-text-muted">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-widest">Location</p>
                    <p className="text-[9px] font-bold opacity-60">Smart geotagging</p>
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
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-brand-gradient" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold bg-red-50 p-4 rounded-2xl border border-red-100">
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>

            <div className="mt-auto pt-4 flex gap-4">
                <button onClick={onClose} className="px-8 py-4 bg-bg-sidebar border border-border-base text-text-base text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all cursor-pointer">
                    Discard
                </button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={isUploading || !file}
                    className="flex-1 py-4 bg-brand-gradient text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all cursor-pointer"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Share Moment <ArrowRight className="w-4 h-4" /></>}
                </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Advanced Crop Tool Overay */}
      {isEditing && file && (
          <CropModal 
            file={file} 
            onConfirm={handleCropConfirm} 
            onCancel={() => { setFile(null); setIsEditing(false); }} 
          />
      )}
    </AnimatePresence>
  );
};

export default CreateReelModal;
