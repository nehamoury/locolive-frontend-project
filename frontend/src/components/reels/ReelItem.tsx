import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Volume2, VolumeX, Sparkles, Play, Pause } from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import ReelOptionsBottomSheet from './ReelOptionsBottomSheet';
import ShareModal from '../share/ShareModal';
import { nullString } from '../../utils/string';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

interface Reel {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  video_url: string;
  caption?: string;
  is_ai_generated: boolean;
  location_name?: string;
  distance_meters?: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
  connection_status?: string;
}

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onToggleComments: () => void;
  currentUserID?: string;
}

const ReelItem = ({ reel, isActive, onToggleComments, currentUserID }: ReelItemProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(reel.is_liked);
  const [saved, setSaved] = useState(reel.is_saved);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const { isMuted, toggleMute } = useSound();
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isFollowing, setIsFollowing] = useState(reel.connection_status === 'pending');
  const [progress, setProgress] = useState(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPlayAnim, setShowPlayAnim] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(isActive);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) setShouldLoad(true);
  }, [isActive]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
        } else if (!isActive) {
          setShouldLoad(false);
        }
      },
      { threshold: 0.1, rootMargin: '100% 0px' } // Preload when adjacent
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!isActive || !video) return;

    const updateProgress = () => {
      if (video && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    if (video.addEventListener) {
      video.addEventListener('timeupdate', updateProgress);
    }

    return () => {
      if (video && video.removeEventListener) {
        video.removeEventListener('timeupdate', updateProgress);
      }
    };
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isSubscribed = true;

    const handlePlay = async () => {
      if (isActive && isPlaying) {
        try {
          // Absolute Silence: Force pause all other videos
          document.querySelectorAll('video').forEach(v => {
            if (v !== video) {
              v.pause();
              v.muted = true;
            }
          });

          video.muted = isMuted;
          video.volume = isMuted ? 0 : 1;

          await new Promise(resolve => setTimeout(resolve, 50));

          if (isSubscribed && isPlaying) {
            await video.play();
          }
        } catch (error) {
          console.log("Playback interrupted:", error);
        }
      } else {
        video.pause();
      }
    };

    handlePlay();

    return () => {
      isSubscribed = false;
      if (!isActive && video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, [isActive, isPlaying, isMuted]);

  // Effect for MediaSession (Depends only on isActive)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isActive) return;

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `LocoLive Reel`,
        artist: `@${reel.username}`,
        artwork: [{ src: getMediaUrl(reel.avatar_url, FALLBACKS.AVATAR(reel.username)), sizes: '512x512', type: 'image/png' }]
      });

      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => {
        video.play();
        setIsPlaying(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        video.pause();
        setIsPlaying(false);
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
      }
    };
  }, [isActive, isPlaying, reel.username, reel.avatar_url]);

  // Separate effect for Mute/Unmute to prevent video restart
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isActive || isMuted;
      videoRef.current.volume = isMuted ? 0 : 1;
    }
  }, [isActive, isMuted]);


  const isLiking = useRef(false);
  const handleLike = async () => {
    if (isLiking.current) return;
    isLiking.current = true;

    try {
      if (liked) {
        const res = await api.delete(`/reels/${reel.id}/like`);
        if (res.data.success) {
          setLikesCount(res.data.data.likes_count);
        } else {
          setLikesCount(prev => prev - 1);
        }
      } else {
        const res = await api.post(`/reels/${reel.id}/like`);
        if (res.data.success) {
          setLikesCount(res.data.data.likes_count);
        } else {
          setLikesCount(prev => prev + 1);
        }
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
        
        // Premium Haptic Feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
      setLiked(!liked);
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      isLiking.current = false;
    }
  };

  const handleSave = async () => {
    try {
      if (saved) {
        await api.delete(`/reels/${reel.id}/save`);
      } else {
        await api.post(`/reels/${reel.id}/save`);
      }
      setSaved(!saved);
      queryClient.invalidateQueries({ queryKey: ['users', 'profile', 'me'] });
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleMore = () => {
    setIsOptionsOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/reels/${reel.id}`);
      toast.success('Reel deleted successfully.');
      // Refresh or navigate back
      window.location.reload();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete reel.');
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing || reel.connection_status === 'pending') {
        await api.delete(`/connections/${reel.user_id}`);
        setIsFollowing(false);
        // Force refresh the specific reel status in memory if necessary, 
        // but state update is usually enough for local UI.
        if (reel.connection_status) reel.connection_status = 'none';
      } else {
        await api.post('/connections/request', { target_user_id: reel.user_id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
    }
  };

  const handleProfileClick = () => {
    navigate(`/dashboard/user/${reel.user_id}`);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayAnim(true);
    setTimeout(() => setShowPlayAnim(false), 500);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] md:h-full bg-black snap-start snap-always overflow-hidden flex items-center justify-center flex-shrink-0">
      {/* High-Impact Blurred Backdrop using CSS (No extra video for better sound/perf) */}
      <div className="absolute inset-0 bg-black overflow-hidden pointer-events-none">
        <div
          className="w-full h-full bg-cover bg-center blur-[80px] scale-110 opacity-30"
          style={{ backgroundImage: `url(${getMediaUrl(reel.video_url)})` }}
        />
      </div>

      {/* Primary High-Fidelity Video Foreground */}
      <video
        ref={videoRef}
        src={shouldLoad ? getMediaUrl(reel.video_url) : undefined}
        className="relative z-10 w-full h-full object-cover drop-shadow-2xl"
        loop
        muted={!isActive || isMuted}
        playsInline
        preload="auto"
        autoPlay={false}
        onClick={togglePlay}
      />

      {/* Play/Pause Overlay Animation */}
      <AnimatePresence>
        {showPlayAnim && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="absolute z-40 pointer-events-none bg-black/20 backdrop-blur-sm p-6 rounded-full"
          >
            {isPlaying ? (
              <Play className="w-12 h-12 text-white fill-white" />
            ) : (
              <Pause className="w-12 h-12 text-white fill-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>


      {/* Overlay Gradients - Refined for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent via-40% to-black pointer-events-none" />

      {/* Right Side Actions: Instagram Style Vertical Stack */}
      <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-2.5 z-20">
        <div className="flex flex-col items-center gap-3">
          {/* Like */}
          <div className="flex flex-col items-center gap-0.5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              aria-label={liked ? "Unlike" : "Like"}
              className="flex items-center justify-center w-10 h-10 transition-all duration-300 relative"
            >
              <Heart className={`w-8 h-8 ${liked ? 'fill-primary text-primary' : 'text-white'}`} />
              
              {/* Floating Heart Animation */}
              <AnimatePresence>
                {showHeartAnim && (
                  <motion.div
                    initial={{ y: 0, opacity: 1, scale: 1 }}
                    animate={{ y: -60, opacity: 0, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    className="absolute pointer-events-none"
                  >
                    <Heart className="w-8 h-8 fill-primary text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            <span className="text-[11.5px] font-bold text-white drop-shadow-md">{likesCount}</span>
          </div>

          {/* Comment */}
          <div className="flex flex-col items-center gap-0.5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleComments}
              aria-label="View comments"
              className="flex items-center justify-center w-10 h-10 text-white transition-all"
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </motion.button>
            <span className="text-[11.5px] font-bold text-white drop-shadow-md">{reel.comments_count}</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-0.5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              aria-label="Share reel"
              className="flex items-center justify-center w-10 h-10 text-white transition-all"
            >
              <Share2 className="w-8 h-8 text-white" />
            </motion.button>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.shares_count || 0}</span>
          </div>

          {/* Save */}
          <div className="flex flex-col items-center gap-0.5">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSave}
              aria-label={saved ? "Unsave" : "Save"}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 relative group
                ${saved ? 'text-primary' : 'text-white'}
                hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]
              `}
            >
              {/* Background glow for premium feel */}
              <div className={`absolute inset-0 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 border border-white/20`} />
              
              <Bookmark 
                className={`w-7 h-7 transition-all duration-300 ${saved ? 'fill-primary text-primary filter drop-shadow-[0_0_8px_rgba(255,0,110,0.5)]' : 'text-white'}`} 
              />

              {/* Save Success Animation */}
              <AnimatePresence>
                {saved && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                    className="absolute pointer-events-none"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMore}
          aria-label="More options"
          className="flex items-center justify-center w-10 h-10 text-white hover:opacity-70 transition-all mt-2"
        >
          <MoreVertical strokeWidth={2.5} className="w-5 h-5" />
        </motion.button>
      </div>

      <ReelOptionsBottomSheet
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        isOwner={reel.user_id === currentUserID}
        onDelete={() => {
          setIsOptionsOpen(false);
          setShowDeleteConfirm(true);
        }}
        username={reel.username}
        userId={reel.user_id}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Reel"
        message="Are you sure you want to permanently delete this reel? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/reels/${reel.id}`}
        title={`reel by @${reel.username}`}
        contentId={reel.id}
        contentType="reel"
      />

      {/* Bottom Information: Ultra-compact & at the very edge */}
      <div className="absolute bottom-5 left-4 right-16 z-20 flex flex-col gap-1.5 py-1">

        {/* Identity & Follow Layer */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleProfileClick}>
          <div className="relative">
            <div className="w-11 h-11 rounded-[16px] p-0.5 bg-gradient-to-tr from-primary via-accent to-secondary shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] border border-black overflow-hidden bg-gray-900">
                <img
                  src={getMediaUrl(nullString(reel.avatar_url), FALLBACKS.AVATAR(reel.username))}
                  alt={reel.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h4 className="text-white font-black text-[13px]  tracking-wider font-brand drop-shadow-md">@{reel.username}</h4>
              {reel.user_id !== currentUserID && reel.connection_status !== 'accepted' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow();
                  }}
                  className={`px-4 py-1.5 rounded-[12px] shadow-lg text-[10px] font-bold uppercase tracking-wider transition-all ml-2 ${(isFollowing || reel.connection_status === 'pending')
                    ? 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
                    }`}
                >
                  {(isFollowing || reel.connection_status === 'pending') ? 'Following' : 'Follow'}
                </motion.button>
              )}
            </div>
            {nullString(reel.location_name) && (
              <p className="text-[9px] font-bold text-white/50  tracking-tighter flex items-center gap-1">
                <Sparkles className="w-2 h-2 text-primary" /> {nullString(reel.location_name)}
              </p>
            )}
          </div>
        </div>

        {/* Caption Layer with Read More */}
        {reel.caption && (
          <div className="max-w-[300px]">
            <p className={`text-white text-[13px] font-medium leading-relaxed font-body drop-shadow-lg ${!showFullCaption ? 'line-clamp-1' : ''}`}>
              {nullString(reel.caption)}
            </p>
            {reel.caption.length > 50 && !showFullCaption && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullCaption(true);
                }}
                className="text-white/60 text-[9px] font-black  tracking-widest mt-1 hover:text-white transition-colors"
              >
                + read full
              </button>
            )}
          </div>
        )}

        {/* Audio Layer - Directly below username/caption */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/5">
            <Volume2 className="w-3 h-3 text-white/70" />
            <div className="text-[10px] font-black  tracking-widest text-white/70 whitespace-nowrap overflow-hidden max-w-[140px]">
              Original Audio
            </div>
          </div>

          {reel.is_ai_generated && (
            <div className="px-3 py-1.5 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span className="text-[10px] text-primary font-black uppercase tracking-widest">AI Generated</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-30">
        <motion.div
          className="h-full bg-primary shadow-[0_0_10px_rgba(255,0,110,0.8)]"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'tween', ease: 'linear' }}
        />
      </div>

      {/* Minimal Mute/Unmute Notch: Top-Right focused to avoid HUD overlap */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute bottom-6 right-4 z-30 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white shadow-2xl hover:bg-black/60 transition-all border border-white/20 active:scale-90"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

    </div>
  );
};

export default ReelItem;
