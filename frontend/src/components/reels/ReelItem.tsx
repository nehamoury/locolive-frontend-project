import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Volume2, VolumeX, Sparkles } from 'lucide-react';
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
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(reel.is_liked);
  const [saved, setSaved] = useState(reel.is_saved);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [muted, setMuted] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isFollowing, setIsFollowing] = useState(reel.connection_status === 'pending');
  const [progress, setProgress] = useState(0);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    
    const video = videoRef.current;
    const updateProgress = () => {
      setProgress((video.currentTime / video.duration) * 100);
    };
    
    video.addEventListener('timeupdate', updateProgress);
    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => { });
      bgVideoRef.current?.play().catch(() => { });
    } else {
      videoRef.current?.pause();
      bgVideoRef.current?.pause();
      if (videoRef.current) videoRef.current.currentTime = 0;
      if (bgVideoRef.current) bgVideoRef.current.currentTime = 0;
    }
  }, [isActive]);

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
    <div className="relative w-full h-full bg-black snap-start snap-always overflow-hidden flex items-center justify-center flex-shrink-0">
      {/* Cinematic Blurred Background Wrapper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <video
          ref={bgVideoRef}
          src={getMediaUrl(reel.video_url)}
          className="w-full h-full object-cover blur-2xl scale-110 opacity-40 brightness-75"
          muted
          playsInline
          autoPlay
          loop
        />
      </div>

      {/* Primary High-Fidelity Video Foreground */}
      <video
        ref={videoRef}
        src={getMediaUrl(reel.video_url)}
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
        loop
        muted={muted}
        playsInline
        onClick={() => setMuted(!muted)}
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

      {/* Right Side Actions: High-Impact Vertical Stack */}
      <div className="absolute right-4 bottom-28 flex flex-col items-center gap-4 z-20">
        <div className="flex flex-col items-center gap-4">
            {/* Like */}
            <div className="flex flex-col items-center gap-1.5">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                aria-label={liked ? "Unlike" : "Like"}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${liked ? 'bg-primary/20' : 'bg-white/5'}`}
            >
                <Heart 
                strokeWidth={2.8} 
                className={`w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${liked ? 'fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,0,110,0.5)]' : 'text-white'}`} 
                />
            </motion.button>
            <span className="text-[12px] font-black text-white uppercase tracking-tighter drop-shadow-md">{likesCount}</span>
            </div>

            {/* Comment */}
            <div className="flex flex-col items-center gap-1.5">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleComments}
                aria-label="View comments"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-white transition-all"
            >
                <MessageCircle strokeWidth={2.8} className="w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </motion.button>
            <span className="text-[12px] font-black text-white uppercase tracking-tighter drop-shadow-md">{reel.comments_count}</span>
            </div>

            {/* Share */}
            <div className="flex flex-col items-center gap-1.5">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                aria-label="Share reel"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-white transition-all"
            >
                <Share2 strokeWidth={2.8} className="w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
            </motion.button>
            </div>

            {/* Save */}
            <div className="flex flex-col items-center gap-1.5">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSave}
                aria-label={saved ? "Unsave" : "Save"}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${saved ? 'bg-yellow-500/20' : 'bg-white/5'}`}
            >
                <Bookmark 
                strokeWidth={2.8} 
                className={`w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${saved ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} 
                />
            </motion.button>
            </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMore}
          aria-label="More options"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5"
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

      {/* Bottom Information: Compace & Low-profile */}
      <div className="absolute bottom-8 left-4 right-16 z-20 flex flex-col gap-3 py-4">
        
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
            <div className="flex items-center gap-2">
                <h4 className="text-white font-black text-sm uppercase tracking-widest font-brand drop-shadow-md">@{reel.username}</h4>
                {reel.connection_status !== 'accepted' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleFollow();
                    }}
                    className={`px-3 py-1 rounded-full backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all ml-2 ${
                        (isFollowing || reel.connection_status === 'pending')
                        ? 'bg-white/30 text-white shadow-lg' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {(isFollowing || reel.connection_status === 'pending') ? 'Following' : 'Follow'}
                  </motion.button>
                )}
            </div>
            {reel.location_name && (
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-primary" /> {reel.location_name}
                </p>
            )}
          </div>
        </div>

        {/* Caption Layer with Read More */}
        {reel.caption && (
          <div className="max-w-[320px]">
            <p className={`text-white text-[14px] font-medium leading-[1.6] font-body drop-shadow-lg ${!showFullCaption ? 'line-clamp-2' : ''}`}>
              {reel.caption}
            </p>
            {reel.caption.length > 60 && !showFullCaption && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullCaption(true);
                }}
                className="text-primary text-[10px] font-black uppercase tracking-widest mt-2 hover:text-primary/80 transition-colors"
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

      {/* Mute Overlay Toggle */}
      <button 
        onClick={() => setMuted(!muted)}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full h-1/2"
      />

      {/* Minimal Mute/Unmute Notch: Top-Right focused to avoid HUD overlap */}
      <button 
        onClick={() => setMuted(!muted)}
        className="absolute bottom-10 right-4 z-20 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/10"
      >
        {muted ? <VolumeX className="w-4 h-4 ml-[1px]" /> : <Volume2 className="w-4 h-4" />}
      </button>

    </div>
  );
};

export default ReelItem;
