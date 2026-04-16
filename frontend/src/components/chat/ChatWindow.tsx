import React, { useState, useEffect, useRef } from 'react';
import { 
  Send,
  ArrowLeft,
  CheckCheck,
  Phone,
  Video,
  Plus,
  Smile,
  Paperclip,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { BACKEND } from '../../utils/config';

interface ChatWindowProps {
  receiverId: string;
  onBack?: () => void;
  onToggleProfile?: () => void;
}

const ChatWindow = ({ receiverId, onBack, onToggleProfile }: ChatWindowProps) => {
   const { user } = useAuth();
  const { messages, sendMessage, sendTyping, isTyping } = useChat(receiverId);
  const { playSendSound } = useNotifications();
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState<any>(null);
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
        const res = await api.get(`/users/${receiverId}`);
        setRecipient(res.data);
      } catch (err) {
        console.error('Failed to fetch recipient profile:', err);
      }
    };
    fetchRecipient();
  }, [receiverId]);

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

  const displayName = recipient?.full_name || `@${recipient?.username || 'User'}`;

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
            <div className="flex flex-col">
              <h3 className="text-[15px] font-black text-gray-900 leading-tight group-hover:text-pink-500 transition-colors uppercase italic">{displayName}</h3>
              <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 no-scrollbar bg-white/40">
        
        {/* Security Badge */}
        <div className="flex justify-center mb-6">
           <div className="flex items-center gap-2 bg-[#e8f2ff] border border-[#d0e4ff] px-4 py-2 rounded-xl shadow-sm">
              <span className="text-[11px] font-medium text-[#4a90e2] leading-none text-center">
                 Hi! Feel free to talk. Tell us what you're thinking.
                 <br />
                 <span className="text-[10px] opacity-70">A 30-60 minute Locolive AI Demo over Zoom with me?</span>
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
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} AM
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
                          px-5 py-3 text-[13.5px] font-medium leading-relaxed shadow-sm
                          ${isMe
                            ? 'bg-brand-gradient text-white'
                            : 'bg-white text-gray-800 border border-gray-100'}
                        `}>
                          {msg.content}
                        </div>
                        {/* Time */}
                        <span className={`text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          {isMe && <CheckCheck className="w-3 h-3 inline ml-1 text-pink-500" />}
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

      {/* Input Area */}
      <div className="px-10 py-8 bg-white/40 backdrop-blur-3xl sticky bottom-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-4 bg-white/80 p-2.5 rounded-[30px] border border-gray-100 shadow-2xl shadow-gray-200/50">
          
          <button type="button" className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all">
            <Plus className="w-5 h-5" />
          </button>

          <input
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent py-2.5 text-[14px] font-bold text-gray-800 outline-none placeholder:font-bold placeholder:text-gray-300"
          />

          <div className="flex items-center gap-1.5 mr-1">
            <button type="button" className="p-2 text-gray-400 hover:text-gray-900 transition-all">
              <Smile className="w-5 h-5" />
            </button>
            <button type="button" className="p-2 text-gray-400 hover:text-gray-900 transition-all">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <motion.button
              type="submit"
              disabled={!content.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-xl ${
                content.trim()
                  ? 'bg-brand-gradient text-white shadow-pink-500/30'
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
