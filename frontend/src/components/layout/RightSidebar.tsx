import { useState, useEffect, type FC } from 'react';
import {
  MapPin, TrendingUp, Users, Footprints,
  Star, ChevronRight,
  UserPlus, Heart, PlayCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { useMyProfile } from '../../hooks/useUserData';

interface RightSidebarProps {
  crossingsToday?: number;
  nearbyCount?: number;
  storiesCount?: number;
  isSyncing?: boolean;
}

const RightSidebar: FC<RightSidebarProps> = ({
  crossingsToday = 0,
  nearbyCount = 0,
  storiesCount = 0
}) => {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await api.get('/connections/suggested');
      setSuggestions((res.data || []).slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      setSuggestions(prev => prev.map(u => u.id === userId ? { ...u, requested: true } : u));
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const navigateToExplore = (tab: string) => {
    navigate(`/dashboard/explore?tab=${tab}`);
  };

  return (
    <aside className="h-full flex flex-col overflow-y-auto no-scrollbar pt-6 pb-8 px-6 gap-8 bg-bg-sidebar/30 backdrop-blur-sm">
      
      {/* ── User Profile Header ── */}
      <div 
        onClick={() => navigate(`/dashboard/profile/${profile?.id}`)}
        className="flex items-center gap-4 p-3 rounded-[24px] hover:bg-white dark:hover:bg-bg-base/40 border border-transparent hover:border-border-base transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all shadow-lg shadow-primary/10">
          <img 
            src={getMediaUrl(profile?.avatar_url, FALLBACKS.AVATAR(profile?.username))} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-black text-text-base leading-tight truncate">
            {profile?.full_name || 'Set your name'}
          </span>
          <span className="text-[12px] font-bold text-text-muted mt-0.5 truncate opacity-70">
            @{profile?.username || 'user'}
          </span>
        </div>
      </div>

      {/* ── Suggested for you (Functional) ── */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <h3 className="text-[14px] font-black text-text-base italic">Suggested</h3>
          </div>
          <button
            onClick={() => navigateToExplore('all')}
            className="text-[11px] font-black text-primary hover:bg-primary/5 px-2 py-1 rounded-lg transition-all uppercase tracking-wider"
          >
            See all
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {isLoadingSuggestions ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-bg-base/50 rounded-2xl animate-pulse" />
            ))
          ) : suggestions.length > 0 ? (
            <AnimatePresence>
              {suggestions.map((u) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white dark:hover:bg-bg-base border border-transparent hover:border-border-base transition-all group"
                >
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/dashboard/profile/${u.id}`)}>
                    <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-border-base/50 group-hover:border-primary/30 transition-colors">
                      <img src={getMediaUrl(u.avatar_url, FALLBACKS.AVATAR(u.username))} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-text-base leading-none group-hover:text-primary transition-colors">@{u.username}</span>
                      <span className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-tight opacity-70">
                        {u.distance_km < 1 ? `${(u.distance_km * 1000).toFixed(0)}m` : `${u.distance_km?.toFixed(1)}km`} away
                      </span>
                    </div>
                  </div>
                  {u.requested ? (
                    <div className="px-3 py-1.5 bg-bg-base rounded-xl text-[9px] font-black text-text-muted uppercase tracking-widest border border-border-base">Sent</div>
                  ) : (
                    <button
                      onClick={() => handleConnect(u.id)}
                      className="w-10 h-10 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl transition-all active:scale-90 flex items-center justify-center border border-primary/10 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-8 text-center bg-bg-base/30 rounded-[24px] border border-dashed border-border-base/50">
              <Users className="w-8 h-8 text-text-muted/20 mx-auto mb-2" />
              <p className="text-[11px] font-bold text-text-muted">No suggestions right now</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats Grid (Modern Redesign) ── */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Nearby"
          count={nearbyCount}
          icon={<MapPin className="w-4 h-4" />}
          color="pink"
          onClick={() => navigateToExplore('nearby')}
        />
        <StatCard
          label="Stories"
          count={storiesCount}
          icon={<PlayCircle className="w-4 h-4" />}
          color="purple"
          onClick={() => navigateToExplore('stories')}
        />
        <StatCard
          label="Crossings"
          count={crossingsToday}
          icon={<Footprints className="w-4 h-4" />}
          color="emerald"
          onClick={() => navigateToExplore('crossings')}
        />
        <StatCard
          label="Saved"
          count={profile?.saved_count || 0}
          icon={<Star className="w-4 h-4" />}
          color="amber"
          onClick={() => navigate(`/dashboard/saved`)}
        />
      </div>



      {/* ── Trending Circles (Functional Redesign) ── */}
      <div className="flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h3 className="text-[14px] font-black text-text-base italic">Trending</h3>
          </div>
          <button onClick={() => navigate('/dashboard/explore')} className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider">See all</button>
        </div>

        <div className="space-y-2">
          <TrendingItem emoji="📸" title="Photography" members="12.5k" color="pink" onClick={() => navigate('/dashboard/search?q=Photography')} />
          <TrendingItem emoji="✈️" title="Travel Diaries" members="8.2k" color="blue" onClick={() => navigate('/dashboard/search?q=Travel')} />
          <TrendingItem emoji="🍕" title="Food Lovers" members="15.3k" color="orange" onClick={() => navigate('/dashboard/search?q=Food')} />
          <TrendingItem emoji="🎵" title="Music Vibes" members="9.1k" color="purple" onClick={() => navigate('/dashboard/search?q=Music')} />
        </div>
      </div>

      {/* ── Popular Nearby (Premium Card) ── */}
      <div className="relative group cursor-pointer" onClick={() => navigateToExplore('heatmap')}>
        <div className="absolute inset-0 bg-brand-gradient blur-xl opacity-0 group-hover:opacity-10 transition-opacity rounded-[24px]" />
        <div className="relative bg-white dark:bg-bg-base/40 backdrop-blur-md border border-border-base/50 rounded-[24px] p-5 shadow-sm group-hover:border-primary/20 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[2px]">Hotspot Nearby</p>
          </div>
          <p className="text-[12px] font-bold text-text-base leading-relaxed">
            Most connections happen at <span className="text-primary italic">"The Central Square"</span> this weekend.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest group-hover:gap-2.5 transition-all">
            <span>View Heatmap</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          </div>
        </div>
      </div>

    </aside>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────────

const StatCard = ({ label, count, icon, color, onClick }: { label: string; count: number; icon: React.ReactNode; color: string; onClick: () => void }) => {
  const colors: Record<string, string> = {
    pink: 'bg-pink-500/10 text-pink-500 border-pink-500/20 shadow-pink-500/5',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/5',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/5',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`bg-white dark:bg-bg-base/20 rounded-[24px] border border-border-base p-4 shadow-sm cursor-pointer transition-all hover:shadow-xl hover:border-primary/20 group relative overflow-hidden`}
    >
      <div className={`w-9 h-9 ${colors[color].split(' ')[0]} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <span className={colors[color].split(' ')[1]}>{icon}</span>
      </div>
      <p className="text-[10px] font-black text-text-muted uppercase tracking-[1.5px] mb-1 opacity-70 leading-none">{label}</p>
      <span className="text-[24px] font-medium text-text-base leading-none tracking-tighter">{count}</span>
    </motion.div>
  );
};

const TrendingItem = ({ emoji, title, members, color, onClick }: { emoji: string; title: string; members: string; color: string; onClick: () => void }) => {
  const colors: Record<string, string> = {
    pink: 'bg-pink-500/10 text-pink-600',
    blue: 'bg-blue-500/10 text-blue-600',
    orange: 'bg-orange-500/10 text-orange-600',
    purple: 'bg-purple-500/10 text-purple-600',
  };

  return (
    <motion.div
      whileHover={{ x: 6 }}
      onClick={onClick}
      className="flex items-center gap-3.5 cursor-pointer group py-2.5 px-3 rounded-[20px] hover:bg-white dark:hover:bg-bg-base border border-transparent hover:border-border-base transition-all"
    >
      <div className={`w-11 h-11 rounded-2xl ${colors[color].split(' ')[0]} flex items-center justify-center text-[20px] flex-shrink-0 group-hover:rotate-12 transition-transform shadow-sm`}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-black text-text-base leading-tight truncate group-hover:text-primary transition-colors italic">{title}</p>
        <p className="text-[11px] text-text-muted font-bold opacity-60 mt-0.5">{members} members</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-bg-base flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
        <ChevronRight className="w-4 h-4 text-primary stroke-[3]" />
      </div>
    </motion.div>
  );
};

export default RightSidebar;
