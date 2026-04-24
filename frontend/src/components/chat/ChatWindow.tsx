import React, { useState, useEffect, useRef } from 'react';
import { 
  Send,
  ArrowLeft,
  CheckCheck,
  Plus,
  Smile,
  MessageCircle,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { BACKEND } from '../../utils/config';
import { cn } from '../../utils/helpers';

interface ChatWindowProps {
  receiverId: string;
  isGroup?: boolean;
  onBack?: () => void;
  onToggleProfile?: () => void;
}

const ChatWindow = ({ receiverId, isGroup = false, onBack, onToggleProfile }: ChatWindowProps) => {
   const { user } = useAuth();
  const { messages, sendMessage, sendTyping, isTyping } = useChat(receiverId, isGroup);
  const { playSendSound } = useNotifications();
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchRecipient = async () => {
      try {
        const endpoint = isGroup ? `/groups/${receiverId}` : `/users/${receiverId}`;
        const res = await api.get(endpoint);
        if (isGroup) {
          // Map group data to look like recipient
          setRecipient({
            full_name: res.data.name,
            username: 'group',
            avatar_url: '',
            is_group: true
          });
        } else {
          setRecipient(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch recipient profile:', err);
      }
    };
    fetchRecipient();
  }, [receiverId, isGroup]);

  useEffect(() => {
    const fetchIcebreakers = async () => {
      try {
        const res = await api.get(`/chat/icebreakers?user_id=${receiverId}`);
        setIcebreakers(res.data.icebreakers || []);
      } catch (err) {
        console.error('Failed to fetch icebreakers:', err);
      }
    };
    if (messages.length === 0 && !isGroup) {
      fetchIcebreakers();
    }
  }, [receiverId, messages.length, isGroup]);

   const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage(content);
    playSendSound();
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e as any);
    } else {
      sendTyping();
    }
  };



  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] flex-1 relative overflow-hidden font-poppins">
      
      {/* Chat Header */}
      <header className="h-[80px] px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-2 bg-gray-50 rounded-xl text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onToggleProfile}>
            <div className="relative">
              <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-500">
                <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white">
                  {recipient?.avatar_url ? (
                    <img src={recipient.avatar_url.startsWith('http') ? recipient.avatar_url : `${BACKEND}${recipient.avatar_url}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 uppercase">{recipient?.username?.charAt(0)}</div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-black text-gray-900 leading-tight group-hover:text-pink-500 transition-colors uppercase italic truncate">
                {recipient?.full_name || 'Locolive User'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  @{recipient?.username}
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Online
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-[#f0f2f5] rounded-full transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar bg-white/40">
        
        {/* Safety Header */}
        <div className="flex justify-center mb-6">
           <div className="flex items-center gap-2 bg-[#f0f9ff] border border-[#e0f2fe] px-4 py-2 rounded-2xl shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-500" />
              <span className="text-[11px] font-bold text-sky-700 leading-none text-center uppercase tracking-wider">
                 End-to-End Secure Chat
              </span>
           </div>
        </div>

        <AnimatePresence>
          {messages.length === 0 && !isTyping ? (
             <div className="flex flex-col items-center justify-center h-full text-center py-20 opacity-40">
                <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-sm font-medium text-gray-800 uppercase italic">No messages yet</h3>
             </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const senderName = isMe ? user?.full_name || `@${user?.username}` : recipient?.full_name || `@${recipient?.username}`;
                const senderAvatar = isMe ? user?.avatar_url : recipient?.avatar_url;

                return (
                  <motion.div 
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {/* Header: Name and Time */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                       <span className="text-[11px] font-medium text-gray-900 italic tracking-tight">{senderName}</span>
                       <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                       </span>
                    </div>

                    <div className={`flex gap-3 w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0 mt-auto mb-1">
                          {senderAvatar ? (
                            <img src={senderAvatar.startsWith('http') ? senderAvatar : `${BACKEND}${senderAvatar}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">{senderName?.charAt(0)}</div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col">
                        {/* Bubble */}
                        <div className={`
                          px-5 py-3.5 text-[14px] font-medium leading-relaxed
                          ${isMe
                            ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[24px] rounded-br-sm shadow-xl shadow-pink-500/20'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-[24px] rounded-tl-sm shadow-sm'}
                        `}>
                          {msg.content}
                        </div>
                        {/* Time */}
                        <span className={`text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest ${isMe ? 'text-right' : 'text-left'} flex items-center gap-1 justify-end`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                          {isMe && (
                            <CheckCheck className={cn("w-3.5 h-3.5", msg.is_read ? "text-pink-500" : "text-gray-300")} />
                          )}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
           <div className="flex items-center gap-2 animate-pulse px-4">
              <span className="text-[10px] font-medium text-gray-400 italic">User is typing...</span>
           </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Icebreakers UI */}
      <AnimatePresence>
        {messages.length === 0 && icebreakers.length > 0 && !content && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 py-2 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto"
          >
            {icebreakers.slice(0, 3).map((text, i) => (
              <button 
                key={i}
                onClick={() => {
                  sendMessage(text);
                  setIcebreakers([]); // Hide after use
                }}
                className="px-4 py-2 bg-white border border-pink-100 text-pink-600 text-[12px] font-bold rounded-full hover:bg-pink-50 hover:border-pink-200 transition-all shadow-sm active:scale-95"
              >
                {text}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-6 pb-6 pt-2 bg-transparent sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3 bg-white/90 backdrop-blur-xl p-2 rounded-full border border-gray-100/50 shadow-2xl shadow-gray-200/40">
          
          <button type="button" className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all">
            <Plus className="w-5 h-5" />
          </button>
          
          <button type="button" className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-2.5 text-[14px] font-semibold text-gray-800 outline-none placeholder:font-medium placeholder:text-gray-400"
          />

          <div className="flex items-center gap-1.5 mr-1 shrink-0">
            <button type="button" className="p-2 text-gray-400 hover:text-gray-900 transition-all">
              <Smile className="w-5 h-5" />
            </button>
            
            <motion.button
              type="submit"
              disabled={!content.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xl ${
                content.trim()
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              <Send className="w-4 h-4 fill-white" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
