import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCcw, 
  User, 
  Flag, 
  Settings
} from 'lucide-react';

interface ReelOptionsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onDelete?: () => void;
  username: string;
}

const ReelOptionsBottomSheet: React.FC<ReelOptionsBottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  isOwner, 
  onDelete,
  username
}) => {
  return (
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
              <ListButton icon={<RefreshCcw className="w-5 h-5" />} label="Remix" onClick={() => { alert('Remix coming soon!'); onClose(); }} />
              <ListButton icon={<User className="w-5 h-5" />} label={`About this account (@${username})`} onClick={() => { alert('Account info coming soon!'); onClose(); }} />
              
              {isOwner ? (
                <ListButton 
                  icon={<Flag className="w-5 h-5" />} 
                  label="Delete" 
                  variant="danger" 
                  onClick={() => { onDelete?.(); onClose(); }}
                />
              ) : (
                <ListButton icon={<Flag className="w-5 h-5" />} label="Report" variant="danger" onClick={() => { alert('Thank you for reporting. We will review this content.'); onClose(); }} />
              )}
              
              <ListButton icon={<Settings className="w-5 h-5" />} label="Manage content preferences" onClick={() => { alert('Content preferences coming soon!'); onClose(); }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
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
    className="flex items-center gap-4 px-4 py-4 hover:bg-white/5 rounded-xl transition-all text-left"
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
