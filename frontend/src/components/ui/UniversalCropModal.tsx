import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, ArrowLeft, ImageIcon, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';

interface CropSettings {
    ratio: string;
    zoom: number;
    position: { x: number; y: number };
}

interface UniversalCropModalProps {
    file: File;
    isOpen: boolean;
    onConfirm: (settings: CropSettings) => void;
    onCancel: () => void;
}

const RATIOS = [
    { label: 'Original', value: 'original', icon: ImageIcon },
    { label: '1:1', value: '1/1', icon: Square },
    { label: '4:5', value: '4/5', icon: RectangleVertical },
    { label: '16:9', value: '16/9', icon: RectangleHorizontal },
    { label: '9:16', value: '9/16', icon: RectangleVertical },
];

const UniversalCropModal: React.FC<UniversalCropModalProps> = ({ file, isOpen, onConfirm, onCancel }) => {
    const [ratio, setRatio] = useState('original');
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(false);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const isImage = file.type.startsWith('image/');

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setMediaUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleConfirm = () => {
        onConfirm({ ratio, zoom, position });
    };

    if (!isOpen || !mediaUrl) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 sm:p-10"
            >
                {/* Header */}
                <div className="absolute top-0 w-full p-6 md:p-10 flex items-center justify-between z-10">
                    <button 
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all text-sm font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </button>
                    
                    <div className="hidden md:flex flex-col items-center">
                        <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Crop Media</h3>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Professional Studio</p>
                    </div>

                    <button 
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-brand-gradient text-white rounded-full text-sm font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Next
                    </button>
                </div>

                {/* Main Editor Slot */}
                <div className="relative flex flex-col lg:flex-row gap-8 lg:gap-16 items-center justify-center w-full max-w-6xl h-full pt-20 pb-10">
                    
                    {/* Viewport Container */}
                    <div className="relative w-full max-w-[500px] h-full max-h-[500px] lg:max-h-none flex items-center justify-center">
                        <div 
                            className="relative w-full overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl transition-all duration-500 rounded-2xl md:rounded-[2.5rem]"
                            style={{ 
                                aspectRatio: ratio === 'original' ? 'auto' : ratio,
                                maxHeight: '100%',
                                maxWidth: '100%',
                            }}
                        >
                            {/* Blurred Background */}
                            {isImage ? (
                                <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-150" alt="" />
                            ) : (
                                <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-150" muted playsInline autoPlay loop />
                            )}

                            {/* Grid Overlay */}
                            <AnimatePresence>
                                {showGrid && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-10 pointer-events-none"
                                    >
                                        <div className="absolute inset-0 border border-white/10" />
                                        <div className="absolute top-1/3 w-full h-[0.5px] bg-white/20" />
                                        <div className="absolute top-2/3 w-full h-[0.5px] bg-white/20" />
                                        <div className="absolute left-1/3 h-full w-[0.5px] bg-white/20" />
                                        <div className="absolute left-2/3 h-full w-[0.5px] bg-white/20" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Draggable Media */}
                            <motion.div
                                drag
                                dragConstraints={{ top: -500, left: -500, right: 500, bottom: 500 }}
                                onDragStart={() => setShowGrid(true)}
                                onDragEnd={(_e, info) => {
                                    setShowGrid(false);
                                    setPosition({ x: info.point.x, y: info.point.y });
                                }}
                                style={{ x: position.x, y: position.y, scale: zoom }}
                                className="w-full h-full flex items-center justify-center cursor-move"
                            >
                                {isImage ? (
                                    <img 
                                        src={mediaUrl} 
                                        className="w-full h-full object-contain pointer-events-none select-none" 
                                        alt="" 
                                    />
                                ) : (
                                    <video 
                                        src={mediaUrl} 
                                        className="w-full h-full object-contain pointer-events-none" 
                                        muted 
                                        playsInline 
                                        autoPlay 
                                        loop 
                                    />
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="w-full max-w-[320px] space-y-8 pb-10 lg:pb-0">
                        {/* Aspect Ratio Selector */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Aspect Ratio</label>
                            <div className="grid grid-cols-5 gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                                {RATIOS.map((r) => (
                                    <button
                                        key={r.value}
                                        onClick={() => {
                                            setRatio(r.value);
                                            setPosition({ x: 0, y: 0 });
                                        }}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all gap-1.5 ${ratio === r.value ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                                        title={r.label}
                                    >
                                        <r.icon className="w-4 h-4" />
                                        <span className="text-[8px] font-black uppercase tracking-tight">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Zoom Control */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                                <span>Zoom Adjustment</span>
                                <span className="text-white">{(zoom * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                <button onClick={() => setZoom(Math.max(1, zoom - 0.1))} className="text-white/40 hover:text-white"><ZoomOut className="w-5 h-5" /></button>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="3" 
                                    step="0.01"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                                    className="flex-1 h-1 bg-white/10 accent-primary rounded-full appearance-none cursor-pointer"
                                />
                                <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="text-white/40 hover:text-white"><ZoomIn className="w-5 h-5" /></button>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="p-6 bg-brand-gradient/5 rounded-[2rem] border border-pink-500/20 flex items-start gap-4">
                            <div className="w-10 h-10 shrink-0 rounded-2xl bg-brand-gradient flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                                <Maximize2 className="w-5 h-5" />
                            </div>
                            <p className="text-[11px] text-white/50 font-bold leading-relaxed">
                                <span className="text-white">Pro Tip:</span> Drag your media to center the focus. Use the grid overlay for the rule of thirds.
                            </p>
                        </div>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UniversalCropModal;
