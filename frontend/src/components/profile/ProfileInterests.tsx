import { type FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ProfileInterestsProps {
    interests?: string[];
    isOwnProfile?: boolean;
    onUpdate?: (interests: string[]) => void;
}

const ProfileInterests: FC<ProfileInterestsProps> = ({ interests = [], isOwnProfile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newInterest, setNewInterest] = useState('');

    const handleAdd = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            onUpdate?.([...interests, newInterest.trim()]);
            setNewInterest('');
        }
    };

    const handleRemove = (item: string) => {
        onUpdate?.(interests.filter(i => i !== item));
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-[12px] font-black uppercase tracking-[0.25em] text-text-muted">
                        Interests Pulse
                    </h3>
                </div>
                {isOwnProfile && (
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-1.5 rounded-full glass border border-border-base text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all active:scale-95"
                    >
                        {isEditing ? 'Save Pulse' : 'Edit Pulse'}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2.5 min-h-[40px]">
                <AnimatePresence mode="popLayout">
                    {interests.map((item, idx) => (
                        <motion.div
                            key={item}
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3, delay: idx * 0.03 }}
                            className={cn(
                                "group px-5 py-2.5 rounded-[20px] border border-border-base bg-bg-card/40 backdrop-blur-md hover:bg-primary/5 transition-all duration-300 flex items-center gap-3 shadow-sm",
                                "hover:border-primary/40 hover:shadow-[0_0_20px_-5px_rgba(var(--color-primary-rgb),0.2)]"
                            )}
                        >
                            <span className="text-sm font-bold text-text-base group-hover:text-primary transition-colors">
                                # {item}
                            </span>
                            {isEditing && isOwnProfile && (
                                <button
                                    onClick={() => handleRemove(item)}
                                    className="p-1 rounded-full hover:bg-accent/20 text-text-muted hover:text-accent transition-all hover:rotate-90"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </motion.div>
                    ))}

                    {isEditing && isOwnProfile && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-2"
                        >
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                                placeholder="Add interest..."
                                className="bg-bg-sidebar/40 backdrop-blur-md border border-dashed border-border-base rounded-[20px] px-5 py-2.5 text-sm text-text-base placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all w-48"
                                autoFocus
                            />
                            <button
                                onClick={handleAdd}
                                className="w-10 h-10 rounded-full bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30 active:scale-90 transition-all flex items-center justify-center shadow-lg shadow-primary/10"
                            >
                                <Plus className="w-5 h-5 font-black" />
                            </button>
                        </motion.div>
                    )}

                    {interests.length === 0 && !isEditing && (
                        <div className="w-full py-8 flex flex-col items-center justify-center gap-2 grayscale opacity-40">
                            <Sparkles className="w-8 h-8 text-primary" />
                            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                No Interests Pulses Yet
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default ProfileInterests;
