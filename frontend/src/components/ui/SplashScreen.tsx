import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-bg-base relative overflow-hidden transition-colors duration-300">
      {/* Soft background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      
      {/* Central Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 z-10"
      >
        <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/30 relative">
          <MapPin className="w-10 h-10 text-white" />
          {/* Subtle pulse ring */}
          <div className="absolute inset-0 border-2 border-primary rounded-[24px] animate-ping opacity-40" />
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-3xl font-bold text-text-base tracking-tight"
        >
          Locolive
        </motion.h1>
      </motion.div>

      {/* Bottom Branding (Instagram Style) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-12 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">from</span>
        <span className="text-sm font-bold text-primary tracking-widest uppercase">Appnity</span>
      </motion.div>

      {/* Loading Progress Bar at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-border-base/20">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-full bg-primary"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
