import React, { useState, useEffect, type FC } from 'react';
import { Heart, UserPlus, MapPin, Bell, Eye, MessageCircle, ThumbsUp, ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import { BACKEND } from '../../utils/config';
import { toast } from 'react-hot-toast';
import { nullString } from '../../utils/string';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title?: string;
  message: string;
  content?: string;
  actor_username?: string;
  actor_full_name?: string;
  actor_avatar_url?: string;
  related_user_id?: any;
  is_read: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const getTypeConfig = (type: string): { emoji: string; color: string; bg: string; icon: React.ReactNode } => {
  switch (type) {
    case 'like':
    case 'post_like':
    case 'reel_liked':
      return { emoji: '👍', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <ThumbsUp className="w-4 h-4 text-blue-500" /> };
    case 'story_reaction':
    case 'reaction':
      return { emoji: '❤️', color: 'text-red-500', bg: 'bg-red-500/10', icon: <Heart className="w-4 h-4 text-red-500" /> };
    case 'follow':
    case 'connection_request':
      return { emoji: '👤', color: 'text-primary', bg: 'bg-primary/10', icon: <UserPlus className="w-4 h-4 text-primary" /> };
    case 'connection_accepted':
      return { emoji: '🤝', color: 'text-green-500', bg: 'bg-green-500/10', icon: <UserPlus className="w-4 h-4 text-green-500" /> };
    case 'crossing':
    case 'crossing_detected':
    case 'nearby':
      return { emoji: '📍', color: 'text-accent', bg: 'bg-accent/10', icon: <MapPin className="w-4 h-4 text-accent" /> };
    case 'story_view':
      return { emoji: '👁️', color: 'text-indigo-500', bg: 'bg-indigo-500/10', icon: <Eye className="w-4 h-4 text-indigo-500" /> };
    case 'comment':
    case 'reel_commented':
    case 'comment_mention':
      return { emoji: '💬', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <MessageCircle className="w-4 h-4 text-orange-500" /> };
    default:
      return { emoji: '🔔', color: 'text-text-muted', bg: 'bg-border-base', icon: <Bell className="w-4 h-4 text-text-muted" /> };
  }
};

// Parse rich message: bold parts wrapped in ** or actor names
const parseMessage = (notif: Notification): React.ReactNode => {
  const raw = nullString(notif.message || notif.content || '');
  // Split on actor name if present to bold it
  const actor = nullString(notif.actor_full_name || notif.actor_username);
  if (actor && raw.includes(actor)) {
    const parts = raw.split(actor);
    return (
      <>
        <span className="font-semibold text-text-base">{actor}</span>
        {parts.slice(1).join(actor)}
      </>
    );
  }
  return raw;
};

// ─── Notification Card ────────────────────────────────────────────────────────

const NotifCard = ({
  notif,
  onRead,
  onDelete,
  activeConnections,
  onAcceptConnection,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  activeConnections: Set<string>;
  onAcceptConnection: (userId: string) => void;
}) => {
  const [status, setStatus] = useState<null | 'accepted' | 'declined' | 'connecting'>(null);
  const cfg = getTypeConfig(notif.type);
  const initial = (notif.actor_full_name || notif.actor_username || '?').charAt(0).toUpperCase();

  return (
    <div
      onClick={() => !notif.is_read && onRead(notif.id)}
      className={`flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4 md:py-5 transition-all group relative cursor-pointer
        ${!notif.is_read
          ? 'bg-primary/5 border-l-4 border-primary hover:bg-primary/10'
          : 'bg-bg-base border-l-4 border-transparent hover:bg-bg-card'
        }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-base
          ${!notif.actor_avatar_url ? 'bg-gradient-to-br from-pink-400 to-purple-600' : ''}`}
        >
          {notif.actor_avatar_url ? (
            <img
              src={notif.actor_avatar_url.startsWith('http') ? notif.actor_avatar_url : `${BACKEND}${notif.actor_avatar_url}`}
              alt={notif.actor_full_name || '?'}
              className="w-full h-full object-cover"
            />
          ) : initial}
        </div>
        {/* Type badge */}
        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${cfg.bg} border-2 border-bg-base flex items-center justify-center text-[10px] transform group-hover:scale-110 transition-transform`}>
          {cfg.emoji}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4 sm:pr-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {nullString(notif.title) && (
              <h4 className="text-[13px] font-bold text-text-base uppercase tracking-tight mb-0.5 leading-none">
                {nullString(notif.title)}
              </h4>
            )}
            <p className="text-sm text-text-muted leading-snug">
              {parseMessage(notif)}
            </p>
            <p className="text-[11px] text-text-muted/40 mt-1 font-medium">{timeAgo(notif.created_at)}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif.id);
            }}
            className="p-2 text-text-muted/20 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all md:opacity-0 md:group-hover:opacity-100 shrink-0"
            title="Delete notification"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Actions for Connection Requests */}
        {(notif.type === 'connection_request' || notif.type === 'follow') && notif.related_user_id && (
          <div className="mt-3">
            {!status ? (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rawId = notif.related_user_id;
                    const reqId = typeof rawId === 'string' ? rawId : (rawId?.UUID || rawId?.uuid || rawId?.String || rawId?.string || null);
                    if (!reqId) {
                      toast.error('Invalid request ID');
                      return;
                    }
                    api.post('/connections/update', { requester_id: reqId, status: 'accepted' })
                      .then(() => {
                        toast.success('Connection request accepted');
                        setStatus('accepted');
                        onAcceptConnection(reqId);
                        onRead(notif.id);
                      })
                      .catch(err => {
                        console.error('Failed to accept:', err);
                        toast.error(err.response?.data?.error || 'Failed to accept request');
                      });
                  }}
                  className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-bold transition-all shadow-sm shadow-primary/20 active:scale-95 cursor-pointer"
                >
                  Accept
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rawId = notif.related_user_id;
                    const reqId = typeof rawId === 'string' ? rawId : (rawId?.UUID || rawId?.uuid || rawId?.String || rawId?.string || null);
                    if (!reqId) {
                      toast.error('Invalid request ID');
                      return;
                    }
                    api.post('/connections/update', { requester_id: reqId, status: 'blocked' })
                      .then(() => {
                        toast.success('Connection request declined');
                        setStatus('declined');
                        onRead(notif.id);
                      })
                      .catch(err => {
                        console.error('Failed to decline:', err);
                        toast.error(err.response?.data?.error || 'Failed to decline request');
                      });
                  }}
                  className="px-4 py-1.5 bg-border-base hover:bg-border-base/80 text-text-base rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Decline
                </button>
              </div>
            ) : (
              <div className={`text-xs font-black uppercase tracking-widest px-1 py-1 flex items-center gap-2 ${status === 'accepted' ? 'text-green-500' : 'text-text-muted/60'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${status === 'accepted' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-text-muted/40'}`} />
                {status === 'accepted' ? 'Accepted' : 'Declined'}
              </div>
            )}
          </div>
        )}

        {/* Inline Connect Button for Crossing Suggestions (only for non-connected users) */}
        {(notif.type === 'crossing_detected') && notif.related_user_id && (() => {
          const title = nullString(notif.title || '').toLowerCase();
          const isAlreadyConnected = title.includes('crossed again') || title.includes('again');
          
          const rawId = notif.related_user_id;
          const targetId = typeof rawId === 'string' ? rawId : (rawId?.UUID || rawId?.uuid || rawId?.String || rawId?.string || null);
          const isUserConnected = isAlreadyConnected || (targetId && activeConnections.has(targetId));

          // Already connected — show a subtle "Connected" badge
          if (isUserConnected) {
            return (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              </div>
            );
          }

          // Not connected — show the Connect button
          return (
            <div className="mt-3">
              {!status ? (
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!targetId) {
                        toast.error('Invalid user ID');
                        return;
                      }
                      setStatus('connecting');
                      api.post('/connections/request', { target_user_id: targetId })
                        .then((res) => {
                          const data = res.data?.data || res.data;
                          if (data?.status === 'accepted') {
                            toast.success('Connected! 🤝');
                            onAcceptConnection(targetId);
                          } else {
                            toast.success('Follow request sent! ✨');
                          }
                          setStatus('accepted');
                          onRead(notif.id);
                        })
                        .catch(err => {
                          console.error('Failed to send connection request:', err);
                          const msg = err.response?.data?.error || err.response?.data?.data?.message;
                          if (msg?.includes('already')) {
                            toast.success('Already connected!');
                            setStatus('accepted');
                          } else {
                            toast.error(msg || 'Failed to send request');
                            setStatus(null);
                          }
                        });
                    }}
                    className="px-5 py-1.5 bg-primary text-white rounded-full text-xs font-bold transition-all shadow-sm shadow-primary/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Connect
                  </button>
                </div>
              ) : status === 'connecting' ? (
                <div className="text-xs font-bold text-text-muted/60 flex items-center gap-2 px-1 py-1">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="text-xs font-black uppercase tracking-widest px-1 py-1 flex items-center gap-2 text-green-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  Request Sent
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <div className="absolute right-5 top-1/2 -translate-y-1/2 shrink-0 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary-glow)]" />
      )}
    </div>
  );
};

