import React, { useState, useEffect } from 'react';
import { User, MessageCircle, Heart, Share2, Bookmark, Send } from 'lucide-react';
import api from '../../services/api';
import { BACKEND } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

interface Comment {
  id: string;
  username: string;
  avatar_url?: string;
  content: string;
  created_at: string;
}

interface ComponentProps {
  reel: any;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
}

const ReelsSidebar: React.FC<ComponentProps> = ({ reel, onLike, onSave, onShare }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFullCaption, setShowFullCaption] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [reel.id]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/reels/${reel.id}/comments`);
      setComments(data || []);
    } catch (err) {
      console.error('Failed to fetch comments');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || loading) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/reels/${reel.id}/comments`, { content: newComment });
      setComments(prev => [{ ...data, username: user?.username, avatar_url: user?.avatar_url }, ...prev]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-[420px] h-full flex flex-col bg-white border-l border-border-base relative z-10 transition-all duration-300">
      
      {/* Profile Header */}
      <div className="p-8 border-b border-border-base flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-14 h-14 rounded-full border-[3px] border-primary p-0.5 bg-white shadow-xl shadow-primary/10 transition-transform group-hover:rotate-6">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center">
              {reel.avatar_url ? (
                <img src={`${BACKEND}${reel.avatar_url}`} alt={reel.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-zinc-400" />
              )}
            </div>
          </div>
          <div>
            <h4 className="text-[17px] font-black text-text-base leading-none tracking-tight">@{reel.username}</h4>
            <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-[0.2em]">Live Nearby</p>
            </div>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-brand-gradient text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 cursor-pointer">
          Follow
        </button>
      </div>

      {/* Content Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
        
        {/* Caption Section */}
        <div className="space-y-3">
          <p className={`text-[14px] leading-relaxed text-text-base font-medium ${!showFullCaption ? 'line-clamp-3' : ''}`}>
            {reel.caption}
          </p>
          {reel.caption?.length > 100 && (
            <button 
              onClick={() => setShowFullCaption(!showFullCaption)}
              className="text-[11px] font-black text-primary uppercase tracking-widest hover:underline"
            >
              {showFullCaption ? 'See Less' : 'See More'}
            </button>
          )}
        </div>

        <div className="h-px bg-border-base/50" />

        {/* Real-time Comments Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <h5 className="text-[11px] font-black uppercase tracking-widest text-text-muted">Comments</h5>
          </div>

          <div className="space-y-5">
            {comments.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[12px] font-bold text-text-muted italic">Be the first to comment...</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {comment.avatar_url ? (
                      <img src={`${BACKEND}${comment.avatar_url}`} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-zinc-400">{comment.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-black text-text-base">@{comment.username}</span>
                      <span className="text-[10px] text-text-muted">Just now</span>
                    </div>
                    <p className="text-[13px] text-text-base/80 leading-relaxed font-medium">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fixed Sticky Footer Actions */}
      <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-border-base space-y-6">
        {/* Interaction Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => onLike(reel.id)} className={`flex items-center gap-2 transition-all ${reel.is_liked ? 'text-primary scale-110' : 'text-text-base hover:text-primary'} cursor-pointer group`}>
              <div className={`p-2 rounded-xl transition-all ${reel.is_liked ? 'bg-primary/10' : 'group-hover:bg-primary/5'}`}>
                <Heart className={`w-5 h-5 ${reel.is_liked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[14px] font-black">{reel.likes_count}</span>
            </button>
            <button onClick={() => onShare(reel.id)} className="flex items-center gap-2 text-text-base hover:text-primary transition-all cursor-pointer group">
              <div className="p-2 rounded-xl group-hover:bg-primary/5 transition-all">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[14px] font-black">{reel.shares_count}</span>
            </button>
          </div>
          <button onClick={() => onSave(reel.id)} className={`p-2 rounded-xl transition-all ${reel.is_saved ? 'text-yellow-500 bg-yellow-500/10 scale-110' : 'text-text-base hover:text-yellow-500 hover:bg-yellow-500/5'} cursor-pointer`}>
            <Bookmark className={`w-5 h-5 ${reel.is_saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Desktop Comment Input */}
        <form onSubmit={handleCommentSubmit} className="relative">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full bg-zinc-50 border border-border-base rounded-2xl px-6 py-4 text-[13px] font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/30 transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || loading}
            className="absolute right-3 top-2 p-2.5 bg-brand-gradient text-white rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ReelsSidebar;
