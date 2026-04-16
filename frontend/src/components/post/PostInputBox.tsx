import { type FC } from 'react';
import { Image as ImageIcon, Smile } from 'lucide-react';
import { BACKEND } from '../../utils/config';

interface PostInputBoxProps {
  user: any;
  onClick: () => void;
}

const PostInputBox: FC<PostInputBoxProps> = ({ user, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="w-full bg-bg-card rounded-full border border-border-base shadow-sm p-1.5 md:p-2 flex items-center gap-2.5 md:gap-3 cursor-pointer hover:shadow-md transition-all duration-300"
    >
      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 bg-bg-sidebar flex items-center justify-center overflow-hidden border border-border-base transition-colors">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url.startsWith('http') ? user.avatar_url : `${BACKEND}${user.avatar_url}`}
            alt="User"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-primary font-black text-sm uppercase">
            {user?.username?.charAt(0) || '?'}
          </span>
        )}
      </div>
      
      <div className="flex-1 bg-transparent px-2">
        <span className="text-text-muted text-sm font-medium select-none">Create a post...</span>
      </div>
      
      <div className="flex items-center gap-2 pr-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full text-primary/60 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer">
          <ImageIcon className="w-5 h-5" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-full text-accent/60 hover:bg-accent/10 hover:text-accent transition-all cursor-pointer">
          <Smile className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PostInputBox;
