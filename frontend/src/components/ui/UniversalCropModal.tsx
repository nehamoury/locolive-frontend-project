import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, ArrowLeft, ImageIcon, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
interface CropSettings {
    ratio: string;
    zoom: number;
    position: { x: number; y: number };
    pixelCrop?: Area;
}

interface UniversalCropModalProps {
    file: File;
    isOpen: boolean;
    onConfirm: (settings: CropSettings) => void;
    onCancel: () => void;
    initialRatio?: string;
}

const RATIOS = [
    { label: 'Original', value: 'original', icon: ImageIcon, aspect: undefined },
    { label: '1:1', value: '1/1', icon: Square, aspect: 1 },
    { label: '4:5', value: '4/5', icon: RectangleVertical, aspect: 4/5 },
    { label: '16:9', value: '16/9', icon: RectangleHorizontal, aspect: 16/9 },
    { label: '9:16', value: '9/16', icon: RectangleVertical, aspect: 9/16 },
];

const UniversalCropModal: React.FC<UniversalCropModalProps> = ({ file, isOpen, onConfirm, onCancel, initialRatio = 'original' }) => {
    const [ratio, setRatio] = useState(initialRatio);
    const [zoom, setZoom] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [pixelCrop, setPixelCrop] = useState<Area | null>(null);
    const [mediaUrl] = useState(() => URL.createObjectURL(file));

    const selectedRatio = RATIOS.find(r => r.value === ratio) || RATIOS[0];

    const onCropComplete = useCallback((_showArea: Area, croppedAreaPixels: Area) => {
        setPixelCrop(croppedAreaPixels);
    }, []);

    const handleConfirm = () => {
        if (pixelCrop) {
            onConfirm({ 
                ratio, 
                zoom, 
                position: crop, 
                pixelCrop 
            });
        }
    };

    if (!isOpen || !mediaUrl) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
            >
                {/* Header */}
                <div className="absolute top-0 w-full p-6 md:p-10 flex items-center justify-between z-[10010]">
                    <button 
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-all text-sm font-bold uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Cancel</span>
                    </button>
                    
                    <div className="hidden md:flex flex-col items-center">
                        <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Crop Image</h3>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Precision Studio</p>
                    </div>

                    <button 
                        onClick={handleConfirm}
                        className="px-8 py-2.5 bg-brand-gradient text-white rounded-full text-sm font-black uppercase tracking-widest shadow-xl shadow-pink-500/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        Done
                    </button>
                </div>

                {/* Main Editor */}
                <div className="relative w-full h-full flex flex-col items-center justify-center pt-20 pb-32">
                    <div className="relative w-full max-w-4xl h-full rounded-3xl overflow-hidden bg-zinc-950/50 shadow-2xl border border-white/5">
                        <Cropper
                            image={mediaUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={selectedRatio.aspect}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            showGrid={true}
                            classes={{
                                containerClassName: "bg-zinc-950",
                                mediaClassName: "transition-none",
                                cropAreaClassName: "border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                            }}
                        />
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="absolute bottom-0 w-full p-6 md:p-10 flex flex-col md:flex-row items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent z-[10010]">
                    {/* Zoom Slider */}
                    <div className="flex items-center gap-4 w-full max-w-xs bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
                        <ZoomOut className="w-4 h-4 text-white/40" />
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none accent-primary cursor-pointer"
                        />
                        <ZoomIn className="w-4 h-4 text-white/40" />
                    </div>

                    {/* Aspect Ratios */}
                    <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-x-auto no-scrollbar max-w-full">
                        {RATIOS.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => setRatio(r.value)}
                                className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all gap-1 min-w-[60px] ${ratio === r.value ? 'bg-brand-gradient text-white shadow-lg' : 'text-white/40 hover:text-white/70'}`}
                            >
                                <r.icon className="w-3.5 h-3.5" />
                                <span className="text-[9px] font-black uppercase tracking-tight">{r.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="hidden lg:flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                        <Maximize2 className="w-4 h-4 text-primary" />
                        <p className="text-[10px] text-white/50 font-bold max-w-[120px] leading-tight">
                            Drag to position. <br/>Center the focus.
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UniversalCropModal;
