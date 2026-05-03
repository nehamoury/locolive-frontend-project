import { useState, useEffect, type FC, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StoryBar } from '../../components/story/StoryBar';
import PostCard from '../../components/post/PostCard';
import api from '../../services/api';

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
  const hasFetched = useRef(false);

  const fetchPosts = async () => {
    if (hasFetched.current) return; // Prevent duplicate fetches
    hasFetched.current = true;

    setLoadingPosts(true);
    try {
      const res = await api.get('/posts/feed');
      const postsData = res.data?.posts || [];
      setPosts(postsData);
    } catch (err: any) {
      console.error('[HomeView] Failed to fetch posts:', err.response?.data || err.message);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="flex flex-col w-full bg-transparent">

      {/* ── Feed Content ───────────────────── */}
      <div className="w-full px-0 sm:px-4 md:px-6 pt-0 pb-6 md:pb-8 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col gap-4 sm:gap-6 pt-0">

          {/* Stories Section - Mobile: Transparent | Web: Glassmorphism */}
          <div className="w-full bg-transparent md:bg-white/70 md:dark:bg-white/10 md:backdrop-blur-2xl md:rounded-[32px] md:border border-transparent md:border-white/40 md:dark:border-white/20 p-0.5 sm:p-4 md:shadow-sm">
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
              <div className="w-full flex flex-col items-center justify-center text-center py-20 bg-bg-card md:rounded-[32px] border border-border-base shadow-sm px-6">
                <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-5">
                  <MapPin className="w-8 h-8 text-primary/50" />
                </div>
                <h3 className="text-[20px] font-black text-text-base mb-2 tracking-tight italic">Nothing here yet</h3>
                <p className="text-text-muted max-w-xs mb-8 text-[13px] font-medium leading-relaxed">
                  Follow more people around you to see their posts and stories.
                </p>
                <button
                  onClick={() => navigate('/dashboard/explore')}
                  className="px-8 py-3 bg-brand-gradient text-white rounded-2xl font-bold text-[14px] shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Explore Nearby
                </button>
              </div>
            ) : (
              posts.map((post: any, index: number) => (
                <PostCard
                  key={post.id || `post-${index}`}
                  post={post}
                  currentUserID={user?.id}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomeView;
