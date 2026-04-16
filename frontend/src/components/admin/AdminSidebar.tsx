import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Map,
  Route,
  Film,
  Flag,
  Bell,
  Settings,
  Shield,
  Activity,
  Zap,
  MessageSquare,
} from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/map', icon: Map, label: 'Live Map' },
  { to: '/admin/crossings', icon: Route, label: 'Crossings' },
  { to: '/admin/reels', icon: Film, label: 'Reels & Content' },
  { to: '/admin/reports', icon: Flag, label: 'Reports' },
  { to: '/admin/comments', icon: MessageSquare, label: 'Comments & Moderation' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const bottomItems = [
  { to: '/admin/admins', icon: Shield, label: 'Admin Users' },
  { to: '/admin/activity', icon: Activity, label: 'Logs & Activity' },
];

export function AdminSidebar() {
  return (
    <aside className="w-60 h-screen bg-gradient-to-b from-[#1a0a2e] to-[#2d1b4e] flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF006E] to-[#833AB4] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Locolive</span>
          <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">Admin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF006E]/20 to-[#833AB4]/20 text-white border-l-2 border-[#FF006E]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
        
        <div className="my-3 border-t border-white/10" />
        
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF006E]/20 to-[#833AB4]/20 text-white border-l-2 border-[#FF006E]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>v1.0.0</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;