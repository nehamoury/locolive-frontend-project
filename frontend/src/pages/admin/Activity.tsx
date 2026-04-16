import { Activity, User, MapPin, Film, Shield, AlertTriangle, Info, Wifi, MessageSquare } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';
import type { LiveActivity } from '../../types/admin';

const iconMap: Record<string, any> = {
  user_created: User,
  user_online: Wifi,
  crossing_detected: MapPin,
  reel_uploaded: Film,
  report_created: AlertTriangle,
  admin_action: Shield,
  post_liked: Activity,
  reel_liked: Activity,
  comment_created: MessageSquare,
};

function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getActivityDescription(activity: LiveActivity): string {
  const p = activity.payload;
  switch (activity.type) {
    case 'user_online':
      return `User @${p?.username || 'unknown'} came online`;
    case 'user_created':
      return `New user registered: @${p?.username || 'unknown'}`;
    case 'crossing_detected':
      return `Crossing detected between two users`;
    case 'reel_uploaded':
      return `New reel uploaded`;
    case 'comment_created':
      return `New comment: "${p?.content}"`;
    case 'post_liked':
      return `User liked a post`;
    case 'reel_liked':
      return `User liked a reel`;
    case 'report_created':
      return `New report submitted: ${p?.reason}`;
    default:
      return `System event: ${activity.type}`;
  }
}

export function ActivityPage() {
  const { activities } = useAdminStore();
  
  // Keep WebSocket alive on this page
  useAdminWebSocket();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs & Activity</h1>
          <p className="text-sm text-gray-500">Real-time system events via WebSocket</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">Live</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#FF006E]" />
          <h2 className="font-semibold text-gray-900">System Logs</h2>
          <span className="text-xs text-gray-400 ml-auto">{activities.length} events</span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No activity yet</h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Real-time events will appear here as they happen. User logins, crossings, and system events will be streamed live.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity, index) => {
              const Icon = iconMap[activity.type] || Info;
              return (
                <div key={`${activity.timestamp}-${index}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#FF006E]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#FF006E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{getActivityDescription(activity)}</p>
                    <p className="text-xs text-gray-500">{activity.type}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{formatTime(activity.timestamp)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityPage;