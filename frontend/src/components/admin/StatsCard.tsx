import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  suffix?: string;
  growth?: number;
  isLive?: boolean;
  color: 'pink' | 'purple' | 'green' | 'orange' | 'blue';
}

const colorMap = {
  pink: 'from-pink-50 to-pink-100 border-pink-200',
  purple: 'from-purple-50 to-purple-100 border-purple-200',
  green: 'from-green-50 to-green-100 border-green-200',
  orange: 'from-orange-50 to-orange-100 border-orange-200',
  blue: 'from-blue-50 to-blue-100 border-blue-200',
};

const iconColorMap = {
  pink: 'text-pink-600',
  purple: 'text-purple-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
  blue: 'text-blue-600',
};

export function StatsCard({ title, value, suffix = '', growth, isLive, color }: StatsCardProps) {
  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toString();
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-5 transition-all duration-200 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${iconColorMap[color]}`}>
            {formatValue(value)}
            {suffix && <span className="text-lg ml-1">{suffix}</span>}
          </p>
        </div>
        
        {isLive && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500 rounded-full">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-medium text-white">Live</span>
          </div>
        )}
      </div>

      {growth !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {growth >= 0 ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {Math.abs(growth)}%
          </span>
          <span className="text-xs text-gray-500">vs last week</span>
        </div>
      )}
    </div>
  );
}

export default StatsCard;