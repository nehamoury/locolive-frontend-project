import React from 'react';
import { motion } from 'framer-motion';
import { X, Heart, ExternalLink, Zap, PlayCircle } from 'lucide-react';
import { BACKEND } from '../../utils/config';

interface UserPreviewCardProps {
  user: any;
  isConnection?: boolean;
  onClose: () => void;
  onConnect: (userId: string) => void;
  onProfileOpen: (userId: string) => void;
  onStoryOpen?: (stories: any[]) => void;
}

export const UserPreviewCard: React.FC<UserPreviewCardProps> = ({ user, isConnection, onClose, onConnect, onProfileOpen, onStoryOpen }) => {
  if (!user) return null;

  const userData = user.stories?.[0] || user;
  const avatar = userData.avatar_url 
    ? (userData.avatar_url.startsWith('http') ? userData.avatar_url : `${BACKEND}${userData.avatar_url}`) 
    : null;
    

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-sm px-4 pointer-events-auto"
    >
      <div className="bg-bg-card/80 backdrop-blur-3xl border border-border-base rounded-[40px] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] relative overflow-hidden transition-colors duration-300">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 blur-[60px] rounded-full" />

        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 h-10 w-10 flex items-center justify-center bg-bg-sidebar/50 hover:bg-bg-sidebar rounded-full text-text-muted transition-all active:scale-90 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center relative z-10">
          <div 
            className="relative group px-1 pt-1 pb-1 cursor-pointer"
            onClick={() => user.stories?.length > 0 && onStoryOpen?.(user.stories)}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-accent mb-5 relative">
              <div className="w-full h-full rounded-full bg-bg-card overflow-hidden flex items-center justify-center border-4 border-bg-card shadow-xl">
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="" />
                ) : (
                  <span className="text-3xl font-black text-primary italic">{(userData.username || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              
              {/* Online Indicator Badge */}
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-bg-card rounded-full shadow-lg" />
              
              {/* Story Pulse Effect */}
              {user.stories?.length > 0 && (
                <div className="absolute -inset-1 border-2 border-primary rounded-full animate-ping opacity-40" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-2xl font-black text-text-base italic tracking-tight translate-x-1">@{userData.username}</h3>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>

          <div 
            onClick={() => user.stories?.length > 0 && onStoryOpen?.(user.stories)}
            className="flex items-center gap-1.5 text-[10px] font-black text-white px-3 py-1 bg-primary rounded-full uppercase tracking-widest mb-8 cursor-pointer hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            {user.isUserOnly ? 'Live Moment' : `${user.count} Stories`}
          </div>
          
          <div className="flex gap-4 w-full">
            {isConnection ? (
              <div 
                className="flex-1 py-4 bg-bg-sidebar text-text-muted font-black italic rounded-[24px] flex items-center justify-center gap-2 group cursor-default"
              >
                <Heart className="w-4 h-4 fill-primary text-primary" /> 
                <span>Connected</span>
              </div>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onConnect(userData.user_id || userData.id)}
                className="flex-1 py-4 bg-primary text-white font-black italic rounded-[24px] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Heart className="w-4 h-4 transition-transform group-hover:scale-125" /> 
                <span>Like</span>
              </motion.button>
            )}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onProfileOpen(userData.user_id || userData.id)}
              className="flex-1 py-4 bg-bg-card/50 border border-border-base text-text-base font-black italic rounded-[24px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm hover:bg-bg-sidebar cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Profile</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
