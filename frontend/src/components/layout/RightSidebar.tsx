import { type FC } from 'react';
import { MapPin, TrendingUp, Users, Compass, Footprints, ArrowRight, Star, Sparkles, Sun, Moon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface RightSidebarProps {
  crossingsToday?: number;
  nearbyCount?: number;
  storiesCount?: number;
  isSyncing?: boolean;
}

const RightSidebar: FC<RightSidebarProps> = ({ 
  crossingsToday = 14, 
  nearbyCount = 0, 
  storiesCount = 0
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="h-full bg-bg-sidebar flex flex-col overflow-y-auto no-scrollbar font-brand transition-colors duration-300">
      
      {/* Top bar: Theme toggle (always visible, won't collapse) */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border-base sticky top-0 z-10 bg-bg-sidebar backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span className="text-[10px] font-black text-text-muted uppercase tracking-[2px]">Live</span>
        </div>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg-base border border-border-base text-text-muted hover:text-primary hover:border-primary/30 transition-all shadow-sm cursor-pointer"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-col gap-6 p-5">

        {/* Fast Connect Widget */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-brand-gradient rounded-[28px] p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-white/80" />
              <h3 className="text-lg font-black italic tracking-tighter">Fast Connect</h3>
            </div>
            <p className="text-xs font-medium text-white/75 leading-snug">Instantly match with people attending the same events today.</p>
            <button className="mt-1 w-full py-3 bg-white text-primary font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-sm">
              Discover Matches
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Nearby" count={nearbyCount} icon={<Users size={16} className="text-primary" />} color="bg-primary/5 border-primary/10" />
          <StatCard label="Stories" count={storiesCount} icon={<Sparkles size={16} className="text-secondary" />} color="bg-secondary/5 border-secondary/10" />
          <StatCard label="Crossings" count={crossingsToday} icon={<Footprints size={16} className="text-[#20C997]" />} color="bg-[#20C997]/5 border-[#20C997]/10" />
          <StatCard label="Saved" count={0} icon={<Star size={16} className="text-amber-500" />} color="bg-amber-50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/10" />
        </div>

        {/* Trending Circles */}
        <div className="bg-bg-card rounded-[24px] border border-border-base p-5 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-[13px] font-black text-text-base italic">Trending Circles</h3>
          </div>
          <div className="flex flex-col gap-4">
            <TrendingItem icon="🎨" title="Art & Design" members="1.2k" color="bg-pink-100 dark:bg-pink-500/10" />
            <TrendingItem icon="🍴" title="Foodie Explorers" members="850" color="bg-red-100 dark:bg-red-500/10" />
            <TrendingItem icon="🏋️" title="Fitness Hub" members="2.4k" color="bg-purple-100 dark:bg-purple-500/10" />
          </div>
        </div>

        {/* Popular Nearby */}
        <div className="bg-bg-card rounded-[24px] border border-border-base p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Compass className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[13px] font-black text-text-base italic leading-tight">Popular Nearby</h3>
              <p className="text-[10px] text-text-muted font-medium">This weekend's hotspot</p>
            </div>
          </div>

          <div className="aspect-video bg-bg-base rounded-xl overflow-hidden relative border border-border-base">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400&h=200" 
              className="w-full h-full object-cover grayscale opacity-50" 
              alt="Popular location" 
            />
            <div className="absolute inset-0 bg-brand-gradient/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>

          <p className="text-xs font-medium text-text-muted leading-relaxed">
            Most connections happen at <span className="font-black text-text-base">"The Central Square"</span> this weekend.
          </p>

          <button className="flex items-center gap-2 text-[11px] font-black text-primary uppercase tracking-widest group hover:translate-x-1 transition-transform cursor-pointer">
            View Heatmap <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>
    </aside>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StatCard = ({ label, count, icon, color }: { label: string, count: number, icon: React.ReactNode, color: string }) => (
  <div className={`flex flex-col gap-1.5 p-4 border rounded-2xl ${color} transition-all hover:-translate-y-0.5 hover:shadow-sm`}>
    <div className="flex items-center gap-1.5 text-text-muted">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-2xl font-black text-text-base italic">{count}</span>
  </div>
);

const TrendingItem = ({ icon, title, members, color }: { icon: string, title: string, members: string, color: string }) => (
  <motion.div 
    whileHover={{ x: 4 }}
    className="flex items-center gap-3 group cursor-pointer"
  >
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-all`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <span className="text-[13px] font-black text-text-base leading-tight italic">{title}</span>
      <span className="text-[10px] font-medium text-text-muted">{members} members active</span>
    </div>
  </motion.div>
);

export default RightSidebar;
