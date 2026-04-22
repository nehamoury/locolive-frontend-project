import { useState, useEffect, type FC } from 'react';
import { 
  UserPlus, 
  X, 
  Users, 
  MessageSquare, 
  MapPin, 
  UserMinus,
  Loader2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { isUserOnline } from '../../utils/presence';

interface ConnectionsViewProps {
  initialTab?: 'suggestions' | 'requests' | 'my-connections';
  onUserSelect?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

const ConnectionsView: FC<ConnectionsViewProps> = ({ initialTab = 'suggestions', onUserSelect, onMessage }) => {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'requests' | 'my-connections'>(initialTab);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Persistence for dismissed suggestions
  const getDismissed = () => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_suggestions') || '[]');
    } catch {
      return [];
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/connections/suggested');
      const dismissed = getDismissed();
      const filtered = (res.data || []).filter((u: any) => !dismissed.includes(u.id));
      setSuggestions(filtered);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
    }
  };

  const handleDismissSuggestion = (userId: string) => {
    // 1. Update local state
    setSuggestions(prev => prev.filter(s => s.id !== userId));
    
    // 2. Persist in localStorage
    const current = getDismissed();
    if (!current.includes(userId)) {
      current.push(userId);
      localStorage.setItem('dismissed_suggestions', JSON.stringify(current));
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/connections/requests');
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await api.get('/connections');
      setConnections(res.data || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  const loadAllCounts = async () => {
    api.get('/connections/requests').then(res => setRequests(res.data || []));
    api.get('/connections/suggested').then(res => {
      const dismissed = getDismissed();
      const filtered = (res.data || []).filter((u: any) => !dismissed.includes(u.id));
      setSuggestions(filtered);
    });
    api.get('/connections').then(res => setConnections(res.data || []));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'suggestions') await fetchSuggestions();
      else if (activeTab === 'requests') await fetchRequests();
      else if (activeTab === 'my-connections') await fetchConnections();
      setLoading(false);
      loadAllCounts();
    };
    loadData();
  }, [activeTab]);

  const handleRequest = async (userId: string, action: 'send' | 'accept' | 'decline' | 'remove') => {
    try {
      if (action === 'send') {
        await api.post('/connections/request', { target_user_id: userId });
        setSuggestions(prev => prev.map(s => s.id === userId ? { ...s, requested: true } : s));
      } else if (action === 'accept') {
        await api.post('/connections/update', { requester_id: userId, status: 'accepted' });
        setRequests(prev => prev.filter(r => (r.user_id || r.requester_id) !== userId));
        fetchConnections();
      } else if (action === 'decline') {
        await api.post('/connections/update', { requester_id: userId, status: 'blocked' });
        setRequests(prev => prev.filter(r => (r.user_id || r.requester_id) !== userId));
      } else if (action === 'remove') {
        if (!window.confirm('Remove this person from your following?')) return;
        await api.delete(`/connections/${userId}`);
        setConnections(prev => prev.filter(c => c.id !== userId));
      }
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    }
  };

  return (
    <div className="h-full bg-[#FCF8FB] overflow-y-auto no-scrollbar pb-24 md:pb-8 px-6 pt-10 font-poppins w-full selection:bg-primary/10">
      <div className="w-full h-fit max-w-6xl mx-auto">
        
        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <div className="flex flex-col mb-10">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                    Connections
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                    </div>
                </h1>
            </div>
            <p className="text-[14px] font-medium text-gray-500 max-w-lg">
                Manage your network and discover new friends near you
            </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-10 overflow-x-auto no-scrollbar p-1">
            <ModernTab 
                label="Suggestions" 
                icon={<UserPlus className="w-4 h-4" />}
                active={activeTab === 'suggestions'} 
                onClick={() => setActiveTab('suggestions')} 
            />
            <ModernTab 
                label="Requests" 
                icon={<MessageSquare className="w-4 h-4" />}
                count={requests.length}
                active={activeTab === 'requests'} 
                onClick={() => setActiveTab('requests')} 
            />
            <ModernTab 
                label="Following" 
                icon={<Users className="w-4 h-4" />}
                active={activeTab === 'my-connections'} 
                onClick={() => setActiveTab('my-connections')} 
            />
        </div>

        {/* ── Content Sections ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-12">
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4 m-auto">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                        </div>
                        <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-primary animate-spin" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Updating Network...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full flex flex-col gap-12"
                    >
                        {/* SUGGESTIONS VIEW */}
                        {(activeTab === 'suggestions') && (
                            <>
                                {/* People You May Know Grid */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-black text-gray-800 tracking-tight">People you may know</h2>
                                        <button className="text-[12px] font-bold text-primary hover:underline cursor-pointer">View all</button>
                                    </div>
                                    {suggestions.length === 0 ? (
                                        <EmptyState activeTab="suggestions" />
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {suggestions.map((user, idx) => (
                                                <SuggestionCard 
                                                    key={`suggestion-${user.id || user.username || idx}`} 
                                                    user={user} 
                                                    onConnect={() => handleRequest(user.id, 'send')}
                                                    onDismiss={() => handleDismissSuggestion(user.id)}
                                                    onView={() => onUserSelect?.(user.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Small Friend Requests Preview if any */}
                                {requests.length > 0 && (
                                    <section>
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-lg font-black text-gray-800 tracking-tight">Friend Requests</h2>
                                            <button 
                                                onClick={() => setActiveTab('requests')}
                                                className="text-[12px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                View all
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-4">
                                            {requests.slice(0, 3).map((req, idx) => (
                                                <RequestCard 
                                                    key={`request-preview-${req.user_id || req.requester_id || idx}`} 
                                                    user={req} 
                                                    onAccept={() => handleRequest(req.user_id || req.requester_id, 'accept')}
                                                    onReject={() => handleRequest(req.user_id || req.requester_id, 'decline')}
                                                    onView={() => onUserSelect?.(req.user_id || req.requester_id)}
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </>
                        )}

                        {/* REQUESTS VIEW */}
                        {activeTab === 'requests' && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-gray-800 tracking-tight">Incoming Requests</h2>
                                </div>
                                {requests.length === 0 ? (
                                    <EmptyState activeTab="requests" />
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {requests.map((req, idx) => (
                                            <RequestCard 
                                                key={`request-full-${req.user_id || req.requester_id || idx}`} 
                                                user={req} 
                                                onAccept={() => handleRequest(req.user_id || req.requester_id, 'accept')}
                                                onReject={() => handleRequest(req.user_id || req.requester_id, 'decline')}
                                                onView={() => onUserSelect?.(req.user_id || req.requester_id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* FOLLOWING VIEW */}
                        {activeTab === 'my-connections' && (
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-gray-800 tracking-tight">Your Connections</h2>
                                </div>
                                {connections.length === 0 ? (
                                    <EmptyState activeTab="my-connections" />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {connections.map((user, idx) => (
                                            <FollowingCard 
                                                key={`connection-${user.id || user.username || idx}`} 
                                                user={user} 
                                                onMessage={() => onMessage?.(user.id)}
                                                onRemove={() => handleRequest(user.id, 'remove')}
                                                onView={() => onUserSelect?.(user.id)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
      </div>
    </div>
  );
};

// ─── Components ────────────────────────────────────────────────────────────────

const ModernTab = ({ label, icon, count, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 py-3.5 px-8 rounded-2xl transition-all duration-300 relative cursor-pointer border
      ${active 
        ? 'bg-gradient-to-r from-[#FF3B8E] to-[#A855F7] text-white shadow-xl shadow-pink-500/20 border-transparent scale-105' 
        : 'bg-white text-gray-500 border-gray-100 hover:border-pink-200 hover:text-pink-500'
      }`}
  >
    <span className={active ? 'text-white' : 'text-inherit'}>{icon}</span>
    <span className="text-[13px] font-black tracking-tight">{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black ${active ? 'bg-white/20 text-white' : 'bg-pink-100 text-[#FF3B8E]'}`}>
        {count}
      </span>
    )}
  </button>
);

const SuggestionCard = ({ user, onConnect, onDismiss, onView }: any) => {
  const interests = (user.bio || '').match(/#[a-z0-9_]+/gi) || ['#Photography', '#Travel'];
  const distance = user.distance_km ? `${user.distance_km.toFixed(1)} km away` : '2.5 km away';
  const mutualFriends = user.mutual_friends || [];

  return (
    <motion.div 
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="bg-white p-5 rounded-[28px] border border-gray-100/80 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] flex flex-col group relative overflow-hidden"
    >
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-4 group/avatar" onClick={onView}>
          <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-primary animate-gradient-slow cursor-pointer">
            <div className="w-full h-full rounded-full bg-white p-1">
                <img 
                    src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} 
                    className="w-full h-full rounded-full object-cover" 
                    alt="" 
                />
            </div>
          </div>
          {isUserOnline(user.last_active_at) && (
            <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-sm" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col items-center gap-1 mb-4">
            <h3 className="font-black text-gray-800 text-[16px] leading-tight truncate px-2">{user.full_name || user.username}</h3>
            <p className="text-[12px] font-bold text-gray-400">@{user.username}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="text-[11px] font-bold">{distance}</span>
            </div>
        </div>

        {/* Mutual Friends Section */}
        {user.mutual_count > 0 && (
            <div className="flex flex-col items-center gap-1.5 mb-5 px-3">
                <div className="flex -space-x-2">
                    {mutualFriends.slice(0, 3).map((friend: any, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 overflow-hidden" title={friend.username}>
                             <img src={getMediaUrl(friend.avatar_url, FALLBACKS.AVATAR(friend.username))} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                    {user.mutual_count > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-400">
                            +{user.mutual_count - 3}
                        </div>
                    )}
                </div>
                <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{user.mutual_count} mutual connections</p>
            </div>
        )}

        {/* Interests (shown only if no mutual friends to keep layout clean) */}
        {user.mutual_count === 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-6 min-h-[22px]">
                {interests.slice(0, 2).map((tag: string, i: number) => (
                    <span key={i} className="text-[10px] font-black uppercase text-[#A855F7] bg-purple-50 px-2.5 py-1 rounded-full tracking-wide">
                        {tag}
                    </span>
                ))}
            </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 w-full mt-auto">
            {user.requested ? (
                 <button disabled className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest border border-gray-100 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Requested
                 </button>
            ) : (
                <>
                    <button 
                        onClick={onConnect}
                        className="flex-1 bg-gradient-to-r from-[#FF3B8E] to-[#A855F7] text-white py-3 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 active:scale-95 transition-all cursor-pointer"
                    >
                        Connect
                    </button>
                    <button 
                        onClick={onDismiss}
                        className="w-10 h-11 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer border border-transparent hover:border-red-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
      </div>
    </motion.div>
  );
};

const RequestCard = ({ user, onAccept, onReject, onView }: any) => {
    const mutualFriends = user.mutual_friends || [];
    
    return (
    <motion.div 
        whileHover={{ scale: 1.01 }}
        className="bg-white p-5 rounded-[24px] border border-gray-100/80 shadow-sm flex items-center justify-between group"
    >
        <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-full overflow-hidden cursor-pointer shrink-0" onClick={onView}>
            <img src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <h4 className="font-black text-gray-800 text-base">@{user.username}</h4>
                    <span className="px-2 py-0.5 bg-pink-50 text-primary text-[9px] font-black rounded-lg uppercase tracking-wider">NEW</span>
                </div>
                <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">{user.full_name || 'Friend Request'}</p>
            </div>
        </div>

        {/* Mutual Connections (Real Data) */}
        {user.mutual_count > 0 && (
            <div className="hidden lg:flex flex-col items-center gap-1 mx-10 shrink-0">
                <p className="text-[11px] font-bold text-gray-400">{user.mutual_count} mutual connections</p>
                <div className="flex -space-x-2">
                    {mutualFriends.slice(0, 3).map((friend: any, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 overflow-hidden" title={friend.username}>
                            <img src={getMediaUrl(friend.avatar_url, FALLBACKS.AVATAR(friend.username))} alt="" className="w-full h-full object-cover" />
                        </div>
                    ))}
                    {user.mutual_count > 3 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                            +{user.mutual_count - 3}
                        </div>
                    )}
                </div>
            </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
        <button 
            onClick={onAccept}
            className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-2xl text-[12px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95 cursor-pointer"
        >
            Accept
        </button>
        <button 
            onClick={onReject}
            className="px-8 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[12px] font-bold hover:bg-gray-100 transition-all active:scale-95 cursor-pointer border border-gray-100"
        >
            Decline
        </button>
        </div>
    </motion.div>
    );
};

const FollowingCard = ({ user, onMessage, onRemove, onView }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-5 rounded-[32px] border border-gray-100/80 shadow-sm flex items-center justify-between group"
  >
    <div className="flex items-center gap-4 overflow-hidden pr-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 cursor-pointer p-[2px] bg-gradient-to-br from-primary/20 to-accent/20" onClick={onView}>
        <img src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} className="w-full h-full rounded-xl object-cover" alt="" />
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
        <h4 className="font-black text-gray-800 text-[15px] leading-tight truncate">@{user.username}</h4>
        <p className="text-[12px] text-gray-400 font-medium mt-0.5 truncate">{user.full_name || 'Locolive User'}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button 
        onClick={onMessage}
        className="w-11 h-11 flex items-center justify-center bg-pink-50 text-primary hover:bg-primary hover:text-white rounded-2xl transition-all cursor-pointer"
        title="Message"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
      <button 
        onClick={onRemove}
        className="w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all cursor-pointer border border-gray-100"
        title="Remove Connection"
      >
        <UserMinus className="w-5 h-5" />
      </button>
    </div>
  </motion.div>
);

const EmptyState = ({ activeTab }: any) => {
  const configs: any = {
    suggestions: {
      title: "No people nearby",
      desc: "It seems like everyone is hiding! Why don't you explore the map and see where the crowd is?",
      icon: <MapPin className="w-8 h-8 text-primary" />
    },
    requests: {
      title: "Clean Slate",
      desc: "All requests handled. You're completely caught up for now!",
      icon: <CheckCircle2 className="w-8 h-8 text-green-500" />
    },
    'my-connections': {
      title: "Lone Wolf?",
      desc: "You haven't followed any real accounts yet. Let's start building your community!",
      icon: <Users className="w-8 h-8 text-gray-400" />
    }
  };

  const config = configs[activeTab] || configs.suggestions;

  return (
    <div className="flex flex-col items-center justify-center text-center p-16 bg-white rounded-[40px] border border-dashed border-gray-200">
      <div className="w-20 h-20 bg-gray-50 rounded-[30px] flex items-center justify-center mb-6">
        {config.icon}
      </div>
      <h3 className="text-[20px] font-black tracking-tight text-gray-800 mb-2 italic">
        {config.title}
      </h3>
      <p className="text-[14px] font-medium text-gray-500 max-w-[300px] leading-relaxed">
        {config.desc}
      </p>
    </div>
  );
};

export default ConnectionsView;
