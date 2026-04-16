import React from 'react';
import { X, Star, Heart, MapPin, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { BACKEND } from '../../utils/config';

interface PeopleNearbyCardProps {
  user: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    distance?: string;
    bio?: string;
    tags?: string[];
    labels?: string[]; // e.g. ["NEARBY", "EXPERT"]
  };
  onConnect?: (userId: string) => void;
  onProfileClick?: (userId: string) => void;
  onSkip?: () => void;
  onFavorite?: (userId: string) => void;
}

export const PeopleNearbyCard: React.FC<PeopleNearbyCardProps> = ({ 
  user, 
  onConnect, 
  onProfileClick,
  onSkip,
  onFavorite
}) => {
  const isGuest = user.username === 'Guest';
  const labels = user.labels || ["NEARBY"];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group w-full"
    >
      <motion.div 
        whileHover={{ y: -10, scale: 1.01 }}
        onClick={() => !isGuest && onProfileClick?.(user.id)}
        className="bg-white rounded-[48px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(255,0,110,0.12)] border border-pink-50 p-6 flex flex-col items-center gap-6 cursor-pointer group transition-all duration-500"
      >
        {/* Profile Image with Gradient Ring */}
        <div className="relative">
          <div className="absolute inset-0 bg-brand-gradient rounded-full blur-[10px] opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="w-48 h-48 rounded-full p-2 bg-brand-gradient relative z-10">
            <div className="w-full h-full rounded-full bg-white overflow-hidden p-1.5 shadow-inner">
               <div className="w-full h-full rounded-full bg-bg-base overflow-hidden relative">
                {user.avatar_url ? (
                    <img 
                      src={`${BACKEND}${user.avatar_url}`} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      alt={user.username} 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-primary/20 italic">
                      {(user.username?.charAt(0) || 'U').toUpperCase()}
                    </div>
                  )}
               </div>
            </div>
          </div>
          
          {/* Online status badge */}
          <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20 shadow-lg" />
          
          {/* Label Chip */}
          <div className="absolute -top-2 -right-4 bg-red-50 px-3 py-1 rounded-full border border-red-100 shadow-sm z-20">
             <span className="text-[10px] font-black text-red-500 tracking-widest">{labels[0]}</span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center text-center gap-1">
          <h3 className="text-3xl font-black text-text-base italic tracking-tight translate-x-1">
            {user.full_name || user.username}
          </h3>
          <div className="flex items-center gap-1.5 text-text-muted text-[11px] font-black uppercase tracking-widest leading-none">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {user.distance ? `${user.distance} away` : 'Nearby'}
          </div>
        </div>

        {/* Bio / Description */}
        <p className="text-sm font-medium text-text-muted leading-relaxed max-w-xs h-10 line-clamp-2">
            {user.bio || "Hi there! I'm exploring new places and meeting vibrant souls."}
        </p>

        {/* Action Buttons */}
        <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(255,0,110,0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); onConnect?.(user.id); }}
            className="w-full py-4 bg-brand-gradient rounded-full text-white font-black italic tracking-tight text-[15px] flex items-center justify-center gap-2 group/btn shadow-[0_15px_30px_-5px_rgba(255,0,110,0.2)]"
        >
            <Heart className="w-5 h-5 transition-transform group-hover/btn:scale-125" />
            Connect
        </motion.button>

        {/* Secondary Actions */}
        <div className="flex items-center justify-center gap-4 w-full pt-2">
             <div className="flex-1 h-px bg-border-base" />
             <div className="flex gap-4">
                <MiniAction onClick={(e) => { e.stopPropagation(); onSkip?.(); }} icon={<X className="w-5 h-5" />} color="text-text-muted" bg="bg-bg-base" />
                <MiniAction onClick={(e) => { e.stopPropagation(); onFavorite?.(user.id); }} icon={<Star className="w-5 h-5" />} color="text-amber-500" bg="bg-amber-50" />
                <MiniAction onClick={(e) => { e.stopPropagation(); }} icon={<Zap className="w-5 h-5" />} color="text-primary" bg="bg-primary/5" />
             </div>
             <div className="flex-1 h-px bg-border-base" />
        </div>
      </motion.div>
    </motion.div>
  );
};

const MiniAction = ({ icon, color, bg, onClick }: { icon: React.ReactNode, color: string, bg: string, onClick?: (e: React.MouseEvent) => void }) => (
    <motion.button
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`${bg} ${color} w-11 h-11 rounded-full flex items-center justify-center shadow-sm border border-border-base transition-all hover:shadow-md cursor-pointer`}
    >
      {icon}
    </motion.button>
  );
  
