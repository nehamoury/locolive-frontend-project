import React from 'react';
import { motion } from 'framer-motion';
import CastingCard from '../../casting/CastingCard';
import { RefreshCcw, Users } from 'lucide-react';

interface ExploreNearbyUsersProps {
  users: any[];
  loading: boolean;
  onUserSelect?: (id: string) => void;
  onRefresh: () => void;
}

export const ExploreNearbyUsers: React.FC<ExploreNearbyUsersProps> = ({ 
  users, 
  loading, 
  onUserSelect,
  onRefresh
}) => {
  if (loading && users.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/5] bg-bg-card rounded-[40px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500/10 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-text-base">Nearby Now</h2>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{users.length} people in your area</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="p-3.5 bg-bg-card hover:bg-bg-sidebar border border-border-base rounded-2xl transition-all active:rotate-180 duration-500"
        >
          <RefreshCcw className="w-5 h-5 text-text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, idx) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <CastingCard 
              user={user}
              onMatch={() => {}}
              onPass={() => {}}
              onViewProfile={onUserSelect || (() => {})}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
