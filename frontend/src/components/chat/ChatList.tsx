import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BACKEND } from '../../utils/config';
import CreateGroupModal from './CreateGroupModal';

interface Conversation {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  isGroup: boolean;
  is_blocked?: boolean;
}

interface ChatListProps {
  onSelect: (id: string, isGroup?: boolean) => void;
  selectedId?: string;
}

const ChatList = ({ onSelect, selectedId }: ChatListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Unread' | 'Following' | 'Groups'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [convRes, followingRes, groupsRes] = await Promise.all([
        api.get('/conversations'),
        api.get('/connections'),
        api.get('/groups')
      ]);
      setConversations(convRes.data || []);
      setFollowing(followingRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch chat data:', err);
    }
  };
  
  const handleDeleteConversation = async (e: React.MouseEvent, id: string, isGroup: boolean) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete this ${isGroup ? 'group chat' : 'conversation'}? This will clear all messages for you.`)) return;
    
    try {
      const endpoint = isGroup ? `/groups/${id}` : `/conversations/${id}`;
      await api.delete(endpoint);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (isGroup) setGroups(prev => prev.filter(g => g.id !== id));
      toast.success('Conversation deleted');
      
      // If we were viewing this chat, go back to home or deselect
      if (selectedId === id) {
        onSelect('');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error('Failed to delete');
    }
  };

  useEffect(() => {
    fetchData();
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

  const getFilteredItems = () => {
    if (activeTab === 'Following') {
      return following
        .filter(u => 
          (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(u => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          avatar_url: u.avatar_url,
          last_message: 'Start a new conversation',
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          isGroup: false
        }));
    }

    if (activeTab === 'Groups') {
      return groups
        .filter(g => (g.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
        .map(g => ({
          id: g.id,
          username: g.name,
          full_name: g.name,
          avatar_url: '',
          last_message: g.description || 'Group chat',
          last_message_at: g.created_at,
          unread_count: 0,
          isGroup: true
        }));
    }

    return conversations
      .filter(c => {
        const matchesSearch = (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             (c.username || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;
        if (activeTab === 'Unread') return c.unread_count > 0;
        return true;
      })
      .map(c => ({ ...c, isGroup: false }));
  };

  const displayItems = getFilteredItems();

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
        <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-2xl border border-gray-100/50 overflow-x-auto no-scrollbar scroll-smooth flex-nowrap">
          {(['All', 'Following', 'Unread', 'Groups'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
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
        {activeTab === 'Groups' && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full mb-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500/5 to-indigo-500/5 border border-sky-100/50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[12px] font-black text-sky-600 uppercase tracking-widest">New Group Chat</span>
          </button>
        )}

        {displayItems.length > 0 ? (
          displayItems.map((conv, idx) => (
            <ChatItem 
              key={conv.id || `chat-${idx}`} 
              conv={conv} 
              isSelected={selectedId === conv.id} 
              onClick={() => onSelect(conv.id, conv.isGroup)} 
              onDelete={activeTab !== 'Following' ? (e: any) => handleDeleteConversation(e, conv.id, conv.isGroup) : undefined}
            />
          ))
        ) : (
          <div className="py-20 text-center px-10 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">
              {activeTab === 'Unread' ? 'No unread messages' : activeTab === 'Groups' ? 'No groups yet' : activeTab === 'Following' ? 'No following users found' : 'No results'}
            </p>
          </div>
        )}
      </div>

      <CreateGroupModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(id) => {
          fetchData();
          onSelect(id, true);
        }}
      />
    </div>
  );
};

const ChatItem = ({ conv, isSelected, onClick, onDelete }: any) => {
  const timeStr = new Date(conv.last_message_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const initial = conv.full_name?.charAt(0) || conv.username?.charAt(0) || '?';

  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative cursor-pointer ${isSelected ? 'bg-white shadow-xl shadow-gray-200/50 border border-gray-100' : 'hover:bg-white/40'
        }`}
    >
      <div className="shrink-0 relative">
        <div className={`w-14 h-14 rounded-full overflow-hidden bg-gray-100 p-[2px] ${conv.isGroup ? 'bg-gradient-to-tr from-sky-500 to-indigo-500' : 'bg-gradient-to-tr from-pink-500 to-purple-500'}`}>
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
        ) : !conv.isGroup && !conv.is_blocked && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[14px] font-bold text-gray-900 truncate tracking-tight">{conv.full_name || `@${conv.username}`}</span>
          <span className="text-[10px] font-medium text-gray-400 uppercase">{timeStr}</span>
        </div>
        <p className={`text-[12px] ${isSelected ? (conv.isGroup ? 'text-sky-500' : 'text-pink-500') + ' font-medium' : 'text-gray-400 font-normal'} truncate leading-relaxed`}>
          {conv.is_blocked ? (
            <span className="text-red-500 font-black italic uppercase text-[10px]">Blocked</span>
          ) : conv.id === 'typing-id' ? (
            'Typing...'
          ) : (
            conv.last_message
          )}
        </p>
      </div>

      {/* Delete Button - Visible on Hover */}
      {onDelete && (
        <button 
          onClick={onDelete}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-lg hover:shadow-red-500/20 active:scale-90 z-20"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>

  );
};

export default ChatList;
