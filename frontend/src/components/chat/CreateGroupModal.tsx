import { useState, useEffect } from 'react';
import { X, Check, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { BACKEND } from '../../utils/config';
import toast from 'react-hot-toast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (groupId: string) => void;
}

interface FriendConnection {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  status?: string;
}

const CreateGroupModal = ({ isOpen, onClose, onSuccess }: CreateGroupModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<FriendConnection[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchFriends = async () => {
        try {
          const res = await api.get('/connections');
          // Only friends (accepted connections) can be added to groups
          setFriends(((res.data || []) as FriendConnection[]).filter((c) => c.status === 'accepted'));
        } catch (err) {
          console.error('Failed to fetch friends:', err);
        }
      };
      fetchFriends();
    }
  }, [isOpen]);

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Group name is required');
    if (selectedMembers.length === 0) return toast.error('Select at least one member');

    setLoading(true);
    try {
      const res = await api.post('/groups', {
        name,
        description,
        member_ids: selectedMembers
      });
      toast.success('Group created successfully! 🎉');
      onSuccess(res.data.id);
      onClose();
    } catch {
      toast.error('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(f => 
    (f.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-950/20 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden font-poppins"
          >
            <div className="px-8 pt-8 pb-6 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900 italic tracking-tight">Create Group</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Start a new journey together</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Name & Description */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Group Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter a cool name..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-2 block">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What's this group about?"
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold text-gray-800 outline-none focus:ring-4 focus:ring-sky-500/5 focus:border-sky-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Member Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Select Members ({selectedMembers.length})</label>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                     <input 
                       type="text"
                       placeholder="Search..."
                       value={searchQuery}
                       onChange={e => setSearchQuery(e.target.value)}
                       className="bg-gray-50 border border-gray-100 rounded-full py-1.5 pl-8 pr-4 text-[11px] font-bold outline-none focus:border-sky-500/20 transition-all"
                     />
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2 pr-1">
                  {filteredFriends.length > 0 ? (
                    filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        onClick={() => toggleMember(friend.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                          selectedMembers.includes(friend.id) 
                            ? 'bg-sky-50/50 border-sky-100 shadow-sm' 
                            : 'bg-white border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                             {friend.avatar_url ? (
                               <img src={friend.avatar_url.startsWith('http') ? friend.avatar_url : `${BACKEND}${friend.avatar_url}`} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center text-xs font-black text-gray-400 uppercase">{friend.username[0]}</div>
                             )}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-gray-900">{friend.full_name}</span>
                              <span className="text-[10px] font-medium text-gray-400 uppercase">@{friend.username}</span>
                           </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          selectedMembers.includes(friend.id) ? 'bg-sky-500 text-white' : 'border-2 border-gray-100'
                        }`}>
                          {selectedMembers.includes(friend.id) && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-[11px] font-bold text-gray-300 uppercase tracking-widest">No friends found</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim() || selectedMembers.length === 0}
                className="w-full py-4 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                {loading ? 'Creating...' : 'Launch Group Chat'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;
