import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  CheckCheck,
  Smile,
  MessageCircle,
  ShieldAlert,
  Slash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { cn } from '../../utils/helpers';
import SharedContentCard from './SharedContentCard';

interface ChatWindowProps {
  receiverId: string;
  isGroup?: boolean;
  onBack?: () => void;
  onToggleProfile?: () => void;
}

interface Recipient {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  is_group?: boolean;
  is_online?: boolean;
  is_blocked?: boolean;
}

interface ApiError {
  response?: {
    status?: number;
  };
}

const ChatWindow = ({ receiverId, isGroup = false, onBack, onToggleProfile }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, sendTyping, isTyping } = useChat(receiverId, isGroup);
  const { playSendSound } = useNotifications();
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
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
      setLoadingRecipient(true);
      setErrorStatus(null);
      try {
        if (!receiverId || receiverId === 'undefined' || receiverId === 'messages' || receiverId.length < 32) {
          setLoadingRecipient(false);
          return;
        }
        const endpoint = isGroup ? `/groups/${receiverId}` : `/users/${receiverId}`;
        const res = await api.get(endpoint);
        if (isGroup) {
          setRecipient({
            full_name: res.data.name,
            username: 'group',
            avatar_url: '',
            is_group: true
          });
        } else {
          setRecipient(res.data);
        }
      } catch (err: unknown) {
        const status = (err as ApiError).response?.status;
        if (status) {
          setErrorStatus(status);
        }
      } finally {
        setLoadingRecipient(false);
      }
    };
    fetchRecipient();
  }, [receiverId, isGroup]);

  useEffect(() => {
    const fetchIcebreakers = async () => {
      try {
        if (!receiverId || receiverId === 'undefined' || receiverId === 'messages' || receiverId.length < 32) {
          return;
        }
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

  const submitMessage = () => {
    if (!content.trim()) return;
    sendMessage(content);
    playSendSound();
    setContent('');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    } else {
      sendTyping();
    }
  };

  if (errorStatus === 404) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8f9fc]">
        <header className="h-[70px] md:h-[80px] px-4 md:px-8 flex items-center bg-white/80 backdrop-blur-md border-b border-gray-100">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-gray-50/50 rounded-xl text-gray-500">
              <ArrowLeft className="w-5.5 h-5.5" />
            </button>
          )}
          <h3 className="ml-4 text-[15px] font-black text-text-base uppercase">Conversation Unavailable</h3>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-base/40">
          <div className="w-20 h-20 bg-bg-card rounded-[32px] flex items-center justify-center mb-6 border border-border-base">
            <ShieldAlert className="w-10 h-10 text-text-muted/30" />
          </div>
          <h3 className="text-xl font-black text-text-base uppercase tracking-tight">User Not Found</h3>
          <p className="text-xs font-bold text-text-muted max-w-[280px] mt-3 leading-relaxed">
            This conversation is no longer available. The user may have changed their privacy settings or blocked the connection.
          </p>
          <button onClick={onBack} className="mt-8 px-10 py-3.5 bg-primary text-white text-[11px] font-black uppercase tracking-[2px] rounded-[20px] shadow-xl shadow-primary/10 active:scale-95 transition-all">
            Return to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-bg-base/20 flex-1 relative overflow-hidden font-poppins overscroll-none">

      {/* Chat Header */}
      <header className="h-[60px] md:h-[80px] px-4 md:px-8 flex items-center justify-between bg-bg-card/60 backdrop-blur-md border-b border-border-base/50 sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
          {onBack && (
            <button onClick={onBack} className="md:hidden p-1.5 bg-gray-50/50 rounded-xl text-gray-500 active:scale-90 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 md:gap-3 cursor-pointer group" onClick={onToggleProfile}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-pink-500 to-purple-500">
                <div className="w-full h-full rounded-full bg-white overflow-hidden border-2 border-white flex items-center justify-center">
                  <img 
                    src={getMediaUrl(recipient?.avatar_url, FALLBACKS.AVATAR(recipient?.username || 'user'))} 
                    alt="" 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = FALLBACKS.AVATAR(recipient?.username || 'user');
                    }}
                  />
                </div>
              </div>
              {recipient?.is_online && !recipient?.is_blocked && (
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-[150px] xs:max-w-[200px]">
              <h3 className="text-[15px] font-black text-text-base leading-tight group-hover:text-primary transition-colors truncate">
                {loadingRecipient ? (
                  <div className="w-24 h-4 bg-bg-card animate-pulse rounded" />
                ) : (
                  recipient?.full_name || recipient?.username || 'Locolive User'
                )}
              </h3>
              <div className="flex items-center gap-2">
                {loadingRecipient ? (
                  <div className="w-16 h-3 bg-gray-50 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-[10px] font-bold text-gray-400 tracking-tighter">
                      @{recipient?.username || 'user'}
                    </span>
                    {recipient?.is_blocked ? (
                      <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1 italic">
                        <Slash className="w-2.5 h-2.5" /> Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Online
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Info icon removed as per user request */}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-8 space-y-6 md:space-y-8 bg-transparent min-h-0">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-2 rounded-2xl shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold text-primary/80 leading-none text-center uppercase tracking-wider">
              End-to-End Secure Chat
            </span>
          </div>
        </div>

        <AnimatePresence>
          {messages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 md:py-20 opacity-40">
              <MessageCircle className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-sm font-medium text-gray-800 uppercase">No messages yet</h3>
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
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[11px] font-medium text-gray-900 tracking-tight">{senderName}</span>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>

                    <div className={`flex gap-3 w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 shrink-0 mt-auto mb-1 border border-gray-100">
                          <img 
                            src={getMediaUrl(senderAvatar, FALLBACKS.AVATAR(senderName || 'user'))} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = FALLBACKS.AVATAR(senderName || 'user');
                            }}
                          />
                        </div>
                      )}

                      <div className="flex flex-col">
                        {msg.content.startsWith('[SHARE:') ? (() => {
                          const parts = msg.content.slice(7, -1).split(':');
                          const type = parts[0] as 'POST' | 'REEL';
                          const id = parts[1];
                          return <SharedContentCard type={type} id={id} isMe={isMe} />;
                        })() : (
                          <div className={`
                            px-4 py-3 text-[14px] font-medium leading-relaxed max-w-[85vw] md:max-w-md
                            ${isMe
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-[20px] rounded-br-sm shadow-lg shadow-pink-500/10'
                              : 'bg-white border border-gray-100 text-gray-800 rounded-[20px] rounded-tl-sm shadow-sm'}
                          `}>
                            {msg.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                              part.match(/https?:\/\/[^\s]+/) ? (
                                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline font-bold decoration-2 underline-offset-2 hover:opacity-80">
                                  {part}
                                </a>
                              ) : part
                            )}
                          </div>
                        )}
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

        {isTyping && !recipient?.is_blocked && (
          <div className="flex items-center gap-2 animate-pulse px-4 mb-2">
            <span className="text-[10px] font-medium text-text-muted">typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Icebreakers UI */}
      <AnimatePresence>
        {messages.length === 0 && icebreakers.length > 0 && !content && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full"
          >
            {icebreakers.map((text, i) => (
              <button
                key={i}
                onClick={() => {
                  sendMessage(text);
                  setIcebreakers([]);
                }}
                className="px-4 py-1.5 bg-white border border-pink-100 text-pink-600 text-[11px] font-bold rounded-full whitespace-nowrap shadow-sm active:scale-95"
              >
                {text}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-4 md:px-6 pb-safe pt-2 bg-bg-base/40 sticky bottom-0 z-30">
        {recipient?.is_blocked ? (
          <div className="max-w-4xl mx-auto flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-sm mb-2">
            <span className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Slash className="w-4 h-4" /> You have blocked this user. Unblock to send messages.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-1.5 md:gap-3 bg-bg-card/90 backdrop-blur-xl p-1.5 md:p-2 rounded-full border border-border-base/50 shadow-2xl shadow-black/10">
            <div className="pl-3 md:pl-4" /> {/* Spacer for removed icons */}

            <input
              type="text"
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 bg-transparent py-2.5 text-[14px] font-semibold text-text-base outline-none placeholder:font-medium placeholder:text-text-muted"
            />

            <div className="flex items-center gap-1 shrink-0">
              <button type="button" className="hidden sm:flex w-9 h-9 items-center justify-center text-gray-400 hover:text-gray-900 transition-all">
                <Smile className="w-5 h-5" />
              </button>
              <motion.button
                type="submit"
                disabled={!content.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all shadow-xl ${content.trim()
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-500/30'
                    : 'bg-gray-100 text-gray-300 shadow-none'
                  }`}
              >
                <Send className="w-4 h-4 fill-white" />
              </motion.button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
