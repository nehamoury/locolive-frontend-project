import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search } from 'lucide-react';
import { BACKEND } from '../../utils/config';

interface Conversation {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

interface ChatListProps {
  onSelect: (userId: string) => void;
  selectedId?: string;
}

const ChatList = ({ onSelect, selectedId }: ChatListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Groups'>('All');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/conversations');
        setConversations(response.data || []);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      setConversations(prev => {
        const hasUnread = prev.find(c => c.id === selectedId && c.unread_count > 0);
        if (!hasUnread) return prev;
        return prev.map(c => c.id === selectedId ? { ...c, unread_count: 0 } : c);
      });
    }
  }, [selectedId]);


  const filtered = conversations.filter(c => {
    const matchesSearch = (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'Unread') return c.unread_count > 0;
    if (activeTab === 'Groups') return false; // Placeholder: No groups logic yet
    return true;
  });


  return (
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-3xl w-full border-r border-gray-100 font-poppins overflow-hidden">

      {/* Search Header */}
      <div className="px-6 py-8">

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 transition-colors group-focus-within:text-pink-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-xs font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/20 transition-all placeholder:text-gray-300"
          />
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-2xl border border-gray-100/50">
          {(['All', 'Unread', 'Groups'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-100/50' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 px-2 space-y-1">
        {filtered.length > 0 ? (
          filtered.map(conv => (
            <ChatItem key={conv.id} conv={conv} isSelected={selectedId === conv.id} onClick={() => onSelect(conv.id)} />
          ))
        ) : (
          <div className="py-20 text-center px-10 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">
              {activeTab === 'Unread' ? 'No unread messages' : activeTab === 'Groups' ? 'No groups yet' : 'No results'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatItem = ({ conv, isSelected, onClick }: any) => {
  const timeStr = new Date(conv.last_message_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const initial = conv.full_name?.charAt(0) || conv.username?.charAt(0) || '?';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${isSelected ? 'bg-white shadow-xl shadow-gray-200/50 border border-gray-100' : 'hover:bg-white/40'
        }`}
    >
      <div className="shrink-0 relative">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 p-[2px] bg-gradient-to-tr from-pink-500 to-purple-500">
          <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white">
            {conv.avatar_url ? (
              <img src={conv.avatar_url.startsWith('http') ? conv.avatar_url : `${BACKEND}${conv.avatar_url}`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 uppercase">{initial}</div>
            )}
          </div>
        </div>
        {conv.unread_count > 0 ? (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-pink-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
            <span className="text-[10px] font-black text-white leading-none">{conv.unread_count}</span>
          </div>
        ) : (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[14px] font-black text-gray-900 truncate tracking-tight">{conv.full_name || `@${conv.username}`}</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase">{timeStr}</span>
        </div>
        <p className={`text-[12px] ${isSelected ? 'text-pink-500 font-bold' : 'text-gray-400 font-medium'} truncate leading-relaxed`}>
          {conv.id === 'typing-id' ? 'Typing...' : conv.last_message}
        </p>
      </div>
    </button>
  );
};

export default ChatList;
