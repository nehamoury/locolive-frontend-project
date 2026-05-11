import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCcw, 
  User, 
  Flag, 
  Settings,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useNavigate } from 'react-router-dom';

interface ReelOptionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onDelete?: () => void;
  username: string;
  userId: string;
}

const ReelOptionsBottomSheet: React.FC<ReelOptionsBottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  isOwner, 
  onDelete,
  username,
  userId
}) => {
  const navigate = useNavigate();
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string; icon: React.ReactNode } | null>(null);

  const showInfo = (title: string, message: string, icon: React.ReactNode = <Sparkles className="w-8 h-8 text-primary" />) => {
    setInfoModal({ isOpen: true, title, message, icon });
    onClose(); // Close the bottom sheet first
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1c1c1c] text-white rounded-t-[24px] overflow-hidden safe-area-bottom max-w-lg mx-auto"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* List Actions */}
              <div className="flex flex-col px-2 pb-8">
                <ListButton 
                  icon={<RefreshCcw className="w-5 h-5" />} 
                  label="Remix" 
                  onClick={() => showInfo('Remix', 'Remix feature is currently under development and will be available in the next update!')} 
                />
                <ListButton 
                  icon={<User className="w-5 h-5" />} 
                  label={`About this account (@${username})`} 
                  onClick={() => {
                    onClose();
                    navigate(`/dashboard/user/${userId}`);
                  }} 
                />
                
                {isOwner ? (
                  <ListButton 
                    icon={<Trash2 className="w-5 h-5" />} 
                    label="Delete" 
                    variant="danger" 
                    onClick={() => { onDelete?.(); onClose(); }}
                  />
                ) : (
                  <ListButton 
                    icon={<Flag className="w-5 h-5" />} 
                    label="Report" 
                    variant="danger" 
                    onClick={() => showInfo('Report', 'Thank you for reporting. Our safety team will review this content shortly to ensure it follows our guidelines.', <Flag className="w-8 h-8 text-red-500" />)} 
                  />
                )}
                
                <ListButton 
                  icon={<Settings className="w-5 h-5" />} 
                  label="Manage content preferences" 
                  onClick={() => showInfo('Preferences', 'Custom content filters and algorithmic preferences are being fine-tuned for your account.', <Settings className="w-8 h-8 text-primary" />)} 
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Custom Info Modal (Replaces Alerts) */}
      <Modal 
        isOpen={!!infoModal?.isOpen} 
        onClose={() => setInfoModal(null)}
        title={infoModal?.title}
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center mb-6 shadow-lg shadow-primary/5">
            {infoModal?.icon}
          </div>
          <h3 className="text-[18px] font-black text-black mb-3 uppercase tracking-tight">
            {infoModal?.title}
          </h3>
          <p className="text-[14px] text-gray-600 font-medium leading-relaxed max-w-[280px]">
            {infoModal?.message}
          </p>
          <button
            onClick={() => setInfoModal(null)}
            className="mt-8 w-full py-4 bg-primary text-white rounded-[20px] font-black uppercase tracking-[2px] text-[11px] shadow-xl shadow-pink-500/20 active:scale-95 transition-all"
          >
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
};



const ListButton = ({ 
  icon, 
  label, 
  variant = 'default', 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  variant?: 'default' | 'danger';
  onClick?: () => void;
}) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-4 px-4 py-4 hover:bg-white/5 rounded-xl transition-all text-left w-full cursor-pointer"
  >
    <div className={`${variant === 'danger' ? 'text-red-500' : 'text-white/90'}`}>
      {icon}
    </div>
    <span className={`text-[15px] font-medium ${variant === 'danger' ? 'text-red-500' : 'text-white/90'}`}>
      {label}
    </span>
  </button>
);

export default ReelOptionsBottomSheet;
