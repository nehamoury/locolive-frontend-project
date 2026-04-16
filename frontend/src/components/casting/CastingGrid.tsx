import { type FC } from 'react';
import { motion } from 'framer-motion';
import CastingCard from './CastingCard';

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

interface CastingGridProps {
  users: CastingUser[];
  onMatch: (id: string) => void;
  onPass: (id: string) => void;
  onViewProfile: (id: string) => void;
  loading: boolean;
}

const CastingGrid: FC<CastingGridProps> = ({ users, onMatch, onPass, onViewProfile, loading }) => {
  if (loading) {
    return (
      <div className="mobile-card-grid mobile-padding py-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-[40px] p-4 shadow-sm border border-gray-50 flex flex-col gap-4 animate-pulse">
            <div className="aspect-square rounded-[32px] bg-gray-100" />
            <div className="space-y-2 px-1">
              <div className="h-4 bg-gray-100 rounded-md w-3/4" />
              <div className="h-3 bg-gray-100 rounded-md w-1/2" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-100 rounded-xl flex-1" />
              <div className="h-10 bg-gray-100 rounded-xl w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center"
      >
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">✨</span>
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-900 tracking-tight">No users nearby</h3>
        <p className="text-gray-400 max-w-sm mb-8 text-sm">
          Try expanding your search or refreshing the list to find new people in your area.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
        >
          Refresh List
        </button>
      </motion.div>
    );
  }

  return (
    <div className="mobile-card-grid mobile-padding py-6 pb-24">
      {users.map((user, index) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <CastingCard
            user={user}
            onMatch={onMatch}
            onPass={onPass}
            onViewProfile={onViewProfile}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default CastingGrid;
