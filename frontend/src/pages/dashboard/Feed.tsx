import { type FC } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { StoryBar } from '../../components/story/StoryBar';

const Feed: FC = () => {
  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#f9e8ff] text-black p-4 space-y-6">
      <StoryBar stories={[]} user={null} onCreateStory={() => {}} onStoryClick={() => {}} />
      
      <div className="max-w-xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-primary/10 rounded-2xl overflow-hidden shadow-xl">
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold">
                  U{i}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">User {i}</h4>
                  <p className="text-[10px] text-black/40">2 hours ago • New Delhi</p>
                </div>
              </div>
              <button className="text-black/40 hover:text-black">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Post Content */}
            <div className="aspect-square bg-primary/5 flex items-center justify-center">
              <img 
                src={`https://picsum.photos/seed/${i + 100}/600/600`} 
                alt="post" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Post Actions */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-4">
                <button className="text-black/40 hover:text-accent transition-colors">
                  <Heart className="w-6 h-6" />
                </button>
                <button className="text-black/40 hover:text-primary transition-colors">
                  <MessageCircle className="w-6 h-6" />
                </button>
                <button className="text-black/40 hover:text-black transition-colors">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>
              <div>
                <p className="text-sm font-bold text-black">1,234 likes</p>
                <p className="text-sm text-black/60">
                  <span className="font-bold mr-2 text-black">User {i}</span>
                  Exploring the beautiful streets of Delhi today! #travel #delhi
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { Feed };
