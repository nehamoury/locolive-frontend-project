import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    Plus, 
    Check, 
    Image as ImageIcon,
    Loader2,
    FolderPlus,
    Calendar,
    ArrowRight
} from 'lucide-react';
import api from '../../services/api';
import { getMediaUrl, FALLBACKS } from '../../utils/media';
import { toast } from 'react-hot-toast';
import { cn } from '../../utils/helpers';


interface ArchivedStory {
    id: string;
    media_url: string;
    media_type: 'image' | 'video';
    created_at: string;
}

interface ManageHighlightsProps {
    onBack: () => void;
}

export const ManageHighlights: FC<ManageHighlightsProps> = ({ onBack }) => {
    const [step, setStep] = useState<'select' | 'details'>('select');
    const [archivedStories, setArchivedStories] = useState<ArchivedStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStories, setSelectedStories] = useState<string[]>([]);
    const [newHighlight, setNewHighlight] = useState({
        title: '',
        cover_url: ''
    });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchArchives();
    }, []);

    const fetchArchives = async () => {
        try {
            const { data } = await api.get('/stories/archived');
            setArchivedStories(data.archives || []);
        } catch (error) {
            toast.error('Failed to load archives');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedStories(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateHighlight = async () => {
        if (!newHighlight.title.trim()) {
            toast.error('Please enter a title');
            return;
        }
        if (selectedStories.length === 0) {
            toast.error('Please select at least one story');
            return;
        }

        setIsCreating(true);
        try {
            // 1. Create the highlight group
            const { data: highlight } = await api.post('/highlights', {
                title: newHighlight.title,
                cover_url: newHighlight.cover_url || (archivedStories.find(s => s.id === selectedStories[0])?.media_url)
            });

            // 2. Add selected stories to the group
            await Promise.all(selectedStories.map(storyId => 
                api.post(`/highlights/${highlight.id}/stories`, {
                    archived_story_id: storyId
                })
            ));

            toast.success('Highlight created successfully!');
            onBack();
        } catch (error) {
            toast.error('Failed to create highlight');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Accessing Vault...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-bg-base/50 dark:bg-bg-base/20 backdrop-blur-sm relative overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 md:px-10 border-b border-border-base bg-white/40 dark:bg-bg-card/40 backdrop-blur-3xl shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-slate-600 dark:text-text-base"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-text-base tracking-tight">Create Highlight</h1>
                        <p className="text-xs font-bold text-slate-400 dark:text-text-muted/60 uppercase tracking-widest mt-1">
                            {step === 'select' ? 'Select Stories' : step === 'details' ? 'Add Details' : 'Choose Source'}
                        </p>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedStories.length > 0 && step === 'select' && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onClick={() => setStep('details')}
                            className="bg-brand-gradient text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                <AnimatePresence mode="wait">
                    {step === 'select' ? (
                        <motion.div 
                            key="select"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-5xl mx-auto space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-500 dark:text-text-muted uppercase tracking-widest">
                                    Archive ({archivedStories.length})
                                </h2>
                                <span className="text-[10px] font-bold text-pink-500 uppercase">
                                    {selectedStories.length} Selected
                                </span>
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {archivedStories.map((story) => (
                                    <div 
                                        key={story.id}
                                        onClick={() => handleToggleSelect(story.id)}
                                        className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all duration-300"
                                        style={{ 
                                            borderColor: selectedStories.includes(story.id) ? '#ec4899' : 'transparent' 
                                        }}
                                    >
                                        <img 
                                            src={getMediaUrl(story.media_url, FALLBACKS.VAULT)}
                                            className={cn(
                                                "w-full h-full object-cover transition-transform duration-700",
                                                selectedStories.includes(story.id) ? "scale-105 opacity-80" : "group-hover:scale-110"
                                            )}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        
                                        {/* Selection Indicator */}
                                        <div className={cn(
                                            "absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all",
                                            selectedStories.includes(story.id) ? "bg-pink-500 scale-110 shadow-lg" : "bg-black/20"
                                        )}>
                                            {selectedStories.includes(story.id) && <Check className="w-3 h-3 text-white stroke-[4]" />}
                                        </div>

                                        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-white/70" />
                                            <span className="text-[8px] font-black text-white/70 uppercase">
                                                {new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {archivedStories.length === 0 && (
                                    <div className="col-span-full py-32 flex flex-col items-center gap-6 text-center">
                                        <div className="w-24 h-24 rounded-[45px] bg-slate-100 dark:bg-white/5 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10">
                                            <ImageIcon className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-2xl font-black text-slate-800 dark:text-text-base">Your Vault is Empty</h3>
                                            <p className="text-sm font-medium text-slate-400 dark:text-text-muted/60 mt-1 max-w-xs mx-auto leading-relaxed">
                                                To create highlights, you first need to archive your active stories. 
                                                Open one of your stories and click <strong>"Archive to Vault"</strong>.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto space-y-12 py-10"
                        >
                            <div className="relative group mx-auto w-40 h-40">
                                <div className="w-full h-full rounded-[60px] overflow-hidden border-8 border-white dark:border-bg-card shadow-2xl bg-slate-100 dark:bg-white/5">
                                    {selectedStories.length > 0 ? (
                                        <img 
                                            src={getMediaUrl(archivedStories.find(s => s.id === selectedStories[0])?.media_url, FALLBACKS.VAULT)}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FolderPlus className="w-12 h-12 text-slate-300" />
                                        </div>
                                    )}
                                </div>
                                <button className="absolute bottom-[-5px] right-[-5px] w-12 h-12 rounded-full bg-white dark:bg-bg-card border-4 border-slate-50 dark:border-bg-base/50 flex items-center justify-center text-pink-500 shadow-xl hover:scale-110 active:scale-95 transition-all">
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 dark:text-text-muted/40 uppercase tracking-[0.2em] ml-2">Highlight Name</label>
                                    <input 
                                        type="text"
                                        value={newHighlight.title}
                                        onChange={(e) => setNewHighlight(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Summer Memories 🌴"
                                        className="w-full px-8 py-5 rounded-[30px] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500/50 outline-none font-black text-slate-800 dark:text-text-base text-lg transition-all"
                                    />
                                </div>

                                <div className="flex flex-col gap-4 pt-10">
                                    <button 
                                        onClick={handleCreateHighlight}
                                        disabled={isCreating}
                                        className="w-full bg-brand-gradient text-white py-6 rounded-[32px] font-black uppercase tracking-widest text-sm shadow-2xl shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 stroke-[4]" />}
                                        Publish Highlight
                                    </button>
                                    <button 
                                        onClick={() => setStep('select')}
                                        className="w-full py-5 rounded-[28px] bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-text-muted font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManageHighlights;
