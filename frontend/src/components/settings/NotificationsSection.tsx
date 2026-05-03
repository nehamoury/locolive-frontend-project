import { type FC, useEffect, useState } from 'react';
import { Bell, Mail, Smartphone, Zap, Loader2 } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../utils/helpers';

interface NotificationSettings {
  email_notifications?: boolean;
  push_notifications?: boolean;
  activity_notifications?: boolean;
  marketing_emails?: boolean;
  [key: string]: unknown;
}

const NotificationsSection: FC = () => {
  const { queries, mutations } = useSettings();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    if (queries.notifications.data) {
      setSettings(queries.notifications.data as NotificationSettings);
    }
  }, [queries.notifications.data]);

  const handleToggle = (key: string) => {
    if (!settings) return;
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    mutations.updateNotifications.mutate(newSettings);
  };

  if (queries.notifications.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const toggleItems = [
    { key: 'email_notifications', icon: Mail, title: 'Email Notifications', desc: 'Receive updates via your registered email' },
    { key: 'push_notifications', icon: Smartphone, title: 'Push Notifications', desc: 'Real-time alerts on your mobile device' },
    { key: 'activity_notifications', icon: Zap, title: 'Activity Updates', desc: 'Likes, comments, and new followers' },
    { key: 'marketing_emails', icon: Bell, title: 'Marketing Emails', desc: 'News, offers and platform updates' },
  ];

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-text-base">Notifications</h2>
        <p className="text-[14px] text-text-muted font-bold">Choose how you want to be notified</p>
      </div>

      <div className="bg-bg-card rounded-[32px] border border-border-base/50 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-5 md:p-8 space-y-8">
          {toggleItems.map((item, idx) => (
            <div key={item.key} className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between gap-6",
              idx !== 0 && "pt-8 border-t border-border-base/30"
            )}>
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 shrink-0 shadow-sm">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="text-[16px] font-black text-text-base tracking-tight leading-none mb-1">{item.title}</h4>
                  <p className="text-[13px] text-text-muted font-bold leading-tight">{item.desc}</p>
                </div>
              </div>
              
              <div className="flex justify-end sm:justify-start">
                <button 
                  onClick={() => handleToggle(item.key)}
                  disabled={mutations.updateNotifications.isPending}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
                    settings?.[item.key] ? "bg-pink-500" : "bg-bg-base border-border-base shadow-inner"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-bg-card shadow ring-0 transition duration-200 ease-in-out",
                    settings?.[item.key] ? "translate-x-5" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsSection;
