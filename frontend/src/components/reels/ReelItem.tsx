import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Volume2, VolumeX, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { BACKEND } from '../../utils/config';

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
}

interface ReelItemProps {
  reel: Reel;
  isActive: boolean;
  onToggleComments: () => void;
}

const ReelItem = ({ reel, isActive, onToggleComments }: ReelItemProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(reel.is_liked);
  const [saved, setSaved] = useState(reel.is_saved);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [muted, setMuted] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

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
    // Simple placeholder for more options (e.g. Report)
    const action = window.confirm('Would you like to report this reel?');
    if (action) {
      // Future logic for ReportModal could go here
      window.alert('Thank you for your report. Our team will review it.');
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/connections/${reel.user_id}`);
        setIsFollowing(false);
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
          src={`${BACKEND}${reel.video_url}`}
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
        src={`${BACKEND}${reel.video_url}`}
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
      <div className="absolute right-3.5 bottom-20 flex flex-col items-center gap-7 z-20">

        {/* Like */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            aria-label={liked ? "Unlike" : "Like"}
            className="flex items-center justify-center transition-all duration-300"
          >
            <Heart 
              strokeWidth={2.8} 
              className={`w-7 h-7 ${liked ? 'fill-primary text-primary drop-shadow-[0_0_8px_rgba(255,0,110,0.5)]' : 'text-white'}`} 
            />
          </motion.button>
          <span className="text-[11px] font-bold text-white drop-shadow-lg">{likesCount}</span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleComments}
            aria-label="View comments"
            className="flex items-center justify-center text-white transition-all"
          >
            <MessageCircle strokeWidth={2.8} className="w-7 h-7" />
          </motion.button>
          <span className="text-[11px] font-bold text-white drop-shadow-lg">{reel.comments_count}</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            aria-label="Share reel"
            className="flex items-center justify-center text-white transition-all"
          >
            <Share2 strokeWidth={2.8} className="w-7 h-7" />
          </motion.button>
          <span className="text-[11px] font-bold text-white drop-shadow-lg">{reel.shares_count || 0}</span>
        </div>

        {/* Save */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSave}
            aria-label={saved ? "Unsave" : "Save"}
            className="flex items-center justify-center transition-all duration-300"
          >
            <Bookmark 
              strokeWidth={2.8} 
              className={`w-7 h-7 ${saved ? 'fill-yellow-500 text-yellow-500' : 'text-white'}`} 
            />
          </motion.button>
          <span className="text-[11px] font-bold text-white drop-shadow-lg">{reel.saves_count || 0}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleMore}
          aria-label="More options"
          className="flex items-center justify-center text-white/50 hover:text-white transition-all pt-1"
        >
          <MoreVertical strokeWidth={2} className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Bottom Information: Compace & Low-profile */}
      <div className="absolute bottom-10 left-4 right-16 z-20 flex flex-col gap-2.5">
        
        {/* Identity & Follow Layer */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
          <div className="relative">
            <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <div className="w-full h-full rounded-full border border-black overflow-hidden bg-gray-900">
                {reel.avatar_url ? (
                  <img src={`${BACKEND}${reel.avatar_url}`} alt={reel.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-sm bg-gray-800">
                    {reel.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <h4 className="text-white font-bold text-sm tracking-tight drop-shadow-md">@{reel.username}</h4>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleFollow();
              }}
              className="text-[12px] font-bold text-white hover:text-white/80 transition-all drop-shadow-md"
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </motion.button>
          </div>
        </div>

        {/* Caption Layer with Read More */}
        {reel.caption && (
          <div className="max-w-[280px]">
            <p className={`text-white text-[13px] font-medium leading-normal drop-shadow-md ${!showFullCaption ? 'line-clamp-2' : ''}`}>
              {reel.caption}
            </p>
            {reel.caption.length > 60 && !showFullCaption && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullCaption(true);
                }}
                className="text-white/60 text-[12px] font-bold mt-0.5 hover:text-white transition-colors"
              >
                ... more
              </button>
            )}
            {showFullCaption && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFullCaption(false);
                }}
                className="text-white/60 text-[12px] font-bold mt-0.5 hover:text-white transition-colors"
              >
                less
              </button>
            )}
          </div>
        )}

        {/* Audio Layer - Directly below username/caption */}
        <div className="flex items-center gap-1.5 text-white/90 drop-shadow-md">
          <div className="w-3.5 h-3.5 flex items-center justify-center">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-[11px] font-medium tracking-wide animate-marquee whitespace-nowrap overflow-hidden max-w-[180px]">
            Original Audio • {reel.username}
          </div>
          
          {reel.is_ai_generated && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-white/10 backdrop-blur-md rounded-[4px] border border-white/10"
            >
              <Sparkles className="w-2.5 h-2.5 text-primary" />
              <span className="text-[7px] text-white font-bold uppercase tracking-wider">AI</span>
            </motion.div>
          )}
        </div>
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
