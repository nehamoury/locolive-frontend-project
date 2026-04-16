import React, { useState, useEffect } from 'react';
import { Settings, Grid3x3, Heart, Bookmark, Footprints, Star, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import EditProfileModal from './EditProfileModal';
import { nullString } from '../../utils/string';

interface ProfileViewProps {
  onLogout?: () => void;
}

import { BACKEND } from '../../utils/config';

const ProfileView: React.FC<ProfileViewProps> = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [myStories, setMyStories] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [archivedStories, setArchivedStories] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'archived' | 'visitors'>('posts');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profileRes, storiesRes, postsRes, archivedRes, highlightsRes, visitorsRes] = await Promise.all([
          api.get('/profile/me'),
          api.get('/stories/me'),
          api.get('/posts/me'),
          api.get('/stories/archived'),
          api.get('/highlights/me'),
          api.get('/profile/visitors'),
        ]);
        setProfile(profileRes.data);
        setMyStories(storiesRes.data || []);
        setMyPosts(postsRes.data?.posts || []);
        setArchivedStories(archivedRes.data?.archives || archivedRes.data || []);
        setHighlights(highlightsRes.data || []);
        setVisitors(visitorsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();

    const handleRefresh = () => {
      console.log('Refreshing profile due to connection update...');
      fetchAll();
    };

    window.addEventListener('connection_accepted', handleRefresh);
    return () => window.removeEventListener('connection_accepted', handleRefresh);
  }, [user]);

  const displayProfile = profile || user;

  const tabs = [
    { key: 'posts' as const, label: 'Posts', icon: Grid3x3 },
    { key: 'stories' as const, label: 'Stories', icon: Star },
    { key: 'archived' as const, label: 'Archive', icon: Bookmark },
    { key: 'visitors' as const, label: 'Visitors', icon: Footprints },
  ];

  return (
    <div className="h-full bg-[#f9e8ff] text-black overflow-y-auto no-scrollbar pb-24 md:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold tracking-tight text-black">@{displayProfile?.username || 'username'}</h1>
          <button
            onClick={() => setIsEditOpen(true)}
            className="p-2 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors border border-primary/10"
          >
            <Settings className="w-5 h-5 text-black/40" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Profile Card ───────────────────────────────── */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-white flex items-center justify-center shadow-xl shadow-primary/20 mb-4 overflow-hidden">
                {displayProfile?.avatar_url ? (
                  <img
                    src={displayProfile.avatar_url.startsWith('http') ? displayProfile.avatar_url : `${BACKEND}${displayProfile.avatar_url}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{displayProfile?.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <h2 className="text-lg font-bold mb-1 tracking-tight text-black">{displayProfile?.full_name || 'User'}</h2>
              <p className="text-black/60 font-medium text-sm mb-2">@{displayProfile?.username || 'username'}</p>
              {displayProfile?.bio && (
                <p className="text-xs text-black/40 max-w-xs mb-3">{displayProfile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex space-x-8 mt-2">
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-slate-900">{myPosts.length}</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">Posts</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-slate-900">{myStories.length}</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">Stories</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold text-slate-900">{profile?.connection_count || 0}</span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">Following</span>
                </div>
              </div>

              <button
                onClick={() => setIsEditOpen(true)}
                className="mt-4 px-6 py-2 bg-primary/10 rounded-lg text-xs font-bold text-black hover:bg-primary/20 transition-colors border border-primary/10"
              >
                Edit Profile
              </button>
            </div>

            {/* ── Highlights Row ─────────────────────────────── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-black/40 uppercase tracking-widest">Highlights</p>
                <button
                  onClick={async () => {
                    const title = prompt('Highlight name:');
                    if (!title) return;
                    try {
                      const res = await api.post('/highlights', { title });
                      setHighlights(prev => [...prev, res.data]);
                    } catch { /* ignore */ }
                  }}
                  className="flex items-center gap-1 text-xs text-primary font-bold px-2 py-1 rounded-full hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {highlights.length === 0 ? (
                  <p className="text-xs text-black/30 italic py-2">No highlights yet. Archive a story and add it to a highlight!</p>
                ) : (
                  highlights.map((h: any) => (
                    <div key={h.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full border-2 border-primary/30 bg-gradient-to-tr from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden relative">
                        {h.cover_url ? (
                          <img src={`${BACKEND}${h.cover_url}`} alt={h.title} className="w-full h-full object-cover" />
                        ) : (
                          <Star className="w-7 h-7 text-primary/40" />
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-black/60 max-w-[64px] text-center truncate">{h.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────── */}
            <div className="flex border-b border-primary/10 mb-4">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 py-3 flex justify-center items-center text-sm font-semibold transition-all relative ${activeTab === key ? 'text-black' : 'text-black/40'}`}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {label}
                  {activeTab === key && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              ))}
            </div>

            {/* ── Posts Grid ─────────────────────────────────── */}
            {activeTab === 'posts' && (
              myPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {myPosts.map((post: any) => (
                    <div key={post.id} className="aspect-square bg-primary/5 rounded-lg overflow-hidden relative group cursor-pointer">
                      {post.media_type === 'text' ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-2">
                          <p className="text-[10px] font-medium text-black/60 line-clamp-4 text-center">{nullString(post.caption)}</p>
                        </div>
                      ) : (
                        <img src={post.media_url?.startsWith('http') ? post.media_url : `${BACKEND}${post.media_url}`} alt="" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center space-x-1 text-xs font-bold text-white">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{post.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No posts yet. Share your first post!" />
              )
            )}

            {/* ── Active Stories Grid ─────────────────────────── */}
            {activeTab === 'stories' && (
              myStories.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {myStories.map((story: any) => (
                    <div key={story.id} className="aspect-[9/16] bg-primary/5 rounded-lg overflow-hidden relative group cursor-pointer">
                      {story.media_url ? (
                        <img src={story.media_url.startsWith('http') ? story.media_url : `${BACKEND}${story.media_url}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-2">
                          <p className="text-[10px] text-black/50 text-center line-clamp-4">{nullString(story.caption)}</p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center space-x-1 text-xs font-bold text-white">
                          <Heart className="w-3.5 h-3.5" />
                          <span>{story.reactions_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No active stories. Stories disappear in 24h!" />
              )
            )}

            {/* ── Archived Stories ───────────────────────────── */}
            {activeTab === 'archived' && (
              archivedStories.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {archivedStories.map((story: any) => (
                    <div key={story.id} className="aspect-[9/16] bg-primary/5 rounded-lg overflow-hidden relative group cursor-pointer">
                      <img src={story.media_url?.startsWith('http') ? story.media_url : `${BACKEND}${story.media_url}`} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1">
                        <Bookmark className="w-3 h-3 text-white drop-shadow" />
                      </div>
                      {/* Add to Highlight button */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-2 gap-1">
                        {highlights.length > 0 && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Pick first highlight for simplicity; could open a picker modal
                              const h = highlights[0];
                              try {
                                await api.post(`/highlights/${h.id}/stories`, { archived_story_id: story.id });
                              } catch { /* ignore */ }
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-white bg-primary/80 rounded-full px-2 py-1"
                          >
                            <Star className="w-2.5 h-2.5" />
                            Add to Highlight
                            <ChevronRight className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No archived stories. Archive stories to save them forever!" />
              )
            )}

            {/* ── Profile Visitors ───────────────────────────── */}
            {activeTab === 'visitors' && (
              visitors.length > 0 ? (
                <div className="space-y-2">
                  {visitors.map((visitor: any, idx: number) => (
                    <div key={idx} className="flex items-center p-3 bg-primary/5 rounded-xl border border-primary/10 hover:bg-primary/10 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-sm mr-3 text-white">
                        {visitor.username?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-black">@{visitor.username}</p>
                        <p className="text-[10px] text-black/60">{visitor.visited_at ? new Date(visitor.visited_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No profile visitors yet. Share your stories to attract visitors!" />
              )
            )}
          </>
        )}
      </div>

      <EditProfileModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
    <p className="text-sm font-medium max-w-[220px] text-black/60">{text}</p>
  </div>
);

export default ProfileView;
