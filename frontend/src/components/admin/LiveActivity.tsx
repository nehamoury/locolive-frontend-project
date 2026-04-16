import { UserPlus, MapPin, Film, Wifi, AlertTriangle, Activity, MessageSquare } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { LiveActivity } from '../../types/admin';

interface LiveActivityProps {
  activities: LiveActivity[];
}

const iconMap: Record<string, LucideIcon> = {
  user_created: UserPlus,
  crossing_detected: MapPin,
  reel_uploaded: Film,
  user_online: Wifi,
  report_created: AlertTriangle,
  post_liked: Activity,
  reel_liked: Activity,
  comment_created: MessageSquare,
};

const colorMap: Record<string, string> = {
  user_created: 'bg-green-500',
  crossing_detected: 'bg-orange-500',
  reel_uploaded: 'bg-purple-500',
  user_online: 'bg-blue-500',
  report_created: 'bg-red-500',
  post_liked: 'bg-pink-500',
  reel_liked: 'bg-pink-500',
  comment_created: 'bg-indigo-500',
};

function getActivityDescription(activity: LiveActivity) {
  const { type, payload } = activity;
  switch (type) {
    case 'user_created':
      return `New user @${payload.username} joined locolive`;
    case 'crossing_detected':
      return `Crossing detected between 2 users`;
    case 'user_online':
      return `User @${payload.username} is now online`;
    case 'reel_uploaded':
      return `User @${payload.username} uploaded a new reel`;
    default:
      return 'System activity detected';
  }
}

function formatTime(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diff = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (isNaN(diff) || diff < 0) return 'Just now';
  if (diff < 60) return 'Just now';
  if (diff < 3000) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function LiveActivityPanel({ activities }: LiveActivityProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Live Activity</h3>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-600 font-medium tracking-wider">LIVE</span>
        </span>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Waiting for system events...</p>
          </div>
        ) : (
          activities.slice(0, 20).map((activity, idx) => {
            const Icon = iconMap[activity.type] || Wifi;
            return (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full ${colorMap[activity.type] || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-tight">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-medium">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


export default LiveActivityPanel;