import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface StoryBarProps {
  stories: any[];
  user: any;
  onCreateStory: () => void;
  onStoryClick: (stories: any[], index: number) => void;
}

const RING_VIEWED = 'border-[1.5px] border-border-base';

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
        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group w-[72px] sm:w-[76px]"
      >
        {/* Ring */}
        <div className={`
          w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 relative
          ${hasMyStories ? `p-[2.5px] bg-brand-gradient` : 'p-[2px] border-[2px] border-dashed border-border-base'}
        `}>
          <div className="w-full h-full rounded-full bg-bg-card p-[2px] overflow-hidden flex items-center justify-center">
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
              className="absolute bottom-0 right-0 w-5.5 h-5.5 rounded-full bg-primary border-2 border-bg-card flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] text-white" />
            </div>
          )}
        </div>

        <span className="text-[11px] font-bold text-text-muted text-center leading-tight w-full truncate italic tracking-tight">
          Your Story
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
            className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer w-[72px] sm:w-[76px]"
          >
            <div className={`
              w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 relative
              ${isViewed ? `p-[2.5px] ${RING_VIEWED}` : `p-[2.5px] bg-brand-gradient`}
            `}>
              <div className="w-full h-full rounded-full bg-bg-card p-[2px] overflow-hidden">
                <div className="w-full h-full rounded-full overflow-hidden bg-bg-base">
                  {story?.avatar_url ? (
                    <img
                      src={getMediaUrl(story.avatar_url, FALLBACKS.AVATAR(story.username))}
                      alt={story.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/5 text-secondary font-black text-lg uppercase italic">
                      {story?.username?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <span className={`text-[11px] font-bold text-center leading-tight w-full truncate italic tracking-tight ${isViewed ? 'text-text-muted/50' : 'text-text-base'}`}>
              {story?.full_name?.split(' ')[0] || story?.username || 'User'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export { StoryBar };
