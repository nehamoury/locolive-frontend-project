import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, MapPin, User, ChevronRight } from 'lucide-react';
import ActionBar from './ActionBar';
import { BACKEND } from '../../utils/config';

interface ReelData {
  id: string;
  username: string;
  avatar_url?: string;
  video_url: string;
  caption?: string;
  location_name?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

interface VideoCardProps {
  reel: ReelData;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
  layout?: 'mobile' | 'desktop';
}

const VideoCard: React.FC<VideoCardProps> = ({
  reel,
  onLike,
  onComment,
  onShare,
  onSave,
  layout = 'mobile'
}) => {
  const isMobile = layout === 'mobile';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptionFull, setShowCaptionFull] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(reel.video_url);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isImage) videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        } else {
          if (!isImage) videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isImage]);

  const togglePlay = () => {
    if (isImage) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`relative w-full h-full snap-start snap-always bg-bg-base flex items-center justify-center overflow-hidden ${!isMobile ? 'py-4' : ''}`}
    >
      {/* Background Cinematic Glow (Desktop Only) */}
      {!isMobile && (
        <div className="absolute inset-0 -z-10 bg-bg-base overflow-hidden">
          {isImage ? (
            <img 
              src={`${BACKEND}${reel.video_url}`}
              className="w-full h-full object-cover blur-[100px] opacity-10"
              alt=""
            />
          ) : (
            <video
              src={`${BACKEND}${reel.video_url}`}
              className="w-full h-full object-cover blur-[100px] opacity-10"
              muted
              playsInline
              autoPlay
              loop
            />
          )}
        </div>
      )}

      {/* Main Container (9:16 aspect ratio) */}
      <div className={`
        relative w-full h-full bg-black overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.3)] transition-all duration-700
        ${isMobile ? '' : 'aspect-[9/16] h-[92vh] max-w-[420px] rounded-[3.5rem] border border-white/10 ring-1 ring-white/5 mx-auto'}
      `}>
        
        {/* Media Rendering */}
        {isImage ? (
          <motion.div
            animate={{ 
              scale: isPlaying ? 1.08 : 1.02,
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="w-full h-full"
          >
            <img
              src={`${BACKEND}${reel.video_url}`}
              className="w-full h-full object-cover"
              alt={reel.caption}
            />
          </motion.div>
        ) : (
          <video
            ref={videoRef}
            src={`${BACKEND}${reel.video_url}`}
            className="w-full h-full object-cover cursor-pointer"
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
          />
        )}

        {/* Play/Pause Overlay Icon (Mobile Only) */}
        {isMobile && !isImage && (
          <AnimatePresence>
            {!isPlaying && (
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-2" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Action Bar (Mobile Only) */}
        {isMobile && (
          <div className="absolute right-3 bottom-32 z-20">
            <ActionBar
              likes={reel.likes_count}
              comments={reel.comments_count}
              shares={reel.shares_count}
              isLiked={reel.is_liked}
              isSaved={reel.is_saved}
              onLike={() => onLike(reel.id)}
              onComment={() => onComment(reel.id)}
              onShare={() => onShare(reel.id)}
              onSave={() => onSave(reel.id)}
            />
          </div>
        )}

        {/* Metadata Overlay (Mobile Only) */}
        {isMobile && (
          <div className="absolute left-0 bottom-0 w-full p-6 pt-24 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
            <div className="flex flex-col gap-4 pointer-events-auto max-w-[85%]">
              {/* User Info */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full border border-primary/30 bg-white/10 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black/20 flex items-center justify-center">
                    {reel.avatar_url ? (
                      <img src={`${BACKEND}${reel.avatar_url}`} alt={reel.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-white w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm shadow-sm tracking-tight leading-none">@{reel.username}</span>
                  {reel.location_name && (
                    <div className="flex items-center gap-1 text-white/70 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                      <MapPin className="w-2 h-2 text-primary" />
                      <span>{reel.location_name}</span>
                    </div>
                  )}
                </div>
                <button className="ml-2 px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-widest text-white transition-all">
                  Follow
                </button>
              </div>

              {/* Caption */}
              {reel.caption && (
                <div className="space-y-1.5">
                  <p className={`text-white text-[14px] font-medium leading-relaxed drop-shadow-md ${!showCaptionFull ? 'line-clamp-2' : ''}`}>
                    {reel.caption}
                  </p>
                  {reel.caption.length > 60 && (
                    <button 
                      onClick={() => setShowCaptionFull(!showCaptionFull)}
                      className="text-white/60 text-[11px] font-black uppercase tracking-widest hover:text-white transition-colors"
                    >
                      {showCaptionFull ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
              )}

              {/* Audio Info */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 shadow-lg group hover:bg-white/20 transition-all cursor-pointer">
                  <Music className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/90 whitespace-nowrap overflow-hidden max-w-[150px]">
                    Original audio • {reel.username}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Volume Notch (Mobile only, non-image) */}
        {isMobile && !isImage && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute right-5 top-16 z-20 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition-all"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77zM3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
