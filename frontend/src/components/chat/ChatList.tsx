import { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMediaUrl } from '../../utils/media';
import CreateGroupModal from './CreateGroupModal';
import ConfirmationModal from '../ui/ConfirmationModal';

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

interface FollowingUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

type DisplayConversation = Conversation;

interface ChatItemProps {
  conv: DisplayConversation;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

interface ChatListProps {
  onSelect: (id: string, isGroup?: boolean) => void;
  selectedId?: string;
}

const ChatList = ({ onSelect, selectedId }: ChatListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; isGroup: boolean } | null>(null);

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

  const handleDeleteConversation = (e: React.MouseEvent, id: string, isGroup: boolean) => {
    e.stopPropagation();
    setDeleteConfirm({ id, isGroup });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, isGroup } = deleteConfirm;

    try {
      const endpoint = isGroup ? `/groups/${id}` : `/conversations/${id}`;
      await api.delete(endpoint);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (isGroup) setGroups(prev => prev.filter(g => g.id !== id));
      toast.success('Conversation deleted');

      if (selectedId === id) {
        onSelect('');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error('Failed to delete');
    } finally {
      setDeleteConfirm(null);
    }
  };

  useEffect(() => {
    void fetchData();

    // Refresh when global notifications change (e.g. messages read in ChatWindow)
    window.addEventListener('notifications_updated', fetchData);
    return () => {
      window.removeEventListener('notifications_updated', fetchData);
    };
  }, []);

  const getFilteredItems = () => {
    // 1. Start with active conversations
    let allItems: Conversation[] = [...conversations];

    // 2. Add following users who don't have a conversation yet
    following.forEach(u => {
      if (!allItems.some(c => c.username === u.username)) {
        allItems.push({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          avatar_url: u.avatar_url,
          last_message: 'Start a new conversation',
          last_message_at: new Date(0).toISOString(), // Put at bottom
          unread_count: 0,
          isGroup: false
        });
      }
    });

    // 3. Add groups
    groups.forEach(g => {
      if (!allItems.some(c => c.id === g.id)) {
        allItems.push({
          id: g.id,
          username: g.name,
          full_name: g.name,
          avatar_url: '',
          last_message: g.description || 'Group chat',
          last_message_at: g.created_at,
          unread_count: 0,
          isGroup: true
        });
      }
    });

    // 4. Sort and Filter
    let filtered = allItems
      .filter(item => !user || item.id !== user.id) // Hide self
      .filter(item =>
        (item.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.username || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    if (activeFilter === 'unread') {
      return filtered.filter(item => item.unread_count > 0);
    }
    if (activeFilter === 'groups') {
      return filtered.filter(item => item.isGroup);
    }

    return filtered;
  };

  const displayItems = getFilteredItems();

  return (
    <div className="flex flex-col h-full bg-white w-full border-r border-border-base font-poppins overflow-hidden">

      {/* Search Header */}
      <div className="px-5 py-4 space-y-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-black text-text-base tracking-tight">Chats</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Plus className="w-5 h-5 text-text-base" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-12 pr-4 text-[14px] font-medium text-text-base focus:outline-none focus:ring-0 transition-all placeholder:text-gray-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${activeFilter === 'all' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('unread')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${activeFilter === 'unread' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Unread
          </button>
          <button
            onClick={() => setActiveFilter('groups')}
            className={`px-4 py-1.5 rounded-full text-[13px] font-bold shrink-0 transition-colors ${activeFilter === 'groups' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Groups
          </button>
        </div>
      </div>


      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 px-2 space-y-1">

        {displayItems.length > 0 ? (
          displayItems.map((conv, idx) => (
            <ChatItem
              key={conv.id || `chat-${idx}`}
              conv={conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id, conv.isGroup)}
              onDelete={conv.last_message !== 'Start a new conversation' ? (e) => handleDeleteConversation(e, conv.id, conv.isGroup) : undefined}
            />
          ))
        ) : (
          <div className="py-20 text-center px-10 opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">
              No conversations found
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

      <ConfirmationModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Conversation"
        message={`Are you sure you want to delete this ${deleteConfirm?.isGroup ? 'group chat' : 'conversation'}? This will clear all messages for you.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

const ChatItem = ({ conv, isSelected, onClick, onDelete }: ChatItemProps) => {
  const timeStr = new Date(conv.last_message_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const initial = conv.full_name?.charAt(0) || conv.username?.charAt(0) || '?';

  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative cursor-pointer border-b border-gray-100/50 ${isSelected
        ? 'bg-gray-100 shadow-none'
        : 'hover:bg-gray-50/80'
        }`}
    >
      <div className="shrink-0 relative">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 p-0.5">
          <div className="w-full h-full rounded-full bg-white overflow-hidden">
            {conv.avatar_url ? (
              <img src={getMediaUrl(conv.avatar_url)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 uppercase text-lg">{initial}</div>
            )}
          </div>
        </div>
        {conv.unread_count > 0 ? (
          <div className="absolute bottom-1 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
            <span className="text-[10px] font-black text-white leading-none">{conv.unread_count}</span>
          </div>
        ) : !conv.isGroup && !conv.is_blocked && (
          <div className="absolute bottom-1 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0 text-left py-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[16px] font-bold text-gray-900 truncate tracking-tight">{conv.full_name || `@${conv.username}`}</span>
          <span className="text-[12px] font-medium text-gray-500">{timeStr}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className={`text-[13px] ${conv.unread_count > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500 font-normal'} truncate leading-relaxed flex-1`}>
            {conv.is_blocked ? (
              <span className="text-red-500 font-bold text-[11px]">Blocked</span>
            ) : conv.id === 'typing-id' ? (
              <span className="text-emerald-500">Typing...</span>
            ) : (
              conv.last_message
            )}
          </p>
        </div>
      </div>

      {/* Delete Button - Visible on Hover */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-gray-200/50 text-gray-500 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm z-20"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default ChatList;
