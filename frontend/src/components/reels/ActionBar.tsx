import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon;
  count?: number;
  active?: boolean;
  onClick: () => void;
  activeColor?: string;
  isFloating: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  count,
  active = false,
  onClick,
  activeColor = 'text-primary',
  isFloating,
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={`flex ${isFloating ? 'flex-col' : 'flex-row'} items-center gap-1.5 group cursor-pointer`}
  >
    <div
      className={`
        ${isFloating ? 'w-10 h-10' : 'w-10 h-10'} flex items-center justify-center transition-all duration-300
        ${active ? `${activeColor} scale-110` : 'text-white hover:scale-110'}
      `}
    >
      <Icon
        strokeWidth={2.8}
        className={`${isFloating ? 'w-7 h-7' : 'w-5 h-5'} ${active ? 'fill-current' : ''} drop-shadow-md`}
      />
    </div>
    {typeof count === 'number' && (
      <span className={`text-[11px] font-bold ${isFloating ? 'text-white' : 'text-zinc-500'} drop-shadow-lg`}>
        {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
      </span>
    )}
  </button>
);

interface ActionBarProps {
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  mode?: 'floating' | 'sidebar';
}

const ActionBar: React.FC<ActionBarProps> = ({
  likes,
  comments,
  shares,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onShare,
  onSave,
  mode = 'floating'
}) => {
  const isFloating = mode === 'floating';

  if (!isFloating) return null; // In sidebar mode, actions are rendered differently in ReelsSidebar

  return (
    <div className="flex flex-col items-center gap-6">
      <ActionButton 
        icon={Heart} 
        count={likes} 
        active={isLiked} 
        onClick={onLike} 
        isFloating={isFloating}
      />
      <ActionButton 
        icon={MessageCircle} 
        count={comments} 
        onClick={onComment} 
        isFloating={isFloating}
      />
      <ActionButton 
        icon={Share2} 
        count={shares} 
        onClick={onShare} 
        isFloating={isFloating}
      />
      <ActionButton 
        icon={Bookmark} 
        active={isSaved} 
        onClick={onSave} 
        activeColor="text-yellow-500"
        isFloating={isFloating}
      />
    </div>
  );
};

export default ActionBar;
