import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { BACKEND } from '../../utils/config';

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
    <div className="relative group">
      {/* Scroll Buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -ml-4 hidden md:flex"
      >
        ←
      </button>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity -mr-4 hidden md:flex"
      >
        →
      </button>

      {/* Stories Row */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-4 md:px-0 md:mx-auto md:max-w-[600px]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Your Story */}
        <div
          onClick={onCreateStory}
          className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group/my-story"
        >
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-500">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {stories[0]?.avatar_url ? (
                    <img
                      src={stories[0].avatar_url.startsWith('http') ? stories[0].avatar_url : `${BACKEND}${stories[0].avatar_url}`}
                      alt="Your Story"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-white">
              <Plus className="w-3 h-3 text-white stroke-[3]" />
            </div>
          </div>
          <span className="text-[10px] md:text-xs text-gray-600 font-medium max-w-[64px] md:max-w-[80px] truncate">
            Your Story
          </span>
        </div>

        {/* Story Items */}
        {stories.map((story, index) => (
          <div
            key={story.id}
            onClick={() => onStoryClick?.(story, index + 1)}
            className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0 group/story"
          >
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full p-[3px] transition-transform group-hover/story:scale-105 ${
                story.isViewed
                  ? 'bg-gray-300'
                  : 'bg-gradient-to-tr from-pink-500 via-purple-500 to-amber-500'
              }`}
            >
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden">
                  {story.avatar_url ? (
                    <img
                      src={story.avatar_url.startsWith('http') ? story.avatar_url : `${BACKEND}${story.avatar_url}`}
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
            <span className={`text-[10px] md:text-xs max-w-[64px] md:max-w-[80px] truncate ${
              story.isViewed ? 'text-gray-500' : 'text-gray-700 font-medium'
            }`}>
              {story.username}
            </span>
          </div>
        ))}
      </div>
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