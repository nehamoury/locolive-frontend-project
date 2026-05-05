import { useState, useRef, useEffect, type FC } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MapPin, MoreHorizontal, Trash2, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import { useSound } from '../../context/SoundContext';
import { nullString } from '../../utils/string';
import { CommentsModal, ReportModal } from '../ui';
import ShareModal from '../share/ShareModal';

interface PostCardProps {
  post: any;
  currentUserID?: string;
  onDelete?: (postId: string) => void;
  onImageClick?: (post: any) => void;
  isFeed?: boolean;
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
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState<boolean>(post.liked_by_viewer ?? false);
  const [likeCount, setLikeCount] = useState<number>(post.likes_count ?? 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments_count ?? 0);
  const [saved, setSaved] = useState<boolean>(post.is_saved ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isTextOnly = post.media_type === 'text' || (!(post.media_url || post.video_url)) || post.media_url === 'text';
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
  const hasBody = !!bodyTextRaw.trim();
  const hasCaption = !!cleanCaption.trim();

  // Use bodyText if available, otherwise use cleanCaption (which has no hashtags)
  const mainDisplayContent = hasBody ? bodyTextRaw : cleanCaption;

  // Secondary caption only if it's different from the main display content
  const secondaryCaption = (hasBody && hasCaption) ? cleanCaption : '';
  const shouldShowSecondary = !!secondaryCaption;

  // Intersection Observer for performance
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (videoRef.current) {
            if (entry.isIntersecting) {
              if (!videoRef.current.src) {
                videoRef.current.src = getMediaUrl(post.media_url || post.video_url);
              }
              if (!isMuted) videoRef.current.play().catch(() => {});
            } else {
              videoRef.current.pause();
              videoRef.current.removeAttribute('src'); // Unload to free memory
              videoRef.current.load();
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [post.media_url, post.video_url, isMuted]);

  // Sync muted state with DOM element to bypass React reconciliation lag on media tags
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted && videoRef.current.src) {
        videoRef.current.play().catch(() => { });
      }
    }
  }, [isMuted]);

  const isLiking = useRef(false);
  const handleLike = async () => {
    if (isLiking.current) return;
    isLiking.current = true;

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c: number) => wasLiked ? c - 1 : c + 1);
    
    // Premium Haptic Feedback
    if (!wasLiked && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
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
    } finally {
      isLiking.current = false;
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

  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  const handleSave = async () => {
    const wasSaved = saved;
    setSaved(!wasSaved);
    
    // Premium Haptic Feedback
    if (!wasSaved && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }

    try {
      if (wasSaved) {
        await api.delete(`/posts/${post.id}/save`);
      } else {
        await api.post(`/posts/${post.id}/save`);
      }
      if (!wasSaved) {
        queryClient.invalidateQueries({ queryKey: ['users', 'profile', 'me'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['users', 'profile', 'me'] });
      }
    } catch (err) {
      // Revert on failure
      setSaved(wasSaved);
      console.error('Failed to save/unsave post:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col bg-bg-card md:rounded-[16px] border-b md:border border-border-base/40 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-4"
    >
      {/* Header - Horizontal Alignment */}
      <div className="flex items-start justify-between px-4 sm:px-5 pt-4 pb-2">
        <div
          className="flex gap-3 cursor-pointer group/header"
          onClick={() => navigate(`/dashboard/user/${post.user_id}`)}
        >
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full overflow-hidden bg-bg-base ring-1 ring-border-base/50 group-hover/header:ring-primary/50 transition-all duration-300 shrink-0">
            <img
              src={getMediaUrl(avatarUrl, FALLBACKS.AVATAR(post.username))}
              className="w-full h-full object-cover"
              alt={post.username}
            />
          </div>

          {/* Name & Username Row */}
          <div className="flex flex-col pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-text-base text-[15.5px] leading-tight hover:underline">
                {post.username}
              </h4>
              {/* Verified Badge Placeholder (can be conditional) */}
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-primary fill-current">
                <path d="M22.5 12.5c0-1.58-.8-2.47-1.24-3.23-.44-.76-.76-1.31-.76-2.27 0-1.51-1.22-2.73-2.73-2.73-.96 0-1.51-.32-2.27-.76C14.74 3.07 13.85 2.27 12.27 2.27c-1.58 0-2.47.8-3.23 1.24-.76.44-1.31.76-2.27.76-1.51 0-2.73 1.22-2.73 2.73 0 .96-.32 1.51-.76 2.27C3.07 10.03 2.27 10.92 2.27 12.5c0 1.58.8 2.47 1.24 3.23.44.76.76 1.31.76 2.27 0 1.51 1.22 2.73 2.73 2.73.96 0 1.51.32 2.27.76.76.44 1.65 1.24 3.23 1.24 1.58 0 2.47-.8 3.23-1.24.76-.44 1.31-.76 2.27-.76 1.51 0 2.73-1.22 2.73-2.73 0-.96.32-1.51.76-2.27.44-.76 1.24-1.65 1.24-3.23zM10.42 16.4L7.1 13.08l1.41-1.41 1.91 1.91 5.34-5.34 1.41 1.41-6.75 6.75z" />
              </svg>
              <span className="text-[14px] text-text-muted">·</span>
              <span className="text-[14px] text-text-muted">{timeAgo(post.created_at)}</span>
            </div>
            {locationName && (
              <div className="flex items-center gap-1 text-[12px] text-primary font-medium mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{locationName}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-text-muted/50 hover:text-primary hover:bg-primary/5 transition-all rounded-full cursor-pointer relative"
        >
          <MoreHorizontal className="w-6 h-6" />
          {showMenu && (
            <div className="absolute right-0 top-10 bg-bg-card border border-border-base rounded-[12px] shadow-xl z-50 py-1 min-w-[180px] overflow-hidden">
              {isOwner && (
                <button
                  onClick={() => { setShowMenu(false); handleDelete(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-red-500 hover:bg-red-500/5 text-[14px] font-bold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              )}
              <button
                onClick={() => { setShowMenu(false); handleShare(); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-text-base hover:bg-bg-base text-[14px] font-bold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Share Post
              </button>
              <button
                onClick={() => { setShowMenu(false); setIsReportOpen(true); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-text-muted hover:bg-accent/5 text-[14px] font-bold transition-colors cursor-pointer border-t border-border-base/10"
              >
                <MoreHorizontal className="w-4 h-4" />
                Report Post
              </button>
            </div>
          )}
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 sm:px-5 pb-3 " >
        {/* Primary Text Content */}
        {mainDisplayContent && (
          <div className="mb-2">
            <p className={`text-text-base leading-relaxed tracking-tight whitespace-pre-wrap select-text ${isTextOnly ? 'text-[18px] font-normal' : 'text-[17px] font-medium'}`}>
              {mainDisplayContent}
            </p>
          </div>
        )}

        {/* Secondary Caption (if exists) */}
        {shouldShowSecondary && (
          <div className="mb-2">
            <p className="text-text-base/80 text-[14px] leading-relaxed whitespace-pre-wrap">
              {secondaryCaption}
            </p>
          </div>
        )}

        {/* Hashtags Row */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 mb-3">
            {hashtags.map((tag: string, i: number) => (
              <span key={i} className="text-primary hover:underline cursor-pointer font-medium text-[14px]">{tag}</span>
            ))}
          </div>
        )}

        {/* Media Block */}
        {!isTextOnly && (post.media_url || post.video_url) && (
          <div
            className="w-full rounded-[16px] overflow-hidden bg-bg-base border border-border-base/50 cursor-pointer relative group/media aspect-auto max-h-[70vh]"
            onClick={() => onImageClick?.(post)}
          >
            {(post.media_type === 'video' || post.video_url) ? (
              <div className="relative h-full w-full">
                <video
                  ref={videoRef}
                  src={getMediaUrl(post.media_url || post.video_url)}
                  className="w-full h-auto object-contain"
                  muted={isMuted}
                  loop
                  autoPlay
                  playsInline
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                  className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-all"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <img
                src={getMediaUrl(post.media_url, FALLBACKS.POST)}
                alt=""
                className="w-full h-auto object-contain"
              />
            )}
          </div>
        )}
      </div>

      {/* Footer - Optimized Actions */}
      <div className="px-4 sm:px-5 py-3 border-t border-border-base/30 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 group cursor-pointer transition-colors ${liked ? 'text-red-500' : 'text-text-muted hover:text-red-500'}`}
          >
            <div className="p-2 rounded-full transition-colors">
              <Heart className={`w-6 h-6 sm:w-5 sm:h-5 ${liked ? 'fill-red-500 stroke-red-500' : 'stroke-current'}`} />
            </div>
            <span className="text-[14px] font-bold">{likeCount > 0 ? likeCount : ''}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setIsCommentsOpen(true)}
            className="flex items-center gap-2 group cursor-pointer text-text-muted hover:text-primary transition-colors"
          >
            <div className="p-2 rounded-full transition-colors">
              <MessageCircle className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[14px] font-bold">{commentsCount > 0 ? commentsCount : ''}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 group cursor-pointer text-text-muted hover:text-primary transition-colors"
          >
            <div className="p-2 rounded-full transition-colors">
              <Send className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
          </button>
        </div>

        {/* Save (Bookmark) */}
        <button 
          onClick={handleSave}
          className={`p-2 rounded-full transition-all cursor-pointer ${saved ? 'text-primary' : 'text-text-muted hover:text-primary'}`}
        >
          <Bookmark className={`w-6 h-6 sm:w-5 sm:h-5 ${saved ? 'fill-current' : 'stroke-current'}`} />
        </button>
      </div>

      {/* Modals */}
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
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={`${window.location.origin}/posts/${post.id}`}
        title={`post by @${post.username}`}
        contentId={post.id}
        contentType="post"
      />
    </motion.div>
  );
};

export default PostCard;
