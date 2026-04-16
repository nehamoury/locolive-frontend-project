import { type FC, useState } from 'react';
import { Heart, CheckCircle2, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface CastingUser {
  id: string;
  full_name: string;
  username: string;
  distance_km?: number;
  avatar_url?: string;
  is_verified?: boolean;
  is_online?: boolean;
  last_active_at?: string;
  bio?: string;
  mutual_count?: number;
}

interface CastingCardProps {
  user: CastingUser;
  onMatch: (id: string) => void;
  onPass: (id: string) => void;
  onViewProfile: (id: string) => void;
}

const CastingCard: FC<CastingCardProps> = ({ user, onMatch, onPass, onViewProfile }) => {
  const [isLiked, setIsLiked] = useState(false);

  // Extract hashtags from bio for interest tags
  const tags = user.bio?.match(/#[a-z0-9]+/gi) || [];

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-bg-card rounded-[32px] sm:rounded-[40px] p-3 sm:p-4 shadow-sm border border-border-base flex flex-col gap-3 sm:gap-4 group transition-all"
    >
      {/* Profile Image Container */}
      <div 
        className="relative aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden bg-bg-base cursor-pointer"
        onClick={() => onViewProfile(user.id)}
      >
        {user.avatar_url ? (
          <img
            src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))}
            alt={user.full_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
            <User className="w-10 h-10 md:w-12 md:h-12 text-primary/20" />
            <span className="text-[9px] font-black italic text-primary/10 uppercase tracking-widest mt-2">Locolive</span>
          </div>
        )}

        {/* Favorite Heart Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`absolute top-3 right-3 w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-lg ${
            isLiked 
              ? 'bg-primary text-white shadow-primary/20' 
              : 'bg-bg-card/80 text-text-muted hover:text-primary border border-border-base/50'
          }`}
        >
          <Heart className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Online Status Indicator */}
        {user.is_online && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-bg-card/80 backdrop-blur-md rounded-full shadow-sm border border-border-base/50">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[9px] font-black text-text-base uppercase tracking-tighter">Live</span>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="flex flex-col px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-base sm:text-[17px] font-black text-text-base truncate tracking-tight leading-tight">
              {user.full_name}
            </h3>
            {user.mutual_count && user.mutual_count > 0 ? (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/10 shrink-0">
                <Users className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                  {user.mutual_count}
                </span>
              </div>
            ) : (
                user.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-50 shrink-0" />
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] font-bold text-text-muted/60">@{user.username}</p>
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest bg-bg-base px-2 py-0.5 rounded-md border border-border-base/50">
            {user.distance_km ? `${user.distance_km.toFixed(1)} km` : 'Nearby'}
          </p>
        </div>

        {/* Interest Tags (limited to 3) */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 3).map((tag, i) => (
              <span 
                key={tag}
                className={cn(
                  "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight border",
                  i === 0 ? 'bg-primary/5 text-primary border-primary/10' :
                  i === 1 ? 'bg-accent/5 text-accent border-accent/10' :
                  'bg-blue-500/5 text-blue-500 border-blue-500/10'
                )}
              >
                {tag.replace('#', '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <button
          onClick={() => onMatch(user.id)}
          className="flex-1 py-3 bg-brand-gradient text-white rounded-2xl text-[13px] font-black shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
        >
          Connect
        </button>
        <button
          onClick={() => onPass(user.id)}
          className="px-4 py-3 bg-bg-base text-text-muted rounded-2xl border border-border-base hover:bg-bg-base/80 transition-all active:scale-95"
        >
          Skip
        </button>
      </div>
    </motion.div>

  );
};

export default CastingCard;
