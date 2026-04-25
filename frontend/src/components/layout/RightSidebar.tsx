import { useState, useEffect, type FC } from 'react';
import { MapPin, TrendingUp, Users, Footprints, Star, Sparkles, Zap, ChevronRight, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

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
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/connections/suggested');
      // Limit to 3 for sidebar
      setSuggestions((res.data || []).slice(0, 3));
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
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

  return (
    <aside className="h-full flex flex-col overflow-y-auto no-scrollbar pt-6 pb-8 px-6 gap-6">

      {/* ── Snap Match Card ── */}
      <motion.div
        whileHover={{ y: -3, boxShadow: '0 20px 40px -10px rgba(255,59,142,0.35)' }}
        transition={{ duration: 0.25 }}
        className="bg-gradient-to-br from-[#FF3B8E] via-[#C94FD8] to-[#7B2FBE] rounded-[22px] p-5 text-white relative overflow-hidden shadow-xl shadow-pink-500/20 flex-shrink-0 cursor-pointer"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-2 w-16 h-16 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-[16px] font-black leading-tight mb-1.5 tracking-tight">Snap Match</h3>
          <p className="text-white/70 text-[12px] leading-relaxed mb-4 font-medium">Find and connect with people attending the same events.</p>
          <button className="w-full py-2.5 bg-white rounded-[14px] font-black text-[12px] text-[#C84FD8] hover:bg-pink-50 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
            Find Matches <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* ── Suggested for you ── */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-black text-slate-800">Suggested for you</h3>
            <button className="text-[11px] font-bold text-primary hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {suggestions.map((u) => (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100">
                      <img src={getMediaUrl(u.avatar_url, FALLBACKS.AVATAR(u.username))} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-slate-800 leading-none">@{u.username}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{u.distance_km?.toFixed(1) || '0.5'}km away</span>
                    </div>
                  </div>
                  {u.requested ? (
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sent</span>
                  ) : (
                    <button
                      onClick={() => handleConnect(u.id)}
                      className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Nearby" count={nearbyCount} icon={<MapPin className="w-3.5 h-3.5 text-[#FF3B8E]" />} iconBg="bg-pink-50" countColor="text-[#1A202C]" />
        <StatCard label="Stories" count={storiesCount} icon={<Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />} iconBg="bg-purple-50" countColor="text-[#1A202C]" />
        <StatCard label="Crossings" count={crossingsToday} icon={<Footprints className="w-3.5 h-3.5 text-[#10B981]" />} iconBg="bg-emerald-50" countColor="text-[#1A202C]" />
        <StatCard label="Saved" count={0} icon={<Star className="w-3.5 h-3.5 text-[#F59E0B]" />} iconBg="bg-amber-50" countColor="text-[#1A202C]" />
      </div>

      {/* ── Trending Circles ── */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF3B8E]" />
            <h3 className="text-[14px] font-black text-slate-800">Trending Circles</h3>
          </div>
          <button className="text-[12px] font-semibold text-[#FF3B8E] hover:text-pink-700 transition-colors cursor-pointer">See all</button>
        </div>

        <div className="space-y-1">
          <TrendingItem emoji="📸" title="Photography" members="12.5k" color="bg-pink-100" />
          <TrendingItem emoji="✈️" title="Travel Diaries" members="8.2k" color="bg-sky-100" />
          <TrendingItem emoji="🍕" title="Food Lovers" members="15.3k" color="bg-orange-100" />
          <TrendingItem emoji="🎵" title="Music Vibes" members="9.1k" color="bg-violet-100" />
        </div>
      </div>

      {/* ── Popular Nearby (Compact) ── */}
      <div className="bg-white rounded-[18px] border border-slate-100 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Popular Nearby</p>
        </div>
        <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
          Most connections happen at <span className="font-black text-slate-900">"The Central Square"</span> this weekend.
        </p>
      </div>

    </aside>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────────

const StatCard = ({ label, count, icon, iconBg, countColor }: { label: string; count: number; icon: React.ReactNode; iconBg: string; countColor: string }) => (
  <div className="bg-white rounded-[18px] border border-slate-100/80 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
    <div className={`w-7 h-7 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[1.5px] mb-0.5">{label}</p>
    <span className={`text-[22px] font-black ${countColor} leading-none`}>{count}</span>
  </div>
);

const TrendingItem = ({ emoji, title, members, color }: { emoji: string; title: string; members: string; color: string }) => (
  <motion.div
    whileHover={{ x: 4 }}
    transition={{ duration: 0.15 }}
    className="flex items-center gap-3 cursor-pointer group py-2 px-2 rounded-xl hover:bg-slate-50 transition-colors"
  >
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-[16px] flex-shrink-0 group-hover:scale-110 transition-transform`}>
      {emoji}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-slate-800 leading-tight truncate">{title}</p>
      <p className="text-[11px] text-slate-400 font-medium">{members} members</p>
    </div>
    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#FF3B8E] transition-colors flex-shrink-0" />
  </motion.div>
);

export default RightSidebar;
