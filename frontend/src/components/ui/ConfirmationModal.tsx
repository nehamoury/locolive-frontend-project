import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  children
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const colors = {
    danger: {
      bg: 'bg-[#FF3B8E]', // Brand Pink instead of Red for consistency
      text: 'text-[#FF3B8E]',
      border: 'border-[#FF3B8E]/10',
      light: 'bg-[#FF3B8E]/5',
      hover: 'hover:bg-[#FF3B8E]/90'
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-500',
      border: 'border-amber-100',
      light: 'bg-amber-50',
      hover: 'hover:bg-amber-600'
    },
    info: {
      bg: 'bg-[#FF3B8E]',
      text: 'text-[#FF3B8E]',
      border: 'border-[#FF3B8E]/10',
      light: 'bg-[#FF3B8E]/5',
      hover: 'hover:bg-[#FF3B8E]/90'
    }
  };

  const style = colors[type];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[280px] bg-white rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.1)] overflow-hidden border border-border-base"
          >
            {/* Header with Icon */}
            <div className="pt-8 pb-4 px-6 flex flex-col items-center text-center">
              <div className={`w-16 h-16 ${style.light} rounded-3xl flex items-center justify-center mb-5 border border-border-base/50`}>
                <AlertCircle className={`w-8 h-8 ${style.text}`} />
              </div>
              
              <h3 className="text-lg font-black text-text-base uppercase tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-[12px] font-bold text-text-muted leading-relaxed">
                {message}
              </p>
              
              {children && (
                <div className="w-full mt-4">
                  {children}
                </div>
              )}
            </div>

            <div className="p-6 pt-2 flex flex-row gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 bg-gray-50 text-text-muted text-[10px] font-black uppercase tracking-[1px] rounded-[20px] hover:bg-gray-100 transition-all active:scale-95 border border-border-base"
              >
                {cancelText}
              </button>

              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3.5 ${style.bg} text-white text-[10px] font-black uppercase tracking-[1px] rounded-[20px] shadow-lg shadow-pink-500/10 transition-all active:scale-95 ${style.hover}`}
              >
                {confirmText}
              </button>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-300 dark:text-white/20 hover:text-text-base dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmationModal;
