import { type FC } from 'react';
import { Plus } from 'lucide-react';
import { BACKEND } from '../../utils/config';

interface StoryBarProps {
  stories: any[];
  user: any;
  onCreateStory: () => void;
  onStoryClick: (stories: any[], index: number) => void;
}

const StoryBar: FC<StoryBarProps> = ({ stories = [], user, onCreateStory, onStoryClick }) => {
  const myStories = (stories || []).filter(s => s && s.username === user?.username);
  const otherStories = (stories || []).filter(s => s && s.username !== user?.username);
  const uniqueOtherStories = Array.from(new Map(otherStories.filter(s => s && s.username).map(s => [s.username, s])).values());
  
  const getViewedStatus = (username: string) => {
    return localStorage.getItem(`story_viewed_${username}`) === 'true';
  };

  const hasMyStories = myStories.length > 0;

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-1 font-brand items-start w-full touch-pan-x">
      {/* Your Story */}
      <div 
        onClick={() => hasMyStories ? onStoryClick(myStories, 0) : onCreateStory()}
        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group w-[86px]"
      >
        <div className={`
          w-[82px] h-[82px] rounded-full p-[3px] transition-all duration-300 group-hover:scale-105 active:scale-95 relative
          ${hasMyStories ? 'bg-gradient-to-tr from-primary to-accent' : 'bg-transparent border border-border-base'}
        `}>
          <div className="w-full h-full rounded-full border-[2.5px] border-bg-card bg-bg-card overflow-hidden flex items-center justify-center">
            {user?.avatar_url || (hasMyStories && myStories[0].avatar_url) ? (
              <img 
                src={user?.avatar_url?.startsWith('http') ? user.avatar_url : `${BACKEND}${user?.avatar_url || myStories[0].avatar_url}`} 
                alt="My Story" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-bg-sidebar text-primary/40 font-black text-xl uppercase italic">
                {user?.username?.charAt(0) || 'Y'}
              </div>
            )}
          </div>
          
          {/* Action Overlay */}
          {!hasMyStories && (
            <div 
              onClick={(e) => { e.stopPropagation(); onCreateStory(); }}
              className="absolute bottom-0 right-0 w-[20px] h-[20px] rounded-full bg-primary border-[2px] border-bg-card flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[4]" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center mt-1">
          <span className="text-[12px] font-bold text-text-base transition-colors tracking-tight leading-none text-center truncate w-full italic">Your Story</span>
        </div>
      </div>

      {/* Dynamic User Stories */}
      {uniqueOtherStories.map((story) => {
        const isViewed = getViewedStatus(story.username);
        const thisUserStories = stories.filter(s => s.username === story.username);

        return (
          <div 
            key={story.id} 
            onClick={() => onStoryClick(thisUserStories, 0)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group cursor-pointer w-[86px]"
          >
            <div className={`
              w-[82px] h-[82px] rounded-full p-[3px] transition-all duration-300 group-hover:scale-105 active:scale-95 relative
              ${isViewed ? 'border border-border-base bg-transparent p-0' : 'bg-gradient-to-tr from-primary to-accent'}
            `}>
              <div className="w-full h-full rounded-full border-[2.5px] border-bg-card bg-bg-card overflow-hidden">
                {story?.avatar_url ? (
                  <img 
                    src={story.avatar_url.startsWith('http') ? story.avatar_url : `${BACKEND}${story.avatar_url}`} 
                    alt={story.username} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-sidebar text-primary font-black text-xl uppercase italic opacity-40">
                    {story?.username?.charAt(0) || '?'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center mt-1">
              <span className={`text-[12px] font-bold max-w-[86px] transition-colors tracking-tight leading-tight text-center italic ${isViewed ? 'text-text-muted/60' : 'text-text-base'}`}>
                {story?.full_name?.split(' ')[0] || story?.username || 'User'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export { StoryBar };
