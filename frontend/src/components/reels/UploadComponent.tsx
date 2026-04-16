import React, { useRef, useState, useCallback } from 'react';
import { Upload, Video, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface UploadComponentProps {
  onFileSelect: (file: File) => void;
  isImageOnly?: boolean;
}

const UploadComponent: React.FC<UploadComponentProps> = ({ onFileSelect, isImageOnly = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage || (!isImageOnly && isVideo)) {
      onFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative w-full h-[400px] md:h-full flex flex-col items-center justify-center p-8 transition-all duration-500 overflow-hidden ${isDragging ? 'bg-primary/5 ring-4 ring-primary/20 ring-inset' : 'bg-zinc-950/20'}`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        accept={isImageOnly ? 'image/*' : 'video/*,image/*'}
        className="hidden"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 text-center z-10"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fileInputRef.current?.click()}
          className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-300 border-2 border-dashed ${isDragging ? 'border-primary bg-primary/20' : 'border-white/10 bg-white/5 hover:border-primary/50'}`}
        >
          <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-zinc-500'}`} />
        </motion.button>

        <div className="space-y-2">
          <h4 className="text-lg font-black text-text-base italic tracking-tight uppercase">Upload Media</h4>
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest max-w-[200px]">
            Drag & drop images or videos (max 100MB)
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <Video className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Video</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <ImageIcon className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Image</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadComponent;
