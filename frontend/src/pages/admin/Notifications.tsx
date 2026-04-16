import { useState } from 'react';
import { Send, Users, MapPin, Bell, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminApi from '../../services/adminApi';
import { toast } from 'react-hot-toast';

export function Notifications() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'online' | 'location'>('all');
  const [location, setLocation] = useState('');

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminApi.getNotifications(1, 20),
  });

  const sendMutation = useMutation({
    mutationFn: () => adminApi.sendNotification({
      title,
      message,
      target: targetType,
      city: targetType === 'location' ? location : undefined,
    }),
    onSuccess: (data) => {
      toast.success(`Notification sent to ${data.recipients} users!`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      setTitle('');
      setMessage('');
      setLocation('');
    },
    onError: () => {
      toast.error('Failed to send notification');
    },
  });

  const handleSend = () => {
    if (!title || !message) return;
    sendMutation.mutate();
  };

  const notifications = notificationsData?.items || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Notification */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Notification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., New Features Available!"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your notification message..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E] resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Target</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetType('all')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    targetType === 'all' 
                      ? 'bg-[#FF006E] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  All Users
                </button>
                <button
                  onClick={() => setTargetType('online')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    targetType === 'online' 
                      ? 'bg-[#FF006E] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Online
                </button>
                <button
                  onClick={() => setTargetType('location')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    targetType === 'location' 
                      ? 'bg-[#FF006E] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Location
                </button>
              </div>
            </div>

            {targetType === 'location' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">City</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Bangalore"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF006E]/20 focus:border-[#FF006E]"
                />
              </div>
            )}

            <button
              onClick={handleSend}
              disabled={!title || !message || sendMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FF006E] to-[#833AB4] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Notification
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications sent yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-[#FF006E]/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-[#FF006E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{notif.title}</p>
                    <p className="text-sm text-gray-500 truncate">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Notifications;
