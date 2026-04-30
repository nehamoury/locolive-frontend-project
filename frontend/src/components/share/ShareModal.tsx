import React, { useState, useEffect } from 'react';
import { 
    X, 
    Search, 
    Send, 
    Users, 
    CheckCircle2, 
    Loader2,
    Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    title: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, title }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetchRecentConnections();
        }
    }, [isOpen]);

    const fetchRecentConnections = async () => {
        setLoading(true);
        try {
            // Fetch both following and followers to show all potential connections
            const [followingRes, followersRes] = await Promise.all([
                api.get('/connections/following'),
                api.get('/connections/followers')
            ]);
            
            const following = followingRes.data || [];
            const followers = followersRes.data || [];
            
            // Merge both lists and keep unique users by ID
            const allConnections = Array.from(
                new Map([...following, ...followers].map(u => [u.id, u])).values()
            );
            
            setUsers(allConnections);
        } catch (err) {
            console.error('Failed to fetch connections for sharing:', err);
        } finally {
            setLoading(false);
        }
    };

    // Global Search Effect
    useEffect(() => {
        const searchGlobalUsers = async () => {
            if (searchQuery.length < 2) return;
            
            try {
                const res = await api.get('/users/search', { params: { q: searchQuery } });
                const globalResults = res.data || [];
                
                // Merge global results into the local list if they don't already exist
                setUsers(prev => {
                    const existingIds = new Set(prev.map(u => u.id));
                    const newUsers = globalResults.filter((u: any) => !existingIds.has(u.id));
                    return [...prev, ...newUsers];
                });
            } catch (err) {
                console.error('Global search in share modal failed:', err);
            }
        };

        const timer = setTimeout(searchGlobalUsers, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleShare = async (receiverId: string) => {
        setSendingId(receiverId);
        try {
            const fullUrl = shareUrl.startsWith('http') ? shareUrl : `${window.location.origin}${shareUrl}`;
            await api.post('/messages', {
                receiver_id: receiverId,
                content: `Shared ${title}: ${fullUrl}`
            });
            setSentIds(prev => new Set(prev).add(receiverId));
            toast.success('Shared successfully!');
        } catch (err) {
            console.error('Failed to share:', err);
            toast.error('Failed to share');
        } finally {
            setSendingId(null);
        }
    };

    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md bg-bg-card rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border-base/10 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Share2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-text-base tracking-tight leading-none">Share</h2>
                                <p className="text-[11px] font-bold text-text-muted mt-1 uppercase tracking-widest">Internal Sharing</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-bg-base rounded-full transition-colors">
                            <X className="w-6 h-6 text-text-muted" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-6 py-4 bg-bg-base/30 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search friends..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-bg-card border border-border-base/20 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold text-text-base focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-[11px] font-black text-text-muted uppercase tracking-widest">Loading friends...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                                <div className="w-16 h-16 bg-bg-base rounded-[24px] flex items-center justify-center mb-4">
                                    <Users className="w-8 h-8 text-text-muted/30" />
                                </div>
                                <h3 className="text-base font-black text-text-base mb-1 italic">No friends found</h3>
                                <p className="text-[12px] font-medium text-text-muted">Try searching for another username</p>
                            </div>
                        ) : (
                            filteredUsers.map((targetUser) => (
                                <div key={targetUser.id} className="flex items-center justify-between p-3 bg-bg-base/50 rounded-2xl border border-transparent hover:border-primary/10 transition-all group">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 border-border-base/20 group-hover:border-primary/20 transition-all">
                                            <img src={getMediaUrl(targetUser.avatar_url, FALLBACKS.AVATAR(targetUser.username))} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-black text-text-base truncate">
                                                    @{targetUser.username.replace(/\s*\[.*?\]\s*/g, '')}
                                                </h4>
                                                <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button
                                        disabled={sendingId === targetUser.id || sentIds.has(targetUser.id)}
                                        onClick={() => handleShare(targetUser.id)}
                                        className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                            ${sentIds.has(targetUser.id)
                                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                : 'bg-primary text-white shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50'
                                            }`}
                                    >
                                        {sendingId === targetUser.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : sentIds.has(targetUser.id) ? (
                                            'Sent'
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Send className="w-3.5 h-3.5" />
                                                <span>Send</span>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Quick Link Share */}
                    <div className="p-6 bg-bg-base/50 border-t border-border-base/10 flex flex-col gap-3 shrink-0">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">External Share</p>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                toast.success('Link copied to clipboard!');
                            }}
                            className="w-full bg-bg-card border border-border-base/20 p-4 rounded-2xl flex items-center justify-between hover:bg-bg-base transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-bg-base flex items-center justify-center group-hover:bg-primary/10 transition-all">
                                    <Share2 className="w-4.5 h-4.5 text-text-muted group-hover:text-primary" />
                                </div>
                                <span className="text-[13px] font-black text-text-base">Copy profile link</span>
                            </div>
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Copy</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShareModal;
