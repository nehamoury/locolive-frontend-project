import { useState, useEffect, type FC } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoryBar } from '../../components/story/StoryBar';
import PostCard from '../../components/post/PostCard';
import api from '../../services/api';
import { useInView } from 'react-intersection-observer';

interface HomeViewProps {
  stories: any[];
  user: any;
  loading: boolean;
  onCreateStory: () => void;
  onStoryClick: (userStories: any[], index: number) => void;
  unreadMessagesCount?: number;
}

const HomeView: FC<HomeViewProps> = ({ stories, user, loading, onCreateStory, onStoryClick }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView();

  const fetchPosts = async (isLoadMore = false) => {
    if (loadingPosts || (!hasMore && isLoadMore)) return;
    
    setLoadingPosts(true);
    try {
      const endpoint = cursor && isLoadMore ? `/posts/feed?cursor=${encodeURIComponent(cursor)}` : '/posts/feed';
      const res = await api.get(endpoint);
      
      const newPosts = res.data?.posts || [];
      const nextCursor = res.data?.next_cursor || null;

      if (isLoadMore) {
        setPosts(prev => {
          // Remove duplicates
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = newPosts.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      } else {
        setPosts(newPosts);
      }
      
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } catch (err: any) {
      console.error('[HomeView] Failed to fetch posts:', err.response?.data || err.message);
      if (!isLoadMore) setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (inView && hasMore && !loadingPosts) {
      fetchPosts(true);
    }
  }, [inView, hasMore, loadingPosts]);

  return (
    <div className="flex flex-col w-full bg-transparent">

      {/* ── Feed Content ───────────────────── */}
      <div className="w-full px-0 sm:px-4 md:px-6 pt-0 pb-6 md:pb-8 flex flex-col items-center">
        <div className="w-full max-w-xl flex flex-col gap-1 sm:gap-6 pt-0">

          {/* Stories Section - Mobile: Transparent | Web: Glassmorphism */}
          <div className="w-full bg-transparent md:bg-white/70 md:dark:bg-white/10 md:backdrop-blur-2xl md:rounded-[32px] md:border border-transparent md:border-white/40 md:dark:border-white/20 p-0 sm:p-4 md:shadow-sm mb-2 md:mb-0">
            <StoryBar
              stories={stories}
              user={user}
              onCreateStory={onCreateStory}
              onStoryClick={onStoryClick}
            />
          </div>

          {/* Post Feed */}
          <div className="w-full flex flex-col gap-4 sm:gap-6">
            {(loading || loadingPosts) ? (
              <div className="w-full flex justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-[3px] border-border-base border-t-primary animate-spin" />
                  <p className="text-[12px] font-medium text-text-muted">Loading your feed...</p>
                </div>
              </div>
            ) : posts.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-center py-20 bg-bg-card/50 backdrop-blur-2xl md:rounded-[32px] border border-border-base/50 shadow-2xl px-6 relative overflow-hidden">
                {/* Decorative Background Glows */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />

                <div className="w-20 h-20 bg-brand-gradient rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 relative z-10">
                  <MapPin className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-[24px] font-black text-text-base mb-2 tracking-tight relative z-10">Start Your Journey</h3>
                <p className="text-text-muted max-w-xs mb-10 text-[14px] font-medium leading-relaxed relative z-10">
                  Follow people around you or explore nearby to see what's happening in your world.
                </p>
                <button
                  onClick={() => navigate('/dashboard/explore')}
                  className="relative z-10 px-10 py-4 bg-brand-gradient text-white rounded-[20px] font-bold text-[15px] shadow-2xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Explore Nearby
                </button>
              </div>
            ) : (
              <>
                {posts.map((post: any, index: number) => (
                  <PostCard
                    key={post.id || `post-${index}`}
                    post={post}
                    currentUserID={user?.id}
                    onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                  />
                ))}
                
                {/* Infinite Scroll trigger element */}
                {hasMore && (
                  <div ref={ref} className="w-full py-8 flex justify-center items-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-[3px] border-border-base border-t-primary animate-spin" />
                      <p className="text-[12px] font-medium text-text-muted">Loading more posts...</p>
                    </div>
                  </div>
                )}
                {!hasMore && posts.length > 0 && (
                  <div className="w-full py-12 flex justify-center items-center text-center">
                    <p className="text-[14px] font-medium text-text-muted italic opacity-60">You're all caught up!</p>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeView;
