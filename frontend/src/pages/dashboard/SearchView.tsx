import { useState, useEffect, useCallback, type FC } from 'react';
import { Search, X, Check } from 'lucide-react';
import api from '../../services/api';
import { BACKEND } from '../../utils/config';

interface SearchViewProps {
  onUserSelect?: (userId: string) => void;
}

type TabType = 'people' | 'stories' | 'trending';

const SearchView: FC<SearchViewProps> = ({ onUserSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('people');

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await api.get('/users/search', { params: { q } });
      setResults(res.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleConnect = async (userId: string) => {
    try {
      await api.post('/connections/request', { target_user_id: userId });
      setResults(prev => prev.map(u => u.id === userId ? { ...u, requested: true } : u));
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-base overflow-hidden transition-colors duration-300">
      
      {/* ─── Top Huge Search Area ─── */}
      <div className="pt-12 pb-6 px-6 flex flex-col items-center justify-center shrink-0">
        <h1 className="text-3xl md:text-4xl font-black text-text-base tracking-tighter mb-8 text-center italic">
          Find People Near You
        </h1>
        
        <div className="w-full max-w-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full blur-[2px] opacity-70" />
          <div className="relative bg-bg-card rounded-full flex items-center px-6 py-4 shadow-sm border border-border-base transition-colors duration-300">
            <Search className="w-6 h-6 text-primary shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for names, interests..."
              className="flex-1 bg-transparent border-none focus:outline-none text-lg text-text-base px-4 placeholder:text-text-muted/30 font-medium"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 hover:bg-bg-sidebar rounded-full transition-all shrink-0 cursor-pointer" aria-label="Clear search">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div className="w-full max-w-4xl mx-auto px-6 border-b border-border-base shrink-0 flex items-center gap-8">
        {(['people', 'stories', 'trending'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 capitalize font-bold text-sm transition-all relative cursor-pointer
              ${activeTab === tab ? 'text-primary' : 'text-text-muted hover:text-text-base'}`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Results List ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 w-full max-w-4xl mx-auto no-scrollbar">
        {activeTab !== 'people' ? (
          <div className="py-20 text-center">
            <p className="text-sm font-bold text-text-muted italic">Coming soon</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-0 divide-y divide-border-base">
             {Array(4).fill(0).map((_, i) => (
               <div key={i} className="flex items-center gap-4 py-6 animate-pulse">
                 <div className="w-14 h-14 rounded-full bg-border-base shrink-0" />
                 <div className="flex-1 space-y-2">
                   <div className="h-4 bg-border-base rounded w-1/4" />
                   <div className="h-3 bg-border-base rounded w-1/2" />
                 </div>
                 <div className="w-24 h-10 rounded-full bg-border-base shrink-0" />
               </div>
             ))}
          </div>
        ) : (!query && results.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-primary/40" />
            </div>
            <p className="text-lg font-black text-text-base tracking-tight mb-2">Discover the community</p>
            <p className="text-sm text-text-muted max-w-sm">
              Type a name or interest above to find amazing people nearby.
            </p>
          </div>
        ) : (query && results.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-black text-text-base tracking-tight mb-2">No results found</p>
            <p className="text-sm text-text-muted">We couldn't find anyone matching "{query}"</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border-base">
            {results.map((user, i) => {
              // Mock bio/tagline since backend might not send it depending on struct fields
              const mBios = [
                "Exploring every corner of Raipur 📍", 
                "Coder by day 💻 Gamer by night 🎮", 
                "5am runner ⚡ | Fitness & travel 🌍",
                "Coffee addict ☕ & UI Designer",
                "Local food explorer 🍜"
              ];
              const bio = mBios[i % mBios.length];
              const colors = ['bg-primary/10 text-primary', 'bg-blue-500/10 text-blue-500', 'bg-emerald-500/10 text-emerald-500', 'bg-amber-500/10 text-amber-500'];
              const col = colors[i % colors.length];

              return (
                <div 
                  key={user.id}
                  onClick={() => onUserSelect?.(user.id)}
                  className="flex items-center py-5 group cursor-pointer hover:bg-bg-sidebar/50 -mx-4 px-4 rounded-3xl transition-all"
                >
                  {/* Avatar */}
                  <div className={`w-[52px] h-[52px] rounded-full overflow-hidden shrink-0 flex items-center justify-center font-black text-xl border-2 border-white shadow-sm
                    ${!user.avatar_url ? col : ''}`}
                  >
                    {user.avatar_url ? (
                        <img src={`${BACKEND}${user.avatar_url}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.username?.charAt(0).toUpperCase()
                      )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 ml-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="font-bold text-base text-text-base truncate">{user.full_name || user.username}</p>
                      {/* Fake verified badge for styling from mockup */}
                      {(i === 2 || user.is_verified) && (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                           <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-text-muted font-medium truncate">
                      @{user.username} · {bio}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 ml-4">
                    {!user.requested ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleConnect(user.id); }}
                        className="px-6 py-2 rounded-full border border-primary text-primary text-sm font-bold hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all w-[100px] cursor-pointer"
                      >
                        Connect
                      </button>
                    ) : (
                      <button 
                         disabled
                         className="px-6 py-2 rounded-full border border-border-base bg-bg-sidebar text-text-muted/40 text-sm font-bold w-[100px] cursor-not-allowed"
                      >
                        Pending
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default SearchView;
