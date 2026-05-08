import { type FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
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
        setLoading(true);
        try {
            const { data } = await api.get('/stories/archived');
            // Support both direct array or wrapped object
            const archives = Array.isArray(data) ? data : (data?.archives || []);
            setArchivedStories(archives);
        } catch (error) {
            console.error('Failed to load archives:', error);
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
            const selectedStory = archivedStories.find(s => s.id === selectedStories[0]);
            const { data: highlight } = await api.post('/highlights', {
                title: newHighlight.title,
                cover_url: newHighlight.cover_url || (selectedStory?.media_url || '')
            });

            // 2. Add selected stories to the group
            await Promise.all(selectedStories.map(storyId => 
                api.post(`/highlights/${highlight.id}/stories`, {
                    archived_story_id: storyId
                })
            ));

            toast.success('Highlight created successfully!');
            // Dispatch event to refresh profile
            window.dispatchEvent(new CustomEvent('highlight_created'));
            onBack();
        } catch (error) {
            console.error('Failed to create highlight:', error);
            toast.error('Failed to create highlight');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white md:rounded-[32px] gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin" />
                    <FolderPlus className="w-6 h-6 text-pink-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Opening your vault...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white md:rounded-[32px] relative overflow-hidden shadow-sm border border-gray-100">
            {/* Header */}
            <div className="px-6 py-6 md:px-10 border-b border-gray-50 bg-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={onBack}
                        className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-all text-slate-600 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight ">Create Highlight</h1>
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mt-0.5">
                            {step === 'select' ? `Select Stories (${selectedStories.length})` : 'Name your collection'}
                        </p>
                    </div>
                </div>

                <AnimatePresence>
                    {selectedStories.length > 0 && step === 'select' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setStep('details')}
                            className="bg-brand-gradient text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-pink-500/20 active:scale-95 transition-all flex items-center gap-2"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar bg-gray-50/30">
                <AnimatePresence mode="wait">
                    {step === 'select' ? (
                        <motion.div 
                            key="select"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {archivedStories.map((story) => (
                                    <div 
                                        key={story.id}
                                        onClick={() => handleToggleSelect(story.id)}
                                        className="relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group border-2 transition-all duration-300 shadow-sm"
                                        style={{ 
                                            borderColor: selectedStories.includes(story.id) ? '#ec4899' : 'transparent' 
                                        }}
                                    >
                                        <img 
                                            src={getMediaUrl(story.media_url, FALLBACKS.POST)}
                                            className={cn(
                                                "w-full h-full object-cover transition-transform duration-700",
                                                selectedStories.includes(story.id) ? "scale-105 opacity-80" : "group-hover:scale-110"
                                            )}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                        
                                        {/* Selection Indicator */}
                                        <div className={cn(
                                            "absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all",
                                            selectedStories.includes(story.id) ? "bg-pink-500 scale-110 shadow-lg" : "bg-black/20 backdrop-blur-md"
                                        )}>
                                            {selectedStories.includes(story.id) && <Check className="w-3 h-3 text-white stroke-[4]" />}
                                        </div>

                                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3 text-white/90" />
                                            <span className="text-[9px] font-black text-white/90 uppercase tracking-tighter">
                                                {story.created_at ? new Date(story.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {archivedStories.length === 0 && (
                                    <div className="col-span-full py-20 flex flex-col items-center gap-6 text-center">
                                        <div className="w-24 h-24 rounded-[40px] bg-white border border-gray-100 flex items-center justify-center shadow-xl rotate-3">
                                            <FolderPlus className="w-10 h-10 text-pink-500/30" />
                                        </div>
                                        <div className="space-y-3 max-w-xs px-6">
                                            <h3 className="text-xl font-black text-slate-800  uppercase">Your Vault is Empty</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                                                Stories are automatically saved to your vault after they expire. Check back later!
                                            </p>
                                        </div>
                                        <button 
                                            onClick={onBack}
                                            className="mt-4 px-6 py-3 bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:bg-gray-200 transition-all"
                                        >
                                            Go Back
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="details"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-md mx-auto space-y-10 py-6"
                        >
                            <div 
                                className="relative group mx-auto w-44 h-44 cursor-pointer"
                                onClick={() => {
                                    // Cycle through selected stories for cover
                                    const currentIndex = selectedStories.indexOf(newHighlight.cover_url || selectedStories[0]);
                                    const nextIndex = (currentIndex + 1) % selectedStories.length;
                                    const nextStoryId = selectedStories[nextIndex];
                                    const nextStory = archivedStories.find(s => s.id === nextStoryId);
                                    if (nextStory) {
                                        setNewHighlight(prev => ({ ...prev, cover_url: nextStory.media_url }));
                                        toast.success('Cover image updated', { icon: '🖼️', duration: 1000 });
                                    }
                                }}
                            >
                                <div className="w-full h-full rounded-[56px] overflow-hidden border-[6px] border-white shadow-2xl bg-white ring-1 ring-black/5 group-hover:scale-105 transition-transform duration-500">
                                    <img 
                                        src={getMediaUrl(newHighlight.cover_url || archivedStories.find(s => s.id === selectedStories[0])?.media_url, FALLBACKS.POST)}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Cover</span>
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-pink-500 shadow-xl group-hover:rotate-12 transition-transform">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Highlight Name</label>
                                    <input 
                                        type="text"
                                        autoFocus
                                        value={newHighlight.title}
                                        onChange={(e) => setNewHighlight(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Summer Memories"
                                        className="w-full px-8 py-5 rounded-[24px] bg-white border border-gray-100 focus:ring-4 focus:ring-pink-500/5 focus:border-pink-500/30 outline-none font-black text-slate-800 text-lg transition-all shadow-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-3 pt-6">
                                    <button 
                                        onClick={handleCreateHighlight}
                                        disabled={isCreating}
                                        className="w-full bg-brand-gradient text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 stroke-[4]" />}
                                        Publish Highlight
                                    </button>
                                    <button 
                                        onClick={() => setStep('select')}
                                        className="w-full py-4 rounded-[20px] text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-all"
                                    >
                                        Back to selection
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
