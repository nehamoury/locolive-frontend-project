import React, { useState, useEffect } from 'react';
import { Settings, Grid3x3, Heart, Bookmark, Star, Plus, Share2, BadgeCheck, Clapperboard, Tags, Play } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import EditProfileModal from './EditProfileModal';
import { nullString } from '../../utils/string';
import { BACKEND } from '../../utils/config';

interface ProfileViewProps {
  onLogout?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'tagged'>('posts');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, postsRes, highlightsRes] = await Promise.all([
          api.get('/profile/me'),
          api.get('/posts/me'),
          api.get('/highlights/me'),
        ]);
        setProfile(profileRes.data);
        setMyPosts(postsRes.data?.posts || []);
        setHighlights(highlightsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  const displayProfile = profile || user;

  const tabs = [
    { key: 'posts' as const, icon: Grid3x3, label: 'Posts' },
    { key: 'reels' as const, icon: Clapperboard, label: 'Reels' },
    { key: 'saved' as const, icon: Bookmark, label: 'Saved' },
    { key: 'tagged' as const, icon: Tags, label: 'Tagged' },
  ];

  return (
    <div className="h-full bg-[#F2F5F8] text-slate-900 overflow-y-auto no-scrollbar pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto px-6 py-10">
        
        {loading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            
            {/* ── Avatar Section ──────────────────────────────── */}
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-[#FF3B8E] via-[#FF8C3B] to-[#9D3BFF] shadow-[0_10px_30px_rgba(255,59,142,0.3)]">
                <div className="w-full h-full rounded-full bg-white p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                    {nullString(displayProfile?.avatar_url) ? (
                      <img
                        src={nullString(displayProfile.avatar_url).startsWith('http') ? nullString(displayProfile.avatar_url) : `${BACKEND}${nullString(displayProfile.avatar_url)}`}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-black text-slate-300 uppercase italic">
                        {displayProfile?.username?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* Online Indicator */}
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-[#F2F5F8] rounded-full shadow-sm" />
            </div>

            {/* ── Username & Identity ─────────────────────────── */}
            <div className="flex items-center gap-1.5 mb-6">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {displayProfile?.username || 'neha630'}
              </h1>
              <BadgeCheck className="w-6 h-6 text-sky-500 fill-sky-500/10" />
            </div>

            {/* ── Action Buttons ──────────────────────────────── */}
            <div className="flex items-center gap-3 mb-10 w-full max-w-xs">
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex-1 py-3.5 bg-white border border-white/50 rounded-2xl text-sm font-bold text-slate-700 shadow-[6px_6px_12px_rgba(0,0,0,0.05),-6px_-6px_12px_rgba(255,255,255,0.8)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Edit Profile
              </button>
              <button className="w-12 h-12 flex items-center justify-center bg-white border border-white/50 rounded-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.8)] hover:text-primary transition-all active:scale-90">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="w-12 h-12 flex items-center justify-center bg-white border border-white/50 rounded-2xl shadow-[4px_4px_10px_rgba(0,0,0,0.05),-4px_-4px_10px_rgba(255,255,255,0.8)] hover:text-primary transition-all active:scale-90">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* ── Stats Section ──────────────────────────────── */}
            <div className="grid grid-cols-4 w-full mb-10 bg-white/40 backdrop-blur-sm rounded-[32px] p-6 border border-white/60 shadow-sm">
              <div className="flex flex-col items-center gap-1 border-r border-slate-200/50">
                <span className="text-lg font-black text-slate-900 tracking-tight">{myPosts.length}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Posts</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-r border-slate-200/50">
                <span className="text-lg font-black text-slate-900 tracking-tight">{profile?.followers_count || 0}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Followers</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-r border-slate-200/50">
                <span className="text-lg font-black text-slate-900 tracking-tight">{profile?.following_count || 0}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Following</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg font-black text-primary tracking-tight">12</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Streak</span>
              </div>
            </div>

            {/* ── Bio Section ────────────────────────────────── */}
            <div className="text-center mb-10">
              <p className="text-base font-bold text-slate-700 tracking-tight">
                {nullString(displayProfile?.bio) || 'neha'}
              </p>
            </div>

            {/* ── Story Highlights ────────────────────────────── */}
            <div className="w-full mb-10 overflow-x-auto no-scrollbar">
              <div className="flex gap-6 px-2">
                {/* New Highlight Button */}
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <button className="w-18 h-18 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-white/50 hover:bg-white transition-all group">
                    <Plus className="w-7 h-7 text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all" />
                  </button>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New</span>
                </div>
                
                {highlights.map((h: any) => (
                  <div key={h.id} className="flex flex-col items-center gap-2 flex-shrink-0">
                    <div className="w-18 h-18 rounded-full border-2 border-white shadow-sm p-0.5 bg-slate-200 overflow-hidden">
                      {h.cover_url ? (
                        <img src={`${BACKEND}${h.cover_url}`} alt={h.title} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <Star className="w-7 h-7 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate max-w-[72px]">{h.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tabs Navigation ────────────────────────────── */}
            <div className="w-full flex items-center justify-between border-b border-slate-200 mb-6">
              {tabs.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative ${activeTab === key ? 'text-primary' : 'text-slate-400'}`}
                >
                  <Icon className={`w-6 h-6 transition-transform ${activeTab === key ? 'scale-110' : 'hover:scale-105'}`} />
                  {activeTab === key && (
                    <motion.div
                      layoutId="profileTabUnderline"
                      className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(255,59,142,0.4)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ── Content Grid ───────────────────────────────── */}
            <div className="w-full grid grid-cols-3 gap-3">
              {activeTab === 'posts' && (
                myPosts.length > 0 ? (
                  myPosts.map((post: any) => (
                    <div key={post.id} className="aspect-square rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group">
                      {post.media_type === 'text' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white to-slate-100 p-3 border border-white/50">
                          <p className="text-[10px] font-bold text-slate-500 line-clamp-4 text-center italic">{nullString(post.caption)}</p>
                        </div>
                      ) : post.media_type === 'video' ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                          <img 
                            src={getMediaUrl(post.media?.[0]?.thumbnail_url || '')} 
                            alt="" 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Play className="w-8 h-8 fill-white/80 text-white/80" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={getMediaUrl(post.media_url)} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-1 text-white font-black">
                          <Heart className="w-4 h-4 fill-white" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 py-20 text-center opacity-40 italic font-bold text-slate-400">No posts yet</div>
                )
              )}
              {activeTab !== 'posts' && (
                <div className="col-span-3 py-20 text-center opacity-40 italic font-bold text-slate-400">No {activeTab} available</div>
              )}
            </div>

          </div>
        )}
      </div>

      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  );
};

export default ProfileView;
