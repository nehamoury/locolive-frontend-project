import { useState, useEffect, type FC } from 'react';
import { MapPin, Plus, Search, Bell, MessageCircle } from 'lucide-react';
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
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
}

const HomeView: FC<HomeViewProps> = ({ stories, user, loading, onCreateStory, onStoryClick, unreadNotificationsCount = 0, unreadMessagesCount = 0 }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      console.log('[HomeView] Fetching posts from /posts/feed...');
      const res = await api.get('/posts/feed');
      const postsData = res.data?.posts || [];
      console.log(`[HomeView] Fetched ${postsData.length} posts:`, postsData);
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
    <div className="flex flex-col h-auto md:h-full bg-transparent overflow-y-visible md:overflow-y-auto no-scrollbar relative w-full font-poppins">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="hidden md:flex sticky top-0 z-40 bg-bg-card/95 backdrop-blur-xl px-6 pt-5 pb-5 items-center justify-between shrink-0 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border-b border-border-base transition-colors duration-300">
        {/* Search bar on the left */}
        <div className="flex-1 relative group mr-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search people, posts, locations..."
            className="w-full pl-12 pr-4 py-3 bg-bg-base border border-transparent rounded-full text-[13.5px] font-medium text-text-base placeholder-text-muted/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-bg-base/80 focus:outline-none focus:bg-bg-card focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Actions on the right */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/notifications')} className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-base text-text-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full border-2 border-bg-card flex items-center justify-center shadow-sm">{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</span>}
          </button>

          <button onClick={() => navigate('/dashboard/messages')} className="relative w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-base text-text-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
            <MessageCircle className="w-5 h-5" />
            {unreadMessagesCount > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-black rounded-full border-2 border-bg-card flex items-center justify-center shadow-sm">{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</span>}
          </button>

          <button
            onClick={onCreateStory}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-[20px] text-[13px] font-bold shadow-[0_8px_20px_-6px_rgba(var(--color-primary-rgb),0.4)] hover:shadow-[0_12px_25px_-6px_rgba(var(--color-primary-rgb),0.5)] hover:scale-[1.02] active:scale-95 transition-all whitespace-nowrap ml-1"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Create Post
          </button>
        </div>
      </div>


      {/* ── Feed Content Container ─────────────────────────────── */}
      <div className="flex-1 w-full px-0 md:px-6 pt-2 pb-20 flex flex-col items-start bg-transparent">

        {/* Stories Section */}
        <div className="w-full md:bg-bg-card md:rounded-[24px] md:border md:border-border-base md:shadow-[0_8px_30px_rgba(0,0,0,0.02)] md:p-5 p-0 mb-0.5 md:mb-6 border-b border-border-base/30 md:border-b-transparent transition-colors duration-300">
          <div className="md:px-0 px-2">
            <StoryBar
              stories={stories}
              user={user}
              onCreateStory={onCreateStory}
              onStoryClick={onStoryClick}
            />
          </div>
        </div>

        {/* Feed List */}
        <div className="w-full flex flex-col items-start gap-6">
          {(loading || loadingPosts) ? (
            <div className="w-full max-w-3xl flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-transparent border-t-[#FF3B8E]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center text-center py-24 bg-bg-card rounded-[24px] border border-border-base shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-colors duration-300">
              <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center text-text-muted mb-6">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-text-base mb-2 tracking-tight">No updates yet</h3>
              <p className="text-text-muted max-w-xs mb-8 text-sm font-medium">
                Try following more people or sharing your own moment!
              </p>
            </div>
          ) : (
            posts.map((post: any) => (
              <div key={post.id} className="w-full max-w-full md:max-w-3xl">
                <PostCard
                  post={post}
                  currentUserID={user?.id}
                  onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
