import { useState, useEffect, useRef, type FC } from 'react';
import { Search, User, Loader2, X, CheckCircle2 } from 'lucide-react';
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

  // Debounce logic
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

  // Click outside handler for dropdown mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mode === 'navbar' && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  const handleUserClick = (userId: string) => {
    navigate(`/dashboard/profile/${userId}`);
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
    <div className="flex flex-col space-y-1">
      {error ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="text-red-500 font-bold text-sm mb-1 italic">Oops!</div>
          <div className="text-text-muted text-xs font-medium uppercase tracking-widest">{error}</div>
        </div>
      ) : results.length > 0 ? (
        results.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-full p-[2px] bg-brand-gradient flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-bg-sidebar overflow-hidden">
                <img
                  src={getMediaUrl(user.avatar_url, FALLBACKS.AVATAR(user.username))}
                  alt={user.username}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </div>
            <div className="flex flex-col items-start truncate overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-text-base group-hover:text-primary transition-colors truncate">
                  {user.username}
                </span>
                {user.is_verified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" strokeWidth={2.5} />
                )}
              </div>
              <span className="text-[12px] text-text-muted font-medium truncate">
                {user.full_name || 'Locolive User'}
              </span>
            </div>
          </button>
        ))
      ) : query.trim().length >= 2 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
            <User className="w-7 h-7 text-primary/20" />
          </div>
          <div className="text-text-base font-bold text-base mb-1">No results found.</div>
          <div className="text-text-muted text-[11px] font-black uppercase tracking-[0.2em]">Try a different search term</div>
        </div>
      ) : null}
    </div>
  );

  // UI for Sidebar Drawer Mode
  if (mode === 'sidebar-drawer') {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-[120] md:left-20"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 md:left-20 w-80 bg-white/95 dark:bg-bg-sidebar/95 backdrop-blur-2xl border-r border-border-base shadow-2xl z-[130] flex flex-col pt-8 pb-4"
            >
              <div className="px-6 mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-black italic tracking-tight text-text-base">Search</h2>
                <button onClick={onClose} className="p-2 hover:bg-bg-base rounded-full transition-colors">
                  <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="px-4 mb-6">
                <div className="relative flex items-center bg-bg-base border border-border-base rounded-xl transition-all focus-within:border-primary/50 group">
                  <div className="absolute left-4 text-text-muted group-focus-within:text-primary transition-colors">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search"
                    autoFocus
                    className="w-full pl-11 pr-10 py-3 bg-transparent border-none outline-none text-sm font-bold text-text-base placeholder:text-text-muted"
                  />
                  {query && (
                    <button onClick={handleClear} className="absolute right-3 p-1 bg-text-muted/10 hover:bg-text-muted/20 rounded-full transition-colors">
                      <X className="w-3 h-3 text-text-muted" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar px-2">
                {renderResults()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // UI for Navbar / Inline Dropdown Mode
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
            className={`absolute ${mode === 'navbar' ? 'top-14 left-0 right-0' : 'top-FULL left-2 right-2 mt-2'} bg-white/95 dark:bg-bg-sidebar/95 backdrop-blur-xl border border-border-base/50 rounded-2xl shadow-2xl z-[120] overflow-hidden max-h-96 overflow-y-auto no-scrollbar`}
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
