import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Zap, ChevronUp, ChevronDown } from 'lucide-react';

interface MapFilterState {
  distance: number | null;
  isOnline: boolean;
  hasStories: boolean;
  [key: string]: unknown;
}

interface MapFiltersProps {
  onFilterChange: (filters: MapFilterState) => void;
  activeFilters: MapFilterState;
}

export const MapFilters: React.FC<MapFiltersProps> = ({ onFilterChange, activeFilters }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleFilter = (key: string, value: unknown) => {
    onFilterChange({
      ...activeFilters,
      [key]: activeFilters[key] === value ? null : value
    });
  };

  return (
    <div className="absolute bottom-4 right-4 z-[600] flex flex-col-reverse items-end gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-6 py-3.5 bg-bg-base/90 backdrop-blur-3xl border border-white/10 rounded-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-bg-base transition-all group cursor-pointer"
      >
        <Filter className={`w-4 h-4 ${isOpen ? 'text-primary' : 'text-text-muted group-hover:text-primary transition-colors'}`} />
        <span className="text-[11px] font-black text-text-base uppercase tracking-widest ">Filters</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="filters-content"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="flex flex-col gap-1.5 p-3 bg-bg-base/80 backdrop-blur-3xl border border-white/20 rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.3)] w-40"
          >
            {/* Distance Filter */}
            <div className="px-2 pt-1 pb-1 text-[8px] font-black text-text-muted/60 uppercase tracking-[2px]">Range</div>
            <div className="flex gap-1 p-0.5 bg-black/5 rounded-xl border border-black/5">
              {[1, 5, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => toggleFilter('distance', d)}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                    activeFilters.distance === d 
                    ? 'bg-text-base text-bg-base shadow-sm' 
                    : 'text-text-muted hover:bg-black/5'
                  }`}
                >
                  {d}km
                </button>
              ))}
            </div>

            <div className="h-px bg-black/5 my-1 mx-2" />

            {/* Quick Toggles */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => toggleFilter('isOnline', true)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                  activeFilters.isOnline 
                  ? 'bg-green-500/10 border-green-500/20 text-green-500' 
                  : 'bg-transparent border-transparent text-text-muted hover:bg-black/5'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeFilters.isOnline ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-text-muted/30'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Active</span>
              </button>

              <button
                onClick={() => toggleFilter('hasStories', true)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all cursor-pointer border ${
                  activeFilters.hasStories 
                  ? 'bg-primary/10 border-primary/20 text-primary' 
                  : 'bg-transparent border-transparent text-text-muted hover:bg-black/5'
                }`}
              >
                <Zap className={`w-3 h-3 ${activeFilters.hasStories ? 'text-primary fill-primary' : 'text-text-muted/40'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Stories</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
