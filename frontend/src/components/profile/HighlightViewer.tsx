import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getMediaUrl } from '../../utils/media';
import { nullString } from '../../utils/string';

interface Story {
  id: string;
  media_url: string;
  media_type?: string;
  caption?: string;
  created_at: string;
}

interface HighlightViewerProps {
  highlightId: string;
  title: string;
  onClose: () => void;
  isOwner?: boolean;
}

const STORY_DURATION = 5000;

const HighlightViewer = ({ highlightId, title, onClose, isOwner }: HighlightViewerProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchHighlightStories();
  }, [highlightId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/highlights/${highlightId}`);
      setShowDeleteConfirm(false);
      onClose();
      window.dispatchEvent(new CustomEvent('highlight_deleted'));
    } catch (error) {
      console.error('Failed to delete highlight', error);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const fetchHighlightStories = async () => {
    try {
      const { data } = await api.get(`/highlights/${highlightId}`);
      setStories(data || []);
    } catch (error) {
      console.error('Failed to load highlight stories', error);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i: number) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i: number) => i - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (paused || loading || stories.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tickMs = 50; 
    const step = 100 / (STORY_DURATION / tickMs);
    intervalRef.current = setInterval(() => {
      setProgress((prev: number) => Math.min(prev + step, 100));
    }, tickMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentIndex, paused, loading, stories.length]);

  useEffect(() => {
    if (progress >= 100) {
      goNext();
    }
  }, [progress, goNext]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-2xl flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  const story = stories[currentIndex];
  if (!story) return null;

  const isVideo = story.media_type === 'video' || story.media_url.endsWith('.mp4');

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden"
      >
        {/* Navigation Layers */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/3 h-full cursor-pointer" onClick={goPrev} />
          <div className="flex-1 h-full" onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)} />
          <div className="w-1/3 h-full cursor-pointer" onClick={goNext} />
        </div>

        {/* Desktop Controls */}
        <div className="absolute left-10 z-[100] hidden md:block">
            <button 
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all disabled:opacity-0"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
        </div>

        <div className="absolute right-10 z-[100] hidden md:block">
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
          className="relative w-full max-w-[450px] h-full md:h-[90vh] overflow-hidden md:rounded-[40px] shadow-2xl bg-gray-900 z-20"
        >
          {/* Media */}
          <div className="absolute inset-0">
            {isVideo ? (
              <video
                ref={videoRef}
                src={getMediaUrl(story.media_url)}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted={muted}
                playsInline
              />
            ) : (
              <img
                src={getMediaUrl(story.media_url)}
                className="w-full h-full object-cover"
                alt=""
              />
            )}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
          </div>

          {/* Top Info */}
          <div className="absolute top-0 inset-x-0 p-6 pt-8 space-y-4 z-[100]">
            <div className="flex gap-1.5 h-1">
              {stories.map((_, idx) => (
                <div key={idx} className="flex-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' }}
                    transition={{ duration: 0 }}
                    className="h-full bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-black">
                   L
                </div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest">{title}</h4>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-tighter">Highlight</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }} className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-red-500 border border-red-500/30 hover:bg-red-500/40 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {isVideo && (
                  <button onClick={(e) => { e.stopPropagation(); setMuted(!muted); }} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/80">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white/80">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Caption */}
          {story.caption && (
            <div className="absolute bottom-10 inset-x-0 px-8 z-[100]">
                <p className="text-white text-lg font-black leading-tight drop-shadow-xl">{nullString(story.caption)}</p>
            </div>
          )}

          {/* Delete Confirmation */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); if (!deleting) setShowDeleteConfirm(false); }}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-900 border border-white/10 rounded-[32px] p-8 max-w-xs w-full mx-4 shadow-2xl text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-white font-black text-lg mb-2">Delete Highlight?</h3>
                  <p className="text-white/50 text-sm font-medium mb-8 leading-relaxed">
                    This will remove "{title}" and all its stories permanently.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 active:scale-95 transition-all text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="w-full py-3.5 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white/70 font-black text-sm uppercase tracking-widest rounded-2xl"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HighlightViewer;
