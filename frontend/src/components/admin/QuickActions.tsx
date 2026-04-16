import { MessageSquare, Map, Flag, Settings } from 'lucide-react';

const actions = [
  { icon: MessageSquare, label: 'Broadcast Message', href: '/admin/notifications', color: 'bg-[#FF006E]' },
  { icon: Map, label: 'View Live Map', href: '/admin/map', color: 'bg-[#833AB4]' },
  { icon: Flag, label: 'Manage Reports', href: '/admin/reports', color: 'bg-orange-500' },
  { icon: Settings, label: 'System Settings', href: '/admin/settings', color: 'bg-gray-600' },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
              <action.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;