import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface StoryBarProps {
  stories: any[];
  user: any;
  onCreateStory: () => void;
  onStoryClick: (stories: any[], index: number) => void;
}



const StoryBar: FC<StoryBarProps> = ({ stories = [], user, onCreateStory, onStoryClick }) => {
  const myStories = (stories || []).filter(s => s && s.username === user?.username);
  const otherStories = (stories || []).filter(s => s && s.username !== user?.username);
  const uniqueOtherStories = Array.from(
    new Map(otherStories.filter(s => s && s.username).map(s => [s.username, s])).values()
  );

  const getViewedStatus = (username: string) =>
    localStorage.getItem(`story_viewed_${username}`) === 'true';

  const hasMyStories = myStories.length > 0;

  return (
    <div className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide py-1 px-0.5 items-start w-full touch-pan-x">

      {/* ── Your Story ── */}
      <div
        onClick={() => hasMyStories ? onStoryClick(myStories, 0) : onCreateStory()}
        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group w-[80px] sm:w-[88px]"
      >
        {/* Ring */}
        <div className={`
          w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 relative
          ${hasMyStories ? `p-[2.5px] bg-brand-gradient` : 'p-[2px] border-[2px] border-dashed border-border-base/50'}
        `}>
          <div className="w-full h-full rounded-full bg-white dark:bg-bg-card p-[2px] overflow-hidden flex items-center justify-center">
            <div className="w-full h-full rounded-full overflow-hidden bg-bg-base">
              {user?.avatar_url || (hasMyStories && myStories[0].avatar_url) ? (
                <img
                  src={getMediaUrl(user?.avatar_url || myStories[0]?.avatar_url, FALLBACKS.AVATAR(user?.username))}
                  alt="My Story"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary font-black text-lg uppercase italic">
                  {user?.username?.charAt(0) || 'Y'}
                </div>
              )}
            </div>
          </div>

          {/* Add Badge */}
          {!hasMyStories && (
            <div
              onClick={(e) => { e.stopPropagation(); onCreateStory(); }}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white dark:border-bg-card flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5 stroke-[3] text-white" />
            </div>
          )}
        </div>

        <span className="text-[10px] font-medium text-text-muted tracking-wider text-center w-full truncate">
          Add Story
        </span>
      </div>

      {/* ── Other Stories ── */}
      {uniqueOtherStories.map((story, index) => {
        const isViewed = getViewedStatus(story.username);
        const thisUserStories = stories.filter(s => s.username === story.username);

        return (
          <div
            key={story.id || story.username || `story-${index}`}
            onClick={() => onStoryClick(thisUserStories, 0)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer w-[80px] sm:w-[88px]"
          >
            <div className={`
              w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] rounded-full transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 active:scale-95 relative
              ${isViewed ? `p-[2.5px] border-2 border-border-base/30` : `p-[2.5px] bg-brand-gradient`}
            `}>
              <div className="w-full h-full rounded-full bg-white dark:bg-bg-card p-[2px] overflow-hidden">
                <div className="w-full h-full rounded-full overflow-hidden bg-bg-base">
                  {story?.avatar_url ? (
                    <img
                      src={getMediaUrl(story.avatar_url, FALLBACKS.AVATAR(story.username))}
                      alt={story.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-baseline justify-center bg-secondary/5 text-secondary font-black text-lg">
                      {story?.username?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <span className={`text-[10px] font-medium tracking-wider text-center w-full truncate ${isViewed ? 'text-text-muted/40' : 'text-text-base'}`}>
              {story?.username || 'User'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export { StoryBar };
