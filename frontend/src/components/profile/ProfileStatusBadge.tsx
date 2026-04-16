import { type FC } from 'react';
import { cn } from '../../utils/helpers';

interface ProfileStatusBadgeProps {
    status?: 'active' | 'ghost' | 'hidden';
    isGhostMode?: boolean;
    className?: string;
}

const ProfileStatusBadge: FC<ProfileStatusBadgeProps> = ({ status = 'hidden', isGhostMode, className }) => {
    // If user is in ghost mode, priority is ghost
    const displayStatus = isGhostMode ? 'ghost' : status;

    const statusConfig = {
        active: {
            label: 'Live Now',
            color: 'bg-emerald-500',
            glow: 'shadow-emerald-500/50',
            text: 'text-emerald-500'
        },
        ghost: {
            label: 'Ghost Mode',
            color: 'bg-indigo-400',
            glow: 'shadow-indigo-400/50',
            text: 'text-indigo-400'
        },
        hidden: {
            label: 'Offline',
            color: 'bg-text-muted/50',
            glow: 'shadow-text-muted/20',
            text: 'text-text-muted'
        }
    };

    const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.hidden;

    return (
        <div className={cn("flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-bg-card/40 backdrop-blur-xl border border-border-base shadow-lg shadow-black/5", className)}>
            <div className="relative flex items-center justify-center">
                <div className={cn("w-2.5 h-2.5 rounded-full shadow-[0_0_12px]", config.color, config.glow)} />
                {displayStatus === 'active' && (
                    <div className={cn("absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-40", config.color)} />
                )}
            </div>
            <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", config.text)}>
                {config.label}
            </span>
        </div>
    );
};

export default ProfileStatusBadge;
