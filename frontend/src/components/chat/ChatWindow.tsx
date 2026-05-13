import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  CheckCheck,
  Smile,
  MessageCircle,
  ShieldAlert,
  Slash,
  MoreVertical,
  Volume2,
  VolumeX,
  User,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { cn } from '../../utils/helpers';
import SharedContentCard from './SharedContentCard';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';

interface ChatWindowProps {
  receiverId: string;
  isGroup?: boolean;
  onBack?: () => void;
  onToggleProfile?: () => void;
  onViewProfile?: (userId: string) => void;
}

interface Recipient {
  full_name?: string;
  username?: string;
  avatar_url?: string;
  is_group?: boolean;
  is_online?: boolean;
  is_blocked?: boolean;
  is_blocked_by_me?: boolean;
  i_am_blocked?: boolean;
}

interface ApiError {
  response?: {
    status?: number;
  };
}

const ChatWindow = ({ receiverId, isGroup = false, onBack, onToggleProfile, onViewProfile }: ChatWindowProps) => {
  const { user } = useAuth();
  const { messages, sendMessage, sendTyping, isTyping, isForbidden } = useChat(receiverId, isGroup);
  const { playSendSound } = useNotifications();
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [loadingRecipient, setLoadingRecipient] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [icebreakers, setIcebreakers] = useState<string[]>([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [shouldDeleteChatOnBlock, setShouldDeleteChatOnBlock] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollButton(isScrolledUp);
  };

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
            full_name: res.data.data.name,
            username: 'group',
            avatar_url: '',
            is_group: true
          });
        } else {
          // Robust check for both formats: {data: {user}} or just {user}
          const recipientData = res.data.data || res.data;
          setRecipient(recipientData);
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

  const handleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Notifications unmuted' : 'Notifications muted for this chat');
    setShowMoreMenu(false);
  };

  const handleBlockAction = () => {
    setShowBlockConfirm(true);
    setShowMoreMenu(false);
  };

  const confirmBlock = async () => {
    if (!recipient) return;
    const action = recipient.is_blocked ? 'unblock' : 'block';

    try {
      if (recipient.is_blocked) {
        await api.delete(`/users/block/${receiverId}`);
        toast.success('User unblocked');
      } else {
        await api.post('/users/block', { user_id: receiverId });
        
        if (shouldDeleteChatOnBlock) {
          await api.delete(`/messages/clear?user_id=${receiverId}`);
          toast.success('User blocked and chat cleared');
          window.location.reload(); // Refresh to update ChatList and state
        } else {
          toast.success('User blocked');
        }
      }
      // Refresh recipient data
      const res = await api.get(isGroup ? `/groups/${receiverId}` : `/users/${receiverId}`);
      setRecipient(isGroup ? { ...recipient, full_name: res.data.name } : res.data);
    } catch (err) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setShowBlockConfirm(false);
      setShouldDeleteChatOnBlock(false);
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages in this chat?')) return;
    try {
      await api.delete(`/messages/clear?user_id=${receiverId}`);
      toast.success('Chat cleared');
      window.location.reload(); // Simplest way to refresh message list
    } catch (err) {
      toast.error('Failed to clear chat');
    }
    setShowMoreMenu(false);
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
    <div className="flex flex-col h-[100dvh] md:h-[100dvh] bg-bg-base/20 dark:bg-bg-base flex-1 relative overflow-hidden font-poppins overscroll-contain">

      {/* Chat Header */}
      <header className="h-[65px] md:h-[75px] px-4 md:px-6 flex items-center justify-between bg-bg-base md:bg-white dark:bg-bg-base border-b border-gray-100 dark:border-border-base/20 shrink-0 z-20">
        <div className="flex items-center gap-3 md:gap-4">
          {onBack && (
            <button onClick={onBack} className="md:hidden -ml-2 p-2 hover:bg-gray-100 dark:hover:bg-bg-card rounded-full text-gray-600 dark:text-text-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3 cursor-pointer group" onClick={onToggleProfile}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full overflow-hidden bg-gray-100 dark:bg-bg-card">
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
              {!isGroup && !recipient?.is_blocked && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-bg-base rounded-full" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className="text-[15px] md:text-[16px] font-bold text-gray-900 dark:text-text-base leading-tight">
                {loadingRecipient ? (
                  <div className="w-24 h-4 bg-gray-100 dark:bg-bg-card animate-pulse rounded" />
                ) : (
                  recipient?.full_name || recipient?.username || 'Locolive User'
                )}
              </h2>
              <span className="text-[12px] font-medium text-emerald-500">
                {isTyping ? 'typing...' : 'online'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(!showMoreMenu);
            }}
            className={cn(
              "p-2 rounded-full transition-all active:scale-90 relative z-50",
              showMoreMenu ? "bg-primary/10 text-primary" : "hover:bg-gray-100 dark:hover:bg-bg-card text-text-muted"
            )}
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showMoreMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/5"
                  onClick={() => setShowMoreMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-bg-card border border-border-base dark:border-border-base/30 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] z-50 overflow-hidden py-2"
                  style={{ top: '100%' }}
                >
                  <button
                    onClick={() => {
                      if (onViewProfile) onViewProfile(receiverId);
                      else onToggleProfile?.();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-text-base dark:text-text-base hover:bg-gray-50 dark:hover:bg-bg-base transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-bg-base group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                      <User className="w-4 h-4 text-gray-400 dark:text-text-muted group-hover:text-primary" />
                    </div>
                    View Profile
                  </button>

                  <button
                    onClick={handleMute}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-text-base dark:text-text-base hover:bg-gray-50 dark:hover:bg-bg-base transition-colors group"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isMuted ? "bg-emerald-50 text-emerald-500" : "bg-gray-100 dark:bg-bg-base text-gray-400 dark:text-text-muted group-hover:bg-amber-50 group-hover:text-amber-500"
                    )}>
                      {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                  </button>

                  <div className="h-px bg-border-base/50 my-1 mx-4" />

                  <button
                    onClick={handleBlockAction}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center transition-colors">
                      <Slash className="w-4 h-4 text-red-500" />
                    </div>
                    {recipient?.is_blocked ? 'Unblock User' : 'Block User'}
                  </button>

                  <button
                    onClick={handleClearChat}
                    className="w-full flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-text-muted dark:text-text-muted hover:bg-gray-50 dark:hover:bg-bg-base transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-bg-base flex items-center justify-center transition-colors">
                      <Trash2 className="w-4 h-4 text-gray-400 dark:text-text-muted" />
                    </div>
                    Clear Chat
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Messages */}
      <div
        onScroll={handleScroll}
        className="flex-grow flex-shrink overflow-y-auto no-scrollbar touch-pan-y overscroll-contain px-4 md:px-12 py-6 md:py-10 space-y-4 bg-bg-base md:bg-white dark:bg-bg-base min-h-0 relative"
      >
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-white dark:bg-bg-card border border-gray-100 dark:border-border-base/20 px-4 py-2 rounded-2xl shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[11px] font-bold text-gray-500 dark:text-text-muted leading-none text-center uppercase tracking-wider">
              End-to-End Secure Chat
            </span>
          </div>
        </div>

        <AnimatePresence>
          {isForbidden ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 md:py-20 opacity-60">
              <div className="w-16 h-16 bg-white dark:bg-bg-card rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-100 dark:border-border-base/20">
                <Slash className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-sm font-black text-gray-800 dark:text-text-base uppercase tracking-tight mb-2">Conversation Unavailable</h3>
              <p className="text-[12px] font-bold text-gray-500 dark:text-text-muted max-w-[240px]">
                {recipient?.is_blocked_by_me 
                  ? "You have blocked this user. Unblock them to start chatting again."
                  : "You cannot message this user or view their profile history."
                }
              </p>
            </div>
          ) : messages.length === 0 && !isTyping ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 md:py-20 opacity-40">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-text-muted mb-4" />
              <h3 className="text-sm font-medium text-gray-800 dark:text-text-base uppercase">No messages yet</h3>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const senderName = isMe ? user?.full_name || `@${user?.username}` : recipient?.full_name || `@${recipient?.username}`;
                const senderAvatar = isMe ? user?.avatar_url : recipient?.avatar_url;

                return (
                  <motion.div
                    layout
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse self-end' : 'flex-row self-start'}`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 mb-1">
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

                    <div className="flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[70%] relative">
                      <div className={`
                        relative px-4 py-2 shadow-sm
                        ${isMe
                          ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-[18px] rounded-br-none'
                          : 'bg-white dark:bg-bg-card text-gray-800 dark:text-text-base rounded-[18px] rounded-bl-none border border-gray-100 dark:border-border-base/20'}
                      `}>
                        {/* Tail/Triangle */}
                        <div className={`
                          absolute bottom-0 w-3 h-4 
                          ${isMe
                            ? '-right-1.5 bg-rose-500 [clip-path:polygon(0_0,0%_100%,100%_100%)]'
                            : '-left-1.5 bg-white dark:bg-bg-card [clip-path:polygon(100%_0,0%_100%,100%_100%)]'}
                        `} />

                        {!isMe && isGroup && (
                          <span className="text-[12px] font-bold text-pink-500 block mb-1">
                            {senderName}
                          </span>
                        )}

                        {msg.content.startsWith('[SHARE:') ? (() => {
                          const parts = msg.content.slice(7, -1).split(':');
                          const type = parts[0] as 'POST' | 'REEL';
                          const id = parts[1];
                          return <SharedContentCard type={type} id={id} isMe={isMe} />;
                        })() : (
                          <div className="flex flex-wrap items-end gap-2">
                            <p className="text-[14px] md:text-[15px] font-medium leading-relaxed min-w-[20px]">
                              {msg.content}
                            </p>
                            <div className="flex items-center gap-1 ml-auto mt-1 opacity-70">
                              <span className="text-[9px] font-bold uppercase tracking-tighter">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </span>
                              {isMe && (
                                <CheckCheck className={`w-3 h-3 ${msg.is_read ? 'text-white' : 'text-white/40'}`} />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </AnimatePresence>

        {isTyping && !recipient?.is_blocked && (
          <div className="flex items-center gap-2 animate-pulse px-4 mb-2">
            <span className="text-[10px] font-medium text-text-muted">typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              onClick={scrollToBottom}
              className="absolute bottom-6 right-6 p-3 bg-white dark:bg-bg-card shadow-xl border border-gray-100 dark:border-border-base/20 rounded-full text-primary active:scale-90 transition-all z-30"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
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
                className="px-4 py-1.5 bg-white dark:bg-bg-card border border-pink-100 dark:border-pink-500/20 text-pink-600 dark:text-pink-400 text-[11px] font-bold rounded-full whitespace-nowrap shadow-sm active:scale-95"
              >
                {text}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-2 md:px-6 pb-safe pt-2 bg-[#FFF5F7] dark:bg-bg-base sticky bottom-0 z-30">
        {recipient?.is_blocked ? (
          <div className="max-w-4xl mx-auto flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl shadow-sm mb-2">
            <span className="text-[11px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
              <Slash className="w-4 h-4" /> You have blocked this user. Unblock to send messages or interact.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSend} className="w-full max-w-4xl mx-auto flex items-center gap-1 sm:gap-3 bg-bg-card/90 backdrop-blur-xl p-1 md:p-2 rounded-full border border-border-base/50 shadow-2xl shadow-black/10">
            <div className="pl-3 md:pl-4" /> {/* Spacer for removed icons */}

            <input
              type="text"
              placeholder="Type a message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 bg-transparent py-2.5 text-[14px] font-semibold text-text-base dark:text-text-base outline-none placeholder:font-medium placeholder:text-text-muted"
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

      <ConfirmationModal
        isOpen={showBlockConfirm}
        onClose={() => {
          setShowBlockConfirm(false);
          setShouldDeleteChatOnBlock(false);
        }}
        onConfirm={confirmBlock}
        title={recipient?.is_blocked ? "Unblock User" : "Block User"}
        message={`Are you sure you want to ${recipient?.is_blocked ? 'unblock' : 'block'} ${recipient?.full_name || recipient?.username}?`}
        confirmText={recipient?.is_blocked ? "Unblock" : "Block"}
        type={recipient?.is_blocked ? "info" : "danger"}
      >
        {!recipient?.is_blocked && (
          <div 
            onClick={() => setShouldDeleteChatOnBlock(!shouldDeleteChatOnBlock)}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all border border-gray-100"
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${shouldDeleteChatOnBlock ? 'bg-pink-500 border-pink-500' : 'bg-white border-gray-300'}`}>
              {shouldDeleteChatOnBlock && <CheckCheck className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className="text-[11px] font-bold text-gray-600">Also delete chat history</span>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
};

export default ChatWindow;
