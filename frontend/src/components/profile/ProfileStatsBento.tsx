import { type FC } from 'react';
import { motion } from 'framer-motion';
import { Users, LayoutGrid, Video, UserPlus } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface StatItemProps {
    label: string;
    value: string | number;
    icon: any;
    delay?: number;
    color: string;
}

const StatCard: FC<StatItemProps> = ({ label, value, icon: Icon, delay = 0, color }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className="glass group relative p-5 rounded-[28px] border border-border-base flex flex-col gap-3 min-w-[140px] shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden"
    >
        {/* Dynamic Glow Background */}
        <div className={cn("absolute -inset-4 bg-gradient-to-br transition-opacity opacity-0 group-hover:opacity-10 pointer-events-none blur-3xl", color)} />
        
        <div className="flex items-center justify-between relative z-10">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center bg-bg-base/50 border border-border-base text-text-muted group-hover:text-primary transition-all duration-300 shadow-inner")}>
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-2xl font-black tracking-tight text-text-base tabular-nums">
                    {value}
                </span>
            </div>
        </div>
        
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted group-hover:text-primary transition-colors relative z-10 mt-1">
            {label}
        </span>
    </motion.div>
);

interface ProfileStatsBentoProps {
    stats: {
        posts: number;
        reels: number;
        following: number;
        followers: number;
    };
}

const ProfileStatsBento: FC<ProfileStatsBentoProps> = ({ stats }) => {
    const items = [
        { label: 'Posts', value: stats.posts, icon: LayoutGrid, color: 'from-pink-500 to-purple-500' },
        { label: 'Reels', value: stats.reels, icon: Video, color: 'from-purple-500 to-indigo-500' },
        { label: 'Followers', value: stats.followers, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'Following', value: stats.following, icon: UserPlus, color: 'from-cyan-500 to-emerald-500' },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {items.map((item, idx) => (
                <StatCard 
                    key={item.label} 
                    {...item} 
                    delay={idx * 0.05}
                />
            ))}
        </div>
    );
};

export default ProfileStatsBento;
