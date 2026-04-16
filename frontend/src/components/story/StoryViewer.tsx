import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MoreHorizontal, Send, Trash2, Flag, Volume2, VolumeX, ChevronLeft, ChevronRight, Archive, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { BACKEND } from '../../utils/config';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type?: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  caption?: string;
  created_at: string;
  expires_at?: string;
  likes_count?: number;
  views_count?: number;
  liked?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  currentUser?: string;
  currentUserID?: string;
  onDelete?: (storyId: string) => void;
}

const STORY_DURATION = 5000; // 5 seconds per story


function timeLeft(dateStr?: string) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m left`;
  return `${h}h left`;
}

const StoryViewer = ({ stories, initialIndex, onClose, currentUser, currentUserID, onDelete }: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reply, setReply] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const story = stories[currentIndex];
  const isOwn = story?.user_id === currentUserID || story?.username === currentUser;
  const isVideo = story?.media_type === 'video';

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i: number) => i + 1);
      setProgress(0);
      setReply('');
      setMenuOpen(false);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i: number) => i - 1);
      setProgress(0);
      setReply('');
      setMenuOpen(false);
    }
  };

  // Progress bar + countdown timer
  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tickMs = 50; 
    const step = 100 / (STORY_DURATION / tickMs);
    intervalRef.current = setInterval(() => {
      setProgress((prev: number) => Math.min(prev + step, 100));
    }, tickMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentIndex, paused]);

  // Handle auto-next when progress completes
  useEffect(() => {
    if (progress >= 100) {
      goNext();
    }
  }, [progress, goNext]);

  // Video mute sync
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleLike = async (emoji: string = '❤️') => {
    try { await api.post(`/stories/${story.id}/react`, { emoji }); } catch { /* ignore */ }
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSendingReply(true);
    try {
      await api.post('/messages', { receiver_id: story.user_id, content: reply });
    } catch { /* ignore */ }
    setReply('');
    setSendingReply(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    
    setMenuOpen(false);
    try {
      setPaused(true);
      await api.delete(`/stories/${story.id}`);
      
      // Notify parent to remove from state
      onDelete?.(story.id);
      
      // If this was the only story, the parent's onClose will handle it via state change
      // But we can also proactively call onClose if we know it's the last one
      if (stories.length <= 1) {
        onClose();
        return;
      }

      // If there are more stories, the parent updates the list. 
      // We should probably just let the parent handle the "move to next" if it wants,
      // but for now we'll just adjust index if needed.
      if (currentIndex >= stories.length - 1) {
        setCurrentIndex(Math.max(0, stories.length - 2));
      }
      
      setProgress(0);
      setPaused(false);
    } catch (err: any) {
      console.error('Delete failed:', err);
      alert(err.response?.data?.error || 'Failed to delete story');
      setPaused(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      setPaused(true);
      await api.post(`/stories/${story.id}/archive`);
      
      toast.success('Story archived to vault!');
      setMenuOpen(false);
      setPaused(false);
    } catch (err: any) {
      console.error('Archive failed:', err);
      toast.error(err.response?.data?.error || 'Failed to archive story');
      setPaused(false);
    } finally {
      setArchiving(false);
    }
  };

  if (!story) return null;

  const expiryText = timeLeft(story.expires_at);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-2xl flex items-center justify-center overflow-hidden"
      >
        {/* Navigation - Left Arrow */}
        <div className="absolute left-4 md:left-10 z-[100] hidden md:block">
            <button 
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all disabled:opacity-0"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
        </div>

        {/* Navigation - Right Arrow */}
        <div className="absolute right-4 md:right-10 z-[100] hidden md:block">
            <button 
                onClick={goNext}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all"
            >
                <ChevronRight className="w-8 h-8" />
            </button>
        </div>

        {/* Story Card */}
        <motion.div 
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="relative w-full max-w-[450px] h-full md:h-[90vh] overflow-hidden md:rounded-[40px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] bg-gray-900 z-20"
        >
          {/* Media Content */}
          <div className="absolute inset-0">
            {isVideo ? (
              <video
                ref={videoRef}
                src={`${BACKEND}${story.media_url}`}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={muted}
                playsInline
              />
            ) : (
              <img
                src={`${BACKEND}${story.media_url}`}
                alt="Story"
                className="w-full h-full object-cover"
              />
            )}
            {/* Dark gradient overlay for bottom text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
          </div>

          {/* Top Bar Section */}
          <div className="absolute top-0 inset-x-0 p-5 pt-6 space-y-4 z-[100]">
            {/* Progress Segmented Bar */}
            <div className="flex gap-1.5 h-1 px-1">
              {stories.map((_, idx) => (
                <div key={idx} className="flex-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                    transition={{ duration: 0 }}
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-600">
                  <div className="w-full h-full rounded-full border-2 border-transparent overflow-hidden">
                    {story.avatar_url ? (
                      <img 
                        src={story.avatar_url.startsWith('http') ? story.avatar_url : `${BACKEND}${story.avatar_url}`} 
                        alt={story.username} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center font-bold text-white text-sm italic">
                        {story.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-black text-base tracking-tight italic">
                    {story.full_name || story.username}
                  </h4>
                  <div className="flex items-center gap-2">
                    {expiryText && (
                      <span className="text-[10px] font-bold text-white/60 tracking-tight">
                        {expiryText} left
                      </span>
                    )}
                    {story.views_count !== undefined && (
                        <>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/40" />
                            <span className="text-[10px] font-bold text-white/60 tracking-tight">
                                {story.views_count} views
                            </span>
                        </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {isVideo && (
                  <button onClick={() => setMuted(!muted)} className="p-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white/80 transition-all hover:bg-white/20 border border-white/10">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                
                <button 
                  onClick={() => setMenuOpen(!menuOpen)} 
                  className="p-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white/80 transition-all hover:bg-white/20 border border-white/10"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                <button onClick={onClose} className="p-2.5 bg-white/10 backdrop-blur-xl rounded-full text-white/80 transition-all hover:bg-white/20 border border-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Dropdown */}
          <AnimatePresence>
            {menuOpen && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-24 right-5 w-48 bg-gray-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-2xl z-[110] overflow-hidden"
                >
                    {isOwn && (
                    <div className="space-y-1">
                        <button 
                            onClick={handleArchive}
                            disabled={archiving}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-pink-400 hover:bg-pink-500/10 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} 
                            Archive to Vault
                        </button>
                        <button 
                            onClick={handleDelete}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Story
                        </button>
                    </div>
                    )}
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                    <Flag className="w-4 h-4" /> Report Story
                    </button>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Caption & Reactions Bottom Area */}
          <div className="absolute bottom-0 inset-x-0 p-8 space-y-6 z-[100]">
            {story.caption && (
               <div className="max-w-[85%]">
                 <p className="text-white text-lg font-black leading-tight tracking-tight italic drop-shadow-xl">{story.caption}</p>
               </div>
            )}

            <div className="flex flex-col gap-6">
                {/* 4 Reactions Bar */}
                <div className="flex items-center gap-3">
                    {['❤️', '🔥', '😂', '😮'].map((emoji) => (
                        <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.15, y: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleLike(emoji)}
                            className="w-13 h-13 rounded-full flex items-center justify-center text-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-xl transition-all"
                        >
                            {emoji}
                        </motion.button>
                    ))}
                </div>

                {/* Text Reply Bar */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <input
                            value={reply}
                            onChange={e => setReply(e.target.value)}
                            onFocus={() => setPaused(true)}
                            onBlur={() => setPaused(false)}
                            onKeyDown={e => e.key === 'Enter' && handleReply()}
                            className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl px-6 py-4 text-sm text-white focus:outline-none focus:border-white/40 transition-all placeholder:text-white/40 font-bold"
                            placeholder={`Reply to ${story.username}...`}
                        />
                        <button 
                            onClick={handleReply}
                            disabled={!reply.trim() || sendingReply}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white rounded-full text-black hover:bg-white/90 disabled:opacity-40 transition-all active:scale-90 shadow-xl"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
          </div>

          {/* Navigation Click Layers */}
          <div className="absolute inset-0 flex z-10">
            <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
            <div className="flex-1 h-full" onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} />
            <div className="w-1/3 h-full cursor-pointer" onClick={goNext} />
          </div>
        </motion.div>

        {/* Paused Indicator */}
        <AnimatePresence>
          {paused && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-black/60 backdrop-blur-3xl p-8 rounded-full border border-white/10 shadow-2xl">
                <div className="flex gap-2.5">
                  <div className="w-3 h-10 bg-white rounded-full shadow-[0_0_15px_white]" />
                  <div className="w-3 h-10 bg-white rounded-full shadow-[0_0_15px_white]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;
