import { useState, useRef, useEffect, type FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MapPin, MoreHorizontal, Trash2, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useSound } from '../../context/SoundContext';
import { nullString } from '../../utils/string';
import { CommentsModal, ReportModal } from '../ui';

interface PostCardProps {
  post: any;
  currentUserID?: string;
  onDelete?: (postId: string) => void;
  onImageClick?: (post: any) => void;
}

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  if (diff < 10080) return `${Math.floor(diff / 1440)}d`;
  return new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
};

import { getMediaUrl, FALLBACKS } from '../../utils/media';

const PostCard: FC<PostCardProps> = ({ post, currentUserID, onDelete, onImageClick }) => {
  const [liked, setLiked] = useState<boolean>(post.liked_by_viewer ?? false);
  const [likeCount, setLikeCount] = useState<number>(post.likes_count ?? 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count ?? 0);
  const [showMenu, setShowMenu] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const isTextOnly = post.media_type === 'text' || !post.media_url || post.media_url === 'text';
  const isOwner = currentUserID && post.user_id === currentUserID;
  const { isMuted, toggleMute } = useSound();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Normalize NullString objects from Go backend
  const bodyTextRaw = nullString(post.body_text);
  const caption = nullString(post.caption);
  const locationName = nullString(post.location_name);
  const avatarUrl = nullString(post.avatar_url);

  const hashtags = caption.match(/#[a-z0-9_]+/gi) || [];
  const cleanCaption = caption.replace(/#[a-z0-9_]+/gi, '').trim();

  // Smart text display logic
  const hasSeparateBody = !!bodyTextRaw;
  const bubbleText = hasSeparateBody ? bodyTextRaw : caption;
  const shouldShowCaption = cleanCaption && (!isTextOnly || hasSeparateBody);

  // Sync muted state with DOM element to bypass React reconciliation lag on media tags
  useEffect(() => {
     if (videoRef.current) {
        videoRef.current.muted = isMuted;
        if (!isMuted) {
           videoRef.current.play().catch(() => {});
        }
     }
  }, [isMuted]);

  const handleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c: number) => wasLiked ? c - 1 : c + 1);
    try {
      if (wasLiked) {
        await api.delete(`/posts/${post.id}/like`);
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
    } catch {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount((c: number) => wasLiked ? c + 1 : c - 1);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by @${post.username}`,
          text: cleanCaption,
          url: `${window.location.origin}/posts/${post.id}`,
        });
        await api.post(`/posts/${post.id}/share`);
      } else {
        await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
        alert('Link copied to clipboard!');
        await api.post(`/posts/${post.id}/share`);
      }
    } catch (err) {
      console.error('Share failed', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col bg-bg-card md:rounded-[32px] border-b md:border border-border-base/50 md:border-border-base shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4 md:pb-3">
        <div 
          className="flex items-center gap-3 cursor-pointer group/header"
          onClick={() => navigate(`/dashboard/user/${post.user_id}`)}
        >
          <div className="w-11 h-11 rounded-full p-[2px] bg-brand-gradient shadow-sm group-hover/header:scale-105 transition-transform duration-300">
            <div className="w-full h-full rounded-full bg-bg-card p-[2px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-bg-base flex items-center justify-center">
                <img
                  src={getMediaUrl(avatarUrl, FALLBACKS.AVATAR(post.username))}
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <h4 className="font-black text-text-base text-[14.5px] leading-none tracking-tight group-hover/header:text-primary transition-colors">
              {post.full_name || post.username}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 text-[11.5px] font-bold text-text-muted/60 uppercase tracking-wider">
              <span>@{post.username}</span>
              <span className="w-0.5 h-0.5 rounded-full bg-border-base" />
              <span>{timeAgo(post.created_at)}</span>
              {locationName && (
                <>
                  <span className="w-0.5 h-0.5 rounded-full bg-border-base" />
                  <div className="flex items-center gap-0.5 text-primary">
                    <MapPin className="w-2.5 h-2.5" />
                    <span className="max-w-[120px] truncate">{locationName}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-text-muted/40 hover:text-text-base transition-colors rounded-full hover:bg-bg-base cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-bg-card border border-border-base rounded-[20px] shadow-2xl z-20 py-2 min-w-[160px] overflow-hidden">
              {isOwner && (
                <button
                  onClick={() => { setShowMenu(false); handleDelete(); }}
                  className="flex items-center gap-2 w-full px-4 py-3 text-red-500 hover:bg-red-500/5 text-sm font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); handleShare(); }}
                className="flex items-center gap-2 w-full px-4 py-3 text-text-base hover:bg-bg-base text-sm font-bold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => { setShowMenu(false); setIsReportOpen(true); }}
                className="flex items-center gap-2 w-full px-4 py-3 text-accent hover:bg-accent/5 text-sm font-bold transition-colors cursor-pointer border-t border-border-base/10"
              >
                <MoreHorizontal className="w-4 h-4" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Text Post Bubble */}
      {isTextOnly && bubbleText && (
        <div className="mx-4 sm:mx-6 mb-5 p-10 sm:p-14 rounded-[32px] bg-brand-gradient/5 border border-primary/10 flex items-center justify-center text-center">
          <p className="text-text-base font-black text-xl sm:text-2xl leading-snug tracking-tight italic whitespace-pre-wrap">{bubbleText}</p>
        </div>
      )}

      {/* Media */}
      {!isTextOnly && post.media_url && (
        <div
          className="w-full sm:px-1 mb-5 md:mb-3 md:aspect-[4/5] lg:md:aspect-video md:rounded-[32px] overflow-hidden bg-bg-base cursor-pointer relative group/media transition-colors duration-300"
          onClick={() => onImageClick?.(post)}
        >
          {post.media_type === 'video' ? (
            <>
              <video
                ref={videoRef}
                src={getMediaUrl(post.media_url)}
                className="w-full h-auto md:h-full max-h-[85vh] md:max-h-full object-contain md:object-cover sm:rounded-[24px] transition-transform duration-500"
                style={post.crop_settings ? {
                  transform: `scale(${post.crop_settings.zoom}) translate(${post.crop_settings.position.x/10}px, ${post.crop_settings.position.y/10}px)`,
                  aspectRatio: post.crop_settings.ratio === 'original' ? 'auto' : post.crop_settings.ratio
                } : {}}
                muted={isMuted}
                loop
                autoPlay
                playsInline
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 p-2.5 bg-black/60 backdrop-blur-xl rounded-full text-white transition-all duration-300 hover:scale-110 active:scale-95"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <img
              src={getMediaUrl(post.media_url, FALLBACKS.POST)}
              alt=""
              className="w-full h-auto md:h-full max-h-[85vh] md:max-h-full object-contain md:object-cover sm:rounded-[24px] transition-transform duration-500"
              style={post.crop_settings ? {
                transform: `scale(${post.crop_settings.zoom}) translate(${post.crop_settings.position.x/10}px, ${post.crop_settings.position.y/10}px)`,
                aspectRatio: post.crop_settings.ratio === 'original' ? 'auto' : post.crop_settings.ratio
              } : {}}
            />
          )}
        </div>
      )}

      {/* Caption & Stats */}
      <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 pr-3 py-2 rounded-2xl transition-all cursor-pointer group ${
                liked ? 'text-primary' : 'text-text-muted hover:text-primary'
              }`}
            >
              <Heart className={`w-6 h-6 transition-transform group-hover:scale-125 group-active:scale-90 ${liked ? 'fill-primary' : ''}`} />
              <span className="text-[14px] font-black">{likeCount}</span>
            </button>

            <button
              onClick={() => setIsCommentsOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl text-text-muted hover:text-text-base transition-all group cursor-pointer"
            >
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-125" />
              <span className="text-[14px] font-black">{commentsCount}</span>
            </button>

            <button
              onClick={handleShare}
              className="px-3 py-2 rounded-2xl text-text-muted hover:text-text-base transition-all group cursor-pointer"
            >
              <Send className="w-6 h-6 transition-transform group-hover:rotate-12 group-hover:-translate-y-1" />
            </button>
          </div>

          <button className="p-2 rounded-2xl text-text-muted hover:text-primary transition-all group cursor-pointer">
            <Bookmark className="w-6 h-6 transition-transform group-hover:scale-125" />
          </button>
        </div>

        {shouldShowCaption && (
          <p className="text-text-base/90 font-medium text-[14.5px] leading-relaxed tracking-tight select-text">
            <span 
              className="font-black mr-2 text-text-base cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate(`/dashboard/user/${post.user_id}`)}
            >
              {post.username}
            </span>
            <span className="whitespace-pre-wrap">{cleanCaption}</span>
          </p>
        )}

        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {hashtags.map((tag: string, i: number) => (
              <span key={i} className="text-primary font-black text-[11px] uppercase tracking-wider bg-primary/5 px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <CommentsModal 
        isOpen={isCommentsOpen} 
        onClose={() => setIsCommentsOpen(false)} 
        targetId={post.id} 
        targetType="post" 
        onCommentSuccess={() => setCommentsCount(prev => prev + 1)}
      />
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        targetId={post.id} 
        targetType="post" 
      />
    </motion.div>
  );
};

export default PostCard;
