import { useState, useEffect, type FC } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  X, 
  Search, 
  Users, 
  MessageSquare, 
  MapPin, 
  Filter, 
  ChevronRight,
  ArrowRight,
  UserMinus,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

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
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSuggestions = async () => {
    try {
      const res = await api.get('/connections/suggested');
      setSuggestions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
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
    api.get('/connections/suggested').then(res => setSuggestions(res.data || []));
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
        setSuggestions(prev => prev.filter(s => s.id !== userId));
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

  const filteredData = () => {
    let data: any[] = [];
    if (activeTab === 'suggestions') data = suggestions;
    else if (activeTab === 'requests') data = requests;
    else if (activeTab === 'my-connections') data = connections;

    if (!searchQuery) return data;
    return data.filter((item: any) => 
      (item.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="h-full bg-bg-base overflow-y-auto no-scrollbar pb-24 md:pb-0 px-8 pt-8 font-brand w-full transition-all duration-300">
      <div className="w-full flex-col flex h-full max-w-[1200px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-black tracking-tight italic uppercase leading-none text-gradient bg-brand-gradient">
              Connections
            </h1>
            <p className="text-[13px] font-medium text-text-muted mt-1.5">
              Manage your network and discover new friends
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full max-w-sm ml-6">
            <div className="relative group flex-1 min-w-[200px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="Search network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-[50px] pr-4 py-3.5 bg-bg-card border border-border-base rounded-full text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-text-base placeholder:text-text-muted shadow-sm"
              />
            </div>
            <button className="w-12 h-12 flex items-center justify-center shrink-0 bg-bg-card border border-border-base rounded-full text-text-muted hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all shadow-sm">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-bg-card border border-border-base rounded-2xl p-1.5 max-w-md shadow-sm">
          <ModernTab 
            label="Suggestions" 
            active={activeTab === 'suggestions'} 
            onClick={() => setActiveTab('suggestions')} 
          />
          <ModernTab 
            label="Requests" 
            active={activeTab === 'requests'} 
            onClick={() => setActiveTab('requests')} 
          />
          <ModernTab 
            label="Following" 
            count={connections.length}
            active={activeTab === 'my-connections'} 
            onClick={() => setActiveTab('my-connections')} 
          />
        </div>

        {/* Content Area - Transparent container for integration */}
        <div className="flex-1 w-full flex flex-col mb-8">
          <div className={`w-full h-full flex flex-col ${filteredData().length === 0 ? 'border border-dashed border-border-base rounded-[24px]' : ''}`}>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 m-auto">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                  </div>
                  <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-primary animate-spin" />
                </div>
                <p className="text-xs font-black text-text-muted uppercase tracking-widest">Updating Network...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`w-full ${filteredData().length === 0 ? 'flex-1 flex m-auto items-center justify-center' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5'}`}
                >
                  {filteredData().length === 0 ? (
                    <EmptyState 
                      activeTab={activeTab} 
                      onAction={() => window.location.href = '/map'} 
                    />
                  ) : (
                    filteredData().map((item: any, idx: number) => (
                      <div key={item.id || item.user_id || item.requester_id || `item-${idx}`}>
                        {activeTab === 'suggestions' && (
                          <SuggestionCard 
                            user={item} 
                            onConnect={() => handleRequest(item.id, 'send')}
                            onView={() => onUserSelect?.(item.id)}
                          />
                        )}
                        {activeTab === 'requests' && (
                          <RequestCard 
                            user={item} 
                            onAccept={() => handleRequest(item.user_id || item.requester_id, 'accept')}
                            onReject={() => handleRequest(item.user_id || item.requester_id, 'decline')}
                            onView={() => onUserSelect?.(item.user_id || item.requester_id)}
                          />
                        )}
                        {activeTab === 'my-connections' && (
                          <FollowingCard 
                            user={item} 
                            onMessage={() => onMessage?.(item.id)}
                            onRemove={() => handleRequest(item.id, 'remove')}
                            onView={() => onUserSelect?.(item.id)}
                          />
                        )}
                      </div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tabs ──────────────────────────────────────────────────────────────────────

const ModernTab = ({ label, count, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer
      ${active 
        ? 'bg-brand-gradient text-white shadow-lg shadow-primary/20' 
        : 'text-text-muted hover:text-text-base'
      }`}
  >
    <span className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : ''}`}>
      {label}
    </span>
    {count !== undefined && count > 0 && (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
        {count}
      </span>
    )}
  </button>
);

// ─── Empty State ───────────────────────────────────────────────────────────────

const EmptyState = ({ activeTab, onAction }: any) => {
  const configs: any = {
    suggestions: {
      title: "No people nearby",
      desc: "It seems like everyone is hiding! Why don't you explore the map and see where the crowd is?",
      cta: "Explore Map",
      icon: <MapPin className="w-7 h-7 text-primary stroke-[2.5]" />
    },
    requests: {
      title: "Clean Slate",
      desc: "All requests handled. You're completely caught up for now!",
      cta: "Discover People",
      icon: <UserPlus className="w-7 h-7 text-secondary stroke-[2.5]" />
    },
    'my-connections': {
      title: "Lone Wolf?",
      desc: "You haven't followed any real accounts yet. Let's start building your community!",
      cta: "Find Friends",
      icon: <Users className="w-7 h-7 text-text-muted stroke-[2.5]" />
    }
  };

  const config = configs[activeTab] || configs.suggestions;

  return (
    <div className="flex flex-col items-center justify-center text-center p-12">
      <div className="w-24 h-24 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-center mb-8 transition-transform hover:scale-110">
        {config.icon}
      </div>
      <h3 className="text-[22px] font-black tracking-tight text-text-base italic mb-3">
        {config.title}
      </h3>
      <p className="text-[13px] font-medium text-text-muted max-w-[300px] leading-relaxed mb-8">
        {config.desc}
      </p>
      <button 
        onClick={onAction}
        className="group flex items-center justify-center gap-3 px-8 py-3.5 bg-brand-gradient text-white rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer"
      >
        <span>{config.cta}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

// ─── Suggestion Card ───────────────────────────────────────────────────────────

const SuggestionCard = ({ user, onConnect, onView }: any) => {
  const interests = (user.bio || '').match(/#[a-z0-9_]+/gi) || ['#Nearby', '#Newcomer'];
  const distance = user.distance_km ? `${user.distance_km.toFixed(1)} km away` : 'Nearby';

  return (
    <motion.div 
      whileHover={{ y: -6, boxShadow: '0 24px 48px -8px rgba(255, 0, 110, 0.12)' }}
      transition={{ duration: 0.2 }}
      className="bg-white/5 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 shadow-sm group cursor-pointer"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-[22px] bg-brand-gradient p-[2px]">
            <div className="w-full h-full rounded-[20px] bg-bg-base overflow-hidden flex items-center justify-center">
              <img src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} className="w-full h-full object-cover" alt="" />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-bg-card rounded-full shadow-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-text-base leading-tight truncate">@{user.username}</h3>
          <p className="text-[11px] font-medium text-text-muted mt-0.5 truncate">{user.full_name}</p>
          <div className="flex items-center gap-1.5 mt-2 bg-primary/5 self-start px-2 py-1 rounded-lg w-fit">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{distance}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5 min-h-[24px]">
        {interests.slice(0, 3).map((tag: string, i: number) => (
          <span key={i} className="text-[9px] font-black uppercase text-secondary bg-secondary/10 px-2.5 py-1 rounded-full tracking-wide">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onConnect}
          className="flex-1 bg-brand-gradient text-white py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all cursor-pointer"
        >
          Connect
        </button>
        <button 
          onClick={onView}
          className="p-2.5 bg-bg-base text-text-muted hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-border-base cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Request Card ──────────────────────────────────────────────────────────────

const RequestCard = ({ user, onAccept, onReject, onView }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white/5 backdrop-blur-xl p-4 rounded-[28px] border border-white/10 shadow-sm hover:border-primary/20 transition-all flex items-center gap-4"
  >
    <div className="w-12 h-12 rounded-[18px] bg-brand-gradient p-[2px] shrink-0 cursor-pointer" onClick={onView}>
      <div className="w-full h-full rounded-[16px] bg-bg-base overflow-hidden flex items-center justify-center">
        <img src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} className="w-full h-full object-cover" alt="" />
      </div>
    </div>
    <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
      <h4 className="font-black text-text-base leading-tight">@{user.username}</h4>
      <p className="text-[10px] text-text-muted font-bold uppercase mt-0.5 leading-none tracking-widest">Sent a request</p>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onAccept}
        className="w-9 h-9 flex items-center justify-center bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all active:scale-90 cursor-pointer"
      >
        <UserCheck className="w-4 h-4" />
      </button>
      <button 
        onClick={onReject}
        className="w-9 h-9 flex items-center justify-center bg-bg-base text-text-muted rounded-xl hover:bg-red-50 hover:text-red-500 border border-border-base transition-all active:scale-90 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

// ─── Following Card ────────────────────────────────────────────────────────────

const FollowingCard = ({ user, onMessage, onRemove, onView }: any) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white/5 backdrop-blur-xl p-5 rounded-[32px] border border-white/10 shadow-sm hover:border-primary/20 transition-all flex items-center justify-between group"
  >
    <div className="flex items-center gap-4 overflow-hidden pr-4">
      <div className="w-14 h-14 rounded-[20px] bg-brand-gradient p-[2px] shrink-0 cursor-pointer" onClick={onView}>
        <div className="w-full h-full rounded-[18px] bg-bg-base overflow-hidden flex items-center justify-center">
          <img src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))} className="w-full h-full object-cover" alt="" />
        </div>
      </div>
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
        <h4 className="font-black text-text-base text-[15px] leading-tight truncate">@{user.username}</h4>
        <p className="text-[12px] text-text-muted font-medium mt-0.5 truncate">{user.full_name || 'Locolive User'}</p>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button 
        onClick={onMessage}
        className="w-10 h-10 flex items-center justify-center bg-bg-base text-text-muted hover:text-primary hover:bg-primary/5 rounded-xl border border-border-base transition-all cursor-pointer"
        title="Message"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
      <button 
        onClick={onRemove}
        className="w-10 h-10 flex items-center justify-center bg-bg-base text-text-muted hover:text-red-500 hover:bg-red-50 rounded-xl border border-border-base transition-all cursor-pointer"
        title="Remove Connection"
      >
        <UserMinus className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
);

export default ConnectionsView;
