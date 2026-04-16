import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Users, Zap, ChevronUp, ChevronDown } from 'lucide-react';

interface MapFiltersProps {
  onFilterChange: (filters: any) => void;
  activeFilters: any;
}

export const MapFilters: React.FC<MapFiltersProps> = ({ onFilterChange, activeFilters }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleFilter = (key: string, value: any) => {
    onFilterChange({
      ...activeFilters,
      [key]: activeFilters[key] === value ? null : value
    });
  };

  return (
    <div className="absolute top-24 left-6 z-[600] flex flex-col items-start gap-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-5 py-3 bg-bg-base/95 backdrop-blur-2xl border border-border-base rounded-2xl shadow-xl hover:bg-bg-base transition-all group cursor-pointer"
      >
        <Filter className={`w-4 h-4 ${isOpen ? 'text-primary' : 'text-text-muted group-hover:text-primary transition-colors'}`} />
        <span className="text-[11px] font-black text-text-base uppercase tracking-widest">Filters</span>
        {isOpen ? <ChevronUp className="w-3 h-3 text-text-muted" /> : <ChevronDown className="w-3 h-3 text-text-muted" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.95 }}
            className="flex flex-col gap-2 p-3 bg-bg-base/90 backdrop-blur-2xl border border-border-base rounded-[24px] shadow-2xl min-w-[180px]"
          >
            {/* Distance Filter */}
            <div className="px-3 pt-2 pb-1 text-[9px] font-black text-text-muted/40 uppercase tracking-[2px]">Distance</div>
            <div className="grid grid-cols-3 gap-1 px-1 pb-2">
              {[1, 5, 10].map((d) => (
                <button
                  key={d}
                  onClick={() => toggleFilter('distance', d)}
                  className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                    activeFilters.distance === d 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-text-muted hover:bg-bg-sidebar'
                  }`}
                >
                  {d}km
                </button>
              ))}
            </div>

            <div className="h-px bg-border-base mx-2" />

            {/* Online Status */}
            <button
              onClick={() => toggleFilter('isOnline', true)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                activeFilters.isOnline ? 'bg-green-500/10 text-green-500' : 'text-text-muted hover:bg-bg-sidebar'
              }`}
            >
              <Zap className={`w-4 h-4 ${activeFilters.isOnline ? 'text-green-500 fill-green-500' : 'text-text-muted/40'}`} />
              <span className="text-xs font-black italic tracking-tight">Active Now</span>
            </button>

            {/* Stories Only */}
            <button
              onClick={() => toggleFilter('hasStories', true)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                activeFilters.hasStories ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-sidebar'
              }`}
            >
              <Users className={`w-4 h-4 ${activeFilters.hasStories ? 'text-primary fill-primary' : 'text-text-muted/40'}`} />
              <span className="text-xs font-black italic tracking-tight">Has Stories</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
