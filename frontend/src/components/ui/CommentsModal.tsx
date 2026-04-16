import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import api from '../../services/api';
import { BACKEND } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

interface Comment {
  id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'post' | 'reel';
  onCommentSuccess?: () => void;
  variant?: 'modal' | 'sidebar';
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  onCommentSuccess,
  variant = 'modal'
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState({});

  const isSidebar = variant === 'sidebar';

  // Force re-render every minute to update timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate({});
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, targetId]);

  const fetchComments = async () => {
    try {
      const endpoint = targetType === 'post' ? `/posts/${targetId}/comments` : `/reels/${targetId}/comments`;
      const response = await api.get(endpoint);
      setComments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const endpoint = targetType === 'post' ? `/posts/${targetId}/comments` : `/reels/${targetId}/comments`;
      const response = await api.post(endpoint, { content: newComment });
      
      // Add new comment to local state
      const commentWithUser = {
          ...response.data,
          username: user?.username || 'You',
          avatar_url: user?.avatar_url
      };
      
      setComments(prev => [commentWithUser, ...prev]);
      setNewComment('');
      onCommentSuccess?.();
      
      // Auto-scroll to top
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
          )}
          <motion.div
            initial={isSidebar ? { x: '100%', opacity: 0 } : { y: '100%' }}
            animate={isSidebar ? { x: 0, opacity: 1 } : { y: 0 }}
            exit={isSidebar ? { x: '100%', opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              ${isSidebar 
                ? 'relative h-full w-[380px] bg-bg-card border-l border-border-base flex flex-col overflow-hidden z-[50]' 
                : 'fixed bottom-0 left-0 right-0 md:bottom-10 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-lg h-[85vh] md:h-[600px] bg-bg-card border-t md:border border-border-base rounded-t-[32px] md:rounded-[32px] shadow-2xl z-[101] flex flex-col overflow-hidden'
              }
            `}
          >
            {/* Grab Handle for Mobile */}
            <div className="md:hidden w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-border-base/50 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-base/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-black text-text-base tracking-tight">Comments</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-bg-sidebar rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Comments List */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <MessageCircle className="w-12 h-12 mb-2" />
                  <p className="text-sm font-bold">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center">
                      {comment.avatar_url ? (
                        <img src={`${BACKEND}${comment.avatar_url}`} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-primary font-black text-xs">{comment.username[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-xs text-text-base">@{comment.username}</span>
                        <span className="text-[10px] text-text-muted">{formatRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-text-base/90 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-bg-card border-t border-border-base/50 pb-safe">
              <form onSubmit={handleSubmit} className="relative flex items-center gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-bg-sidebar/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || loading}
                  className="p-3.5 bg-brand-gradient text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
