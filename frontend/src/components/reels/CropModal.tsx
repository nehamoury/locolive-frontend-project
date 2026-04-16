import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Move, Check, X } from 'lucide-react';

interface CropModalProps {
  file: File;
  onConfirm: (processedFile: File | string) => void;
  onCancel: () => void;
}

const CropModal: React.FC<CropModalProps> = ({ file, onConfirm, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isImage = file.type.startsWith('image/');
  const mediaUrl = URL.createObjectURL(file);

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-10">
      
      {/* Header */}
      <div className="absolute top-0 w-full p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-gradient flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tight">Adjust Frame</h3>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Perfect 9:16 Alignment</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Editing Area */}
      <div className="relative flex flex-col md:flex-row gap-12 items-center justify-center w-full max-w-5xl h-full">
        
        {/* The 9:16 Viewport */}
        <div className="relative w-full max-w-[340px] aspect-[9/16] bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/20 shadow-[0_0_100px_rgba(0,0,0,1)] ring-8 ring-white/5">
            
            {/* Blurred Background (for horizontal media) */}
            {isImage ? (
                <img src={mediaUrl} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-150" alt="" />
            ) : (
                <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-150" muted playsInline autoPlay loop />
            )}

            {/* Draggable Media */}
            <motion.div
              drag
              dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
              style={{ x: position.x, y: position.y, scale: zoom }}
              onDragEnd={(_, info) => setPosition({ x: info.point.x, y: info.point.y })}
              className="w-full h-full flex items-center justify-center cursor-move"
            >
              {isImage ? (
                <img src={mediaUrl} className="w-full h-auto min-h-full object-contain pointer-events-none select-none" alt="" />
              ) : (
                <video src={mediaUrl} className="w-full h-auto min-h-full object-contain pointer-events-none" muted playsInline autoPlay loop />
              )}
            </motion.div>

            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none border-[0.5px] border-white/10 flex flex-col">
              <div className="flex-1 border-b border-white/10" />
              <div className="flex-1 border-b border-white/10" />
              <div className="flex-1" />
            </div>
            <div className="absolute inset-0 pointer-events-none flex flex-row">
              <div className="flex-1 border-r border-white/10" />
              <div className="flex-1 border-r border-white/10" />
              <div className="flex-1" />
            </div>
        </div>

        {/* Controls */}
        <div className="w-full md:w-80 space-y-10">
          
          <div className="space-y-6">
            <div className="flex items-center justify-between text-white/50 text-[11px] font-black uppercase tracking-widest">
              <span>Zoom</span>
              <span className="text-white">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-white/10 accent-primary rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between gap-4">
              <button onClick={() => setZoom(Math.max(1, zoom - 0.2))} className="flex-1 p-4 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="flex-1 p-4 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all">
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Move className="w-6 h-6" />
            </div>
            <p className="text-[12px] text-white/60 font-medium leading-relaxed">
              Drag your media to position it perfectly within the 9:16 frame.
            </p>
          </div>

          <button 
            onClick={() => onConfirm(file)} 
            className="w-full py-5 bg-brand-gradient text-white rounded-[2rem] font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Apply Changes
          </button>
        </div>

      </div>

    </div>
  );
};

export default CropModal;