// ─── Main View ────────────────────────────────────────────────────────────────

interface NotificationsViewProps {
  onUserSelect?: (userId: string) => void;
}

const NotificationsView: FC<NotificationsViewProps> = ({ onUserSelect }) => {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead, unreadCount, deleteNotification, deleteAllNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(false);
    api.get('/connections')
      .then(res => {
        const ids = new Set((res.data || []).map((c: any) => c.id).filter(Boolean));
        setActiveConnections(ids as Set<string>);
      })
      .catch(err => console.error('Failed to fetch active connections:', err));
  }, []);

  return (
    <div className="h-full bg-bg-base overflow-y-auto no-scrollbar pb-24 md:pb-0 transition-colors duration-300">

      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-bg-base/80 backdrop-blur-md border-b border-border-base shadow-sm">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => navigate(-1)}
            className="md:hidden p-2 -ml-2 hover:bg-bg-card rounded-full transition-colors text-text-muted hover:text-text-base"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg md:text-xl font-black text-text-base uppercase leading-none">Notifications</h1>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-base text-[10px] font-black uppercase tracking-widest text-text-muted/40 hover:text-primary transition-all cursor-pointer"
            >
              Marked All
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => setShowClearAllConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-base text-[10px] font-black uppercase tracking-widest text-text-muted/40 hover:text-red-500 transition-all cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-col gap-0">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5 px-5 py-4 animate-pulse border-b border-border-base/50">
              <div className="w-11 h-11 rounded-full bg-bg-card shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-bg-card rounded-lg w-3/4" />
                <div className="h-3 bg-bg-card rounded-lg w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center px-8">
          <div className="w-16 h-16 bg-bg-card rounded-[24px] flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-text-muted/10" />
          </div>
          <h3 className="text-sm font-black text-text-muted/40 uppercase tracking-widest">No notifications found</h3>
        </div>
      ) : (
        <div className="divide-y divide-border-base">
          {notifications.map((notif, idx) => (
            <NotifCard
              key={`notification-${notif.id || idx}`}
              notif={notif}
              onDelete={deleteNotification}
              activeConnections={activeConnections}
              onAcceptConnection={(userId) => {
                setActiveConnections(prev => {
                  const next = new Set(prev);
                  next.add(userId);
                  return next;
                });
              }}
              onRead={(id) => {
                const actorId = typeof notif.related_user_id === 'string'
                  ? notif.related_user_id
                  : (notif.related_user_id?.UUID || notif.related_user_id?.uuid);
                
                markRead(id);

                // If it's a social notification and we have a handler, navigate
                if (actorId && onUserSelect) {
                  onUserSelect(actorId);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        onConfirm={() => {
          deleteAllNotifications();
          setShowClearAllConfirm(false);
        }}
        title="Clear All Notifications"
        message="Are you sure you want to permanently delete all your notifications? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default NotificationsView;
