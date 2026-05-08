import { useState, useEffect, useRef, type FC } from 'react';
import {
  Search, User, Loader2, X, CheckCircle2,
  Clock,
  ChevronRight, Lock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';

interface SearchResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_private: boolean;
}

interface UserSearchProps {
  mode: 'navbar' | 'sidebar-drawer' | 'inline';
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
}

const UserSearch: FC<UserSearchProps> = ({ mode, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Real Search History from localStorage
  const [recentHistory, setRecentHistory] = useState<{ id: string, term: string }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('search_history');
    if (saved) {
      try {
        setRecentHistory(JSON.parse(saved));
      } catch (e) {
        setRecentHistory([]);
      }
    } else {
      // Default placeholder if empty
      const defaults = [
        { id: '1', term: 'UI/UX Design' },
        { id: '2', term: 'Travel Diaries' },
        { id: '3', term: 'Photography' },
        { id: '4', term: 'Productivity Tips' },
      ];
      setRecentHistory(defaults);
      localStorage.setItem('search_history', JSON.stringify(defaults));
    }
  }, []);

  const clearRecent = () => {
    setRecentHistory([]);
    localStorage.removeItem('search_history');
  };

  const removeRecentItem = (id: string) => {
    const updated = recentHistory.filter(item => item.id !== id);
    setRecentHistory(updated);
    localStorage.setItem('search_history', JSON.stringify(updated));
  };

  const addToRecent = (term: string) => {
    const newItem = { id: Date.now().toString(), term };
    const updated = [newItem, ...recentHistory.filter(i => i.term !== term)].slice(0, 8);
    setRecentHistory(updated);
    localStorage.setItem('search_history', JSON.stringify(updated));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults([]);
        if (mode !== 'sidebar-drawer') setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, mode]);

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(response.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to fetch users');
      setResults([]);
      setShowDropdown(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mode === 'navbar' && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  const handleUserClick = (user: SearchResult) => {
    addToRecent(user.username);
    navigate(`/dashboard/profile/${user.id}`);
    if (onClose) onClose();
    setShowDropdown(false);
    setQuery('');
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    if (mode === 'navbar') setShowDropdown(false);
  };

  const renderResults = () => (
    <div className="flex flex-col space-y-2">
      {error ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-red-500/10 rounded-3xl border border-red-500/20">
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div className="text-red-500 font-black text-sm mb-1 ">Oops!</div>
          <div className="text-red-500/60 text-[11px] font-bold uppercase tracking-widest leading-relaxed">{error}</div>
        </div>
      ) : results.length > 0 ? (
        results.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user)}
            className="w-full flex items-center gap-4 p-3.5 rounded-[22px] hover:bg-bg-base hover:shadow-xl hover:-translate-y-0.5 border border-transparent hover:border-border-base transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl p-[2.5px] bg-brand-gradient flex-shrink-0 group-hover:rotate-3 transition-transform duration-300">
              <div className="w-full h-full rounded-[14px] bg-bg-card overflow-hidden border border-white/20">
                <img
                  src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))}
                  alt={user.username}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
            </div>
            <div className="flex flex-col items-start truncate overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-black text-text-base group-hover:text-primary transition-colors truncate">
                  {user.username}
                </span>
                {user.is_verified && (
                  <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/10" strokeWidth={2.5} />
                )}
                {user.is_private && (
                  <Lock className="w-3 h-3 text-text-muted/40" />
                )}
              </div>
              <span className="text-[12px] text-text-muted font-bold truncate opacity-60">
                {user.full_name || 'Locolive User'}
              </span>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all">
              <ChevronRight className="w-5 h-5 text-primary" />
            </div>
          </button>
        ))
      ) : query.trim().length >= 2 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-bg-base/30 rounded-[32px] border border-dashed border-border-base/50">
          <div className="w-20 h-20 bg-bg-card rounded-3xl flex items-center justify-center mb-5 shadow-sm border border-border-base/50">
            <User className="w-9 h-9 text-text-muted/20" />
          </div>
          <div className="text-text-base font-black text-lg mb-2 ">No matches found</div>
          <div className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">Try adjusting your keywords for better results</div>
        </div>
      ) : null}
    </div>
  );

  if (mode === 'sidebar-drawer') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Ultra-premium Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/20 backdrop-blur-[12px] z-[120]"
            />

            {/* Search Panel with Glassmorphism */}
            <motion.div
              initial={{ x: -450, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -450, opacity: 0 }}
              transition={{ type: 'spring', damping: 32, stiffness: 250 }}
              className="fixed top-0 bottom-0 left-0 w-[420px] bg-bg-card backdrop-blur-3xl border-r border-border-base/50 shadow-[30px_0_90px_rgba(0,0,0,0.15)] z-[130] flex flex-col pt-8 overflow-hidden"
            >
              {/* Decorative Gradient Blob */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="px-8 mb-4 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                  <h2 className="text-[34px] font-black tracking-tight text-text-base leading-none">Search</h2>
                  <div className="h-1 w-12 bg-brand-gradient rounded-full mt-2" />
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center bg-bg-base/50 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all active:scale-90 border border-border-base/50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 mb-8 relative z-10">
                <p className="text-[13px] text-text-muted font-bold mb-6 tracking-wide uppercase opacity-70">Find your tribe nearby</p>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-brand-gradient rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition-opacity" />
                  <div className="relative flex items-center bg-bg-base border border-border-base rounded-2xl transition-all focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/5">
                    <div className="absolute left-4 text-primary/60 group-focus-within:text-primary transition-colors">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 stroke-[2.5]" />}
                    </div>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search anything..."
                      autoFocus
                      className="w-full pl-12 pr-12 py-4.5 bg-transparent border-none outline-none text-[15px] font-bold text-text-base placeholder:text-text-muted/40"
                    />
                    {query && (
                      <div className="absolute right-4 flex items-center gap-2">
                        <button onClick={handleClear} className="p-1.5 bg-text-muted/10 hover:bg-text-muted/20 rounded-xl transition-colors">
                          <X className="w-3.5 h-3.5 text-text-muted" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pb-10 relative z-10 px-8">
                {query.length > 0 ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <span className="text-[11px] font-black uppercase tracking-[2px] text-text-muted">Results</span>
                      <span className="text-[11px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">{results.length} found</span>
                    </div>
                    {renderResults()}
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Recent Searches */}
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[12px] font-black uppercase tracking-[2.5px] text-text-base flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Recent
                        </h3>
                        {recentHistory.length > 0 && (
                          <button
                            onClick={clearRecent}
                            className="text-[11px] font-black text-primary hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      {recentHistory.length > 0 ? (
                        <div className="grid gap-2">
                          {recentHistory.map(item => (
                            <div
                              key={item.id}
                              onClick={() => { setQuery(item.term); performSearch(item.term); }}
                              className="flex items-center justify-between group cursor-pointer p-3.5 rounded-[20px] bg-bg-base/30 hover:bg-bg-base border border-transparent hover:border-border-base hover:shadow-xl transition-all"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center text-text-muted group-hover:text-primary group-hover:scale-110 transition-all shadow-sm border border-border-base/50">
                                  <Search className="w-4 h-4" />
                                </div>
                                <span className="text-[14px] font-bold text-text-muted group-hover:text-text-base transition-colors">{item.term}</span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); removeRecentItem(item.id); }}
                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all text-text-muted/30 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
                          <Clock className="w-10 h-10 mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Search history is empty</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className={`relative w-full ${mode === 'navbar' ? '' : 'px-2 mb-4'}`} ref={dropdownRef}>
      <div className={`relative flex items-center bg-bg-base border border-border-base/50 rounded-full transition-all focus-within:border-primary/30 group ${mode === 'navbar' ? 'h-11 shadow-sm' : 'h-11'}`}>
        <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4.5 h-4.5" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people, posts, locations..."
          className="w-full pl-11 pr-10 py-2 bg-transparent border-none outline-none text-[13px] font-medium text-text-base placeholder-text-muted/50 transition-all"
          onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
        />
        {query && (
          <button onClick={handleClear} className="absolute right-4 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-text-muted">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute ${mode === 'navbar' ? 'top-14 left-0 right-0' : 'top-FULL left-2 right-2 mt-2'} bg-bg-card/95 backdrop-blur-xl border border-border-base/50 rounded-2xl shadow-2xl z-[120] overflow-hidden max-h-96 overflow-y-auto no-scrollbar`}
          >
            <div className="p-2">
              {renderResults()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserSearch;
