import React, { useRef, useState, useCallback } from 'react';
import { Upload } from 'lucide-react';
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
      className={`relative w-full h-[400px] md:h-full flex flex-col items-center justify-center p-8 transition-all duration-500 overflow-hidden ${isDragging ? 'bg-primary/5 ring-4 ring-primary/10 ring-inset' : 'bg-gray-50'}`}
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
          className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-all duration-300 border-2 border-dashed ${isDragging ? 'border-primary bg-primary/20' : 'border-gray-200 bg-white hover:border-primary/50'}`}
        >
          <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
        </motion.button>

        <div className="space-y-2">
          <h4 className="text-lg font-black text-text-base tracking-tight uppercase">Upload Media</h4>
        </div>
      </motion.div>
    </div>
  );
};

export default UploadComponent;
