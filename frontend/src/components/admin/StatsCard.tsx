import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
  isLive?: boolean;
  color: 'pink' | 'purple' | 'green' | 'orange' | 'blue' | 'red';
  isLoading?: boolean;
}

const colorMap = {
  pink: 'from-pink-500/10 to-pink-500/5 text-pink-600 border-pink-500/20 shadow-pink-500/5',
  purple: 'from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-500/20 shadow-purple-500/5',
  green: 'from-green-500/10 to-green-500/5 text-green-600 border-green-500/20 shadow-green-500/5',
  orange: 'from-orange-500/10 to-orange-500/5 text-orange-600 border-orange-500/20 shadow-orange-500/5',
  blue: 'from-blue-500/10 to-blue-500/5 text-blue-600 border-blue-500/20 shadow-blue-500/5',
  red: 'from-red-500/10 to-red-500/5 text-red-600 border-red-500/20 shadow-red-500/5',
};

const iconBgMap = {
  pink: 'bg-pink-500/10',
  purple: 'bg-purple-500/10',
  green: 'bg-green-500/10',
  orange: 'bg-orange-500/10',
  blue: 'bg-blue-500/10',
  red: 'bg-red-500/10',
};

export function StatsCard({ title, value, icon: Icon, trend, isLive, color, isLoading }: StatsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm animate-pulse">
        <div className="w-10 h-10 bg-gray-100 rounded-2xl mb-4" />
        <div className="h-4 bg-gray-100 rounded-full w-24 mb-2" />
        <div className="h-8 bg-gray-100 rounded-full w-16" />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-100 rounded-3xl p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative group overflow-hidden`}>
      {/* Decorative Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${iconBgMap[color]}`} />
      
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBgMap[color]} ${colorMap[color].split(' ')[2]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        
        {isLive && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">
            {formatValue(value)}
          </h3>
          
          {trend && (
            <div className={`flex items-center gap-0.5 text-xs font-bold ${trend.isUp ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;