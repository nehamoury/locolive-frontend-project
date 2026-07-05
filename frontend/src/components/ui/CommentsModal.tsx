import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle, Search } from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { useAuth } from '../../context/AuthContext';

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

interface MentionedUser {
  user_id: string;
  username: string;
}

interface Comment {
  id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
  mentions?: MentionedUser[];
}

interface UserSearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'post' | 'reel';
  onCommentSuccess?: () => void;
  variant?: 'modal' | 'sidebar';
}

const renderContentWithMentions = (
  content: string,
  mentions: MentionedUser[] = [],
  onMentionClick: (username: string) => void
): React.ReactNode => {
  const mentionSet = new Set(mentions.map(m => m.username.toLowerCase()));
  const parts = content.split(/(@[a-zA-Z0-9_.]+)/g);
  
  return parts.map((part, index) => {
    const mentionMatch = part.match(/^@([a-zA-Z0-9_.]+)$/);
    if (mentionMatch) {
      const username = mentionMatch[1];
      const isValidMention = mentionSet.has(username.toLowerCase());
      return (
        <span
          key={index}
          onClick={() => isValidMention && onMentionClick(username)}
          className={isValidMention 
            ? "text-primary font-bold cursor-pointer hover:underline" 
            : "text-text-muted"
          }
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionResults, setMentionResults] = useState<UserSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mentionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  const isSidebar = variant === 'sidebar';


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

  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setMentionResults([]);
      return;
    }
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setMentionResults(response.data?.users || []);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Failed to search users', err);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setNewComment(value);
    setCursorPosition(cursorPos);

    const beforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.slice(lastAtIndex + 1);
      const hasSpace = afterAt.includes(' ');
      
      if (!hasSpace && afterAt.length > 0) {
        setShowMentions(true);
        
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
          searchUsers(afterAt);
        }, 300);
        return;
      }
    }
    
    setShowMentions(false);
    setMentionResults([]);
  };

  const insertMention = (selectedUser: UserSearchResult) => {
    const beforeCursor = newComment.slice(0, cursorPosition);
    const afterCursor = newComment.slice(cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    
    const newBefore = beforeCursor.slice(0, lastAtIndex) + '@' + selectedUser.username + ' ';
    const newValue = newBefore + afterCursor;
    
    setNewComment(newValue);
    setShowMentions(false);
    setMentionResults([]);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentions || mentionResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % mentionResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (mentionResults[selectedIndex]) {
        insertMention(mentionResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (mentionResults[selectedIndex]) {
        insertMention(mentionResults[selectedIndex]);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    setLoading(true);
    try {
      const endpoint = targetType === 'post' ? `/posts/${targetId}/comments` : `/reels/${targetId}/comments`;
      const response = await api.post(endpoint, { content: newComment });
      
      const commentWithUser = {
        ...response.data,
        username: user?.username || 'You',
        avatar_url: user?.avatar_url
      };
      
      setComments(prev => [commentWithUser, ...prev]);
      setNewComment('');
      onCommentSuccess?.();
      
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = (username: string) => {
    setNewComment(`@${username} `);
    inputRef.current?.focus();
  };

  const handleMentionClick = (username: string) => {
    console.log('Navigate to profile:', username);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mentionsRef.current && !mentionsRef.current.contains(e.target as Node)) {
        setShowMentions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {!isSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
            />
          )}
          <motion.div
            initial={isSidebar ? { x: '100%', opacity: 0 } : { y: '100%' }}
            animate={isSidebar ? { x: 0, opacity: 1 } : { y: 0 }}
            exit={isSidebar ? { x: '100%', opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              ${isSidebar 
                ? 'relative h-full w-[380px] bg-bg-card border-l border-border-base flex flex-col overflow-hidden z-[9999]' 
                : 'fixed bottom-0 left-0 right-0 md:bottom-10 md:left-1/2 md:-translate-x-1/2 w-full md:max-w-lg h-[90dvh] md:h-[600px] bg-bg-card border-t md:border border-border-base rounded-t-[32px] md:rounded-[32px] shadow-2xl z-[9999] flex flex-col overflow-hidden overscroll-contain'
              }
            `}
          >
            <div className="md:hidden w-full flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-border-base/50 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 md:px-6 md:py-4 border-b border-border-base/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <h3 className="font-black text-text-base tracking-tight">Comments</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-bg-sidebar rounded-full transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-grow flex-shrink overflow-y-auto p-4 space-y-4 no-scrollbar touch-pan-y overscroll-contain">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <MessageCircle className="w-12 h-12 mb-2" />
                  <p className="text-sm font-bold">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex-shrink-0 overflow-hidden flex items-center justify-center border border-border-base/50">
                      <img 
                        src={getMediaUrl(comment.avatar_url, FALLBACKS.AVATAR(comment.username))} 
                        className="w-full h-full object-cover" 
                        alt="" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = FALLBACKS.AVATAR(comment.username);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-xs text-text-base">@{comment.username}</span>
                        <span className="text-[10px] text-text-muted">{formatRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-text-base/90 leading-relaxed">
                        {renderContentWithMentions(comment.content, comment.mentions, handleMentionClick)}
                      </p>
                      <button 
                        onClick={() => handleReply(comment.username)}
                        className="mt-1.5 text-[10px] font-black text-text-muted hover:text-primary transition-colors uppercase tracking-widest"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 md:p-6 bg-bg-card border-t border-border-base/50 pb-safe relative">
              <AnimatePresence>
                {showMentions && mentionResults.length > 0 && (
                  <motion.div
                    ref={mentionsRef}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-0 right-0 mx-4 mb-2 bg-bg-card border border-border-base rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-[110]"
                  >
                    {mentionResults.map((result, index) => (
                      <div
                        key={result.id}
                        onClick={() => insertMention(result)}
                        className={`
                          flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                          ${index === selectedIndex ? 'bg-primary/10' : 'hover:bg-bg-sidebar'}
                        `}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden flex items-center justify-center border border-border-base/50">
                          <img 
                            src={getMediaUrl(result.avatar_url, FALLBACKS.AVATAR(result.username))} 
                            className="w-full h-full object-cover" 
                            alt="" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-text-base">@{result.username}</p>
                          <p className="text-xs text-text-muted truncate">{result.full_name}</p>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <form onSubmit={handleCommentSubmit} className="relative flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id="comment-input"
                    name="comment"
                    type="text"
                    value={newComment}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    placeholder="Add a comment... (@ to mention)"
                    className="w-full bg-bg-sidebar/50 border border-border-base/50 rounded-2xl px-5 py-3.5 text-[16px] md:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {showMentions && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </div>
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
    </AnimatePresence>,
    document.body
  );
};