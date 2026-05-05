import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';

export interface Story {
  id: string;
  username: string;
  avatar_url: string;
  isViewed?: boolean;
  hasStory?: boolean;
}

interface StoriesProps {
  stories: Story[];
  onStoryClick?: (story: Story, index: number) => void;
  onCreateStory?: () => void;
}

const Stories = ({ stories, onStoryClick, onCreateStory }: StoriesProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group mb-6">
      {/* Stories Row - Premium Glass Feel */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide py-5 px-6 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Your Story */}
        <div
          onClick={onCreateStory}
          className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group/my-story"
        >
          <div className="relative">
            <div className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl p-[2px] bg-brand-gradient shadow-lg shadow-primary/20 transition-transform group-hover/my-story:scale-105 duration-300">
              <div className="w-full h-full rounded-2xl bg-white dark:bg-bg-card p-[2px]">
                <div className="w-full h-full rounded-2xl bg-gray-100 dark:bg-bg-base flex items-center justify-center overflow-hidden">
                  {stories[0]?.avatar_url ? (
                    <img
                      src={getMediaUrl(stories[0].avatar_url)}
                      alt="Your Story"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-lg flex items-center justify-center border-2 border-white dark:border-bg-card shadow-lg">
              <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
          </div>
          <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
            Add
          </span>
        </div>

        {/* Story Items */}
        {stories.map((story, index) => (
          <div
            key={story.id}
            onClick={() => onStoryClick?.(story, index + 1)}
            className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group/story"
          >
            <div
              className={`w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl p-[2px] transition-all duration-300 group-hover/story:scale-105 group-hover/story:-translate-y-1 ${
                story.isViewed
                  ? 'bg-gray-200 dark:bg-white/10'
                  : 'bg-brand-gradient shadow-lg shadow-primary/10'
              }`}
            >
              <div className="w-full h-full rounded-2xl bg-white dark:bg-bg-card p-[2px]">
                <div className="w-full h-full rounded-2xl bg-gray-100 dark:bg-bg-base overflow-hidden">
                  {story.avatar_url ? (
                    <img
                      src={getMediaUrl(story.avatar_url)}
                      alt={story.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary font-bold text-lg">
                        {story.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className={`text-[10px] uppercase tracking-wider truncate max-w-[64px] ${
              story.isViewed ? 'text-text-muted/60 font-medium' : 'text-text-base font-black'
            }`}>
              {story.username}
            </span>
          </div>
        ))}
      </div>

      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-text-base opacity-0 group-hover:opacity-100 transition-all shadow-xl -ml-5 hidden md:flex hover:scale-110 active:scale-95"
      >
        ←
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-text-base opacity-0 group-hover:opacity-100 transition-all shadow-xl -mr-5 hidden md:flex hover:scale-110 active:scale-95"
      >
        →
      </button>
    </div>
  );
};

// Dummy Data
export const dummyStories: Story[] = [
  { id: '1', username: 'john_doe', avatar_url: '', isViewed: false, hasStory: true },
  { id: '2', username: 'jane_smith', avatar_url: '', isViewed: true, hasStory: true },
  { id: '3', username: 'mike_dev', avatar_url: '', isViewed: false, hasStory: true },
  { id: '4', username: 'sarah_codes', avatar_url: '', isViewed: true, hasStory: true },
  { id: '5', username: 'alex_ui', avatar_url: '', isViewed: false, hasStory: true },
  { id: '6', username: 'emmaux', avatar_url: '', isViewed: false, hasStory: true },
  { id: '7', username: 'davidux', avatar_url: '', isViewed: true, hasStory: true },
  { id: '8', username: 'lisa_design', avatar_url: '', isViewed: false, hasStory: true },
];

export default Stories;