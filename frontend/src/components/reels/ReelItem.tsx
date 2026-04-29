import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import ReelOptionsBottomSheet from './ReelOptionsBottomSheet';

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

    if (isActive) {
      video.muted = isMuted;
      video.currentTime = 0;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Auto-play was prevented:", error);
        });
      }
    } else {
      video.pause();
      video.currentTime = 0;
    }

    return () => {
      video.pause();
    };
  }, [isActive, isMuted]);

  const handleLike = async () => {
    try {
      if (liked) {
        await api.delete(`/reels/${reel.id}/like`);
        setLikesCount(prev => prev - 1);
      } else {
        await api.post(`/reels/${reel.id}/like`);
        setLikesCount(prev => prev + 1);
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
      }
      setLiked(!liked);
    } catch (err) {
      console.error('Like failed:', err);
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
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      await api.post(`/reels/${reel.id}/share`);
      if (navigator.share) {
        await navigator.share({
          title: `LocoLive Reel by @${reel.username}`,
          text: reel.caption || 'Check out this reel on LocoLive!',
          url: `${window.location.origin}/reels/${reel.id}`
        });
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/reels/${reel.id}`);
        // Simple visual feedback could be added here if needed
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const handleMore = () => {
    setIsOptionsOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/reels/${reel.id}`);
      window.alert('Reel deleted successfully.');
      // Refresh or navigate back
      window.location.reload(); 
    } catch (err) {
      console.error('Delete failed:', err);
      window.alert('Failed to delete reel.');
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

  return (
    <div className="relative w-full h-[100dvh] md:h-full bg-black snap-start snap-always overflow-hidden flex items-center justify-center flex-shrink-0">
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
        src={getMediaUrl(reel.video_url)}
        className="relative z-10 w-full h-full object-cover md:object-contain drop-shadow-2xl"
        loop
        muted={isMuted}
        playsInline
        onClick={toggleMute}
      />

      {/* Double Tap Heart Animation */}
      <AnimatePresence>
        {showHeartAnim && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -15 }}
            animate={{ scale: 1.8, opacity: 1, rotate: 0 }}
            exit={{ scale: 2.2, opacity: 0 }}
            className="absolute z-50 pointer-events-none"
          >
            <Heart className="w-28 h-28 text-white fill-white drop-shadow-[0_0_30px_rgba(255,0,110,0.8)]" />
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
                className="flex items-center justify-center w-10 h-10 transition-all duration-300"
            >
                <Heart 
                strokeWidth={2.4} 
                className={`w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${liked ? 'fill-primary text-primary' : 'text-white'}`} 
                />
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
                <MessageCircle strokeWidth={2.4} className="w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
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
                <Share2 strokeWidth={2.5} className="w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </motion.button>
            <span className="text-[11px] font-bold text-white drop-shadow-md">{reel.shares_count || 0}</span>
            </div>

            {/* Save */}
            <div className="flex flex-col items-center gap-0.5">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                aria-label={saved ? "Unsave" : "Save"}
                className="flex items-center justify-center w-10 h-10 transition-all duration-300"
            >
                <Bookmark 
                strokeWidth={2.5} 
                className={`w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${saved ? 'fill-white text-white' : 'text-white'}`} 
                />
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
          if (window.confirm('Are you sure you want to delete this reel?')) {
            handleDelete();
            setIsOptionsOpen(false);
          }
        }}
        username={reel.username}
      />

      {/* Bottom Information: Ultra-compact & at the very edge */}
      <div className="absolute bottom-5 left-4 right-16 z-20 flex flex-col gap-1.5 py-1">
        
        {/* Identity & Follow Layer */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={handleProfileClick}>
          <div className="relative">
            <div className="w-11 h-11 rounded-[16px] p-0.5 bg-gradient-to-tr from-primary via-accent to-secondary shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-[14px] border border-black overflow-hidden bg-gray-900">
                <img 
                  src={getMediaUrl(reel.avatar_url, FALLBACKS.AVATAR(reel.username))} 
                  alt={reel.username} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
                <h4 className="text-white font-black text-[13px] uppercase tracking-wider font-brand drop-shadow-md">@{reel.username}</h4>
                {reel.connection_status !== 'accepted' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleFollow();
                    }}
                    className={`px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest transition-all ml-1 ${
                        (isFollowing || reel.connection_status === 'pending')
                        ? 'bg-white/30 text-white' 
                        : 'bg-primary/80 text-white hover:bg-primary'
                    }`}
                  >
                    {(isFollowing || reel.connection_status === 'pending') ? 'Following' : 'Follow'}
                  </motion.button>
                )}
            </div>
            {reel.location_name && (
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-tighter flex items-center gap-1">
                    <Sparkles className="w-2 h-2 text-primary" /> {reel.location_name}
                </p>
            )}
          </div>
        </div>

        {/* Caption Layer with Read More */}
        {reel.caption && (
          <div className="max-w-[300px]">
            <p className={`text-white text-[13px] font-medium leading-relaxed font-body drop-shadow-lg ${!showFullCaption ? 'line-clamp-1' : ''}`}>
              {reel.caption}
            </p>
            {reel.caption.length > 50 && !showFullCaption && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullCaption(true);
                }}
                className="text-white/60 text-[9px] font-black uppercase tracking-widest mt-1 hover:text-white transition-colors"
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
                <div className="text-[10px] font-black uppercase tracking-widest text-white/70 whitespace-nowrap overflow-hidden max-w-[140px]">
                    {reel.username} • Original
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
