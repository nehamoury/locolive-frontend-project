import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, 
  RefreshCcw, 
  QrCode, 
  Info, 
  EyeOff, 
  Heart, 
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

            {/* Top Grid Actions */}
            <div className="grid grid-cols-3 gap-1 px-4 mb-4">
              <ActionButton icon={<Bookmark className="w-6 h-6" />} label="Save" />
              <ActionButton icon={<RefreshCcw className="w-6 h-6" />} label="Remix" />
              <ActionButton icon={<QrCode className="w-6 h-6" />} label="QR code" />
            </div>

            <div className="h-[1px] bg-white/5 mx-4 mb-2" />

            {/* List Actions */}
            <div className="flex flex-col px-2 pb-8">
              <ListButton icon={<Info className="w-5 h-5" />} label="Why you're seeing this post" />
              <ListButton icon={<EyeOff className="w-5 h-5" />} label="Not interested" />
              <ListButton icon={<Heart className="w-5 h-5" />} label="Interested" />
              <ListButton icon={<User className="w-5 h-5" />} label={`About this account (@${username})`} />
              
              {isOwner ? (
                <ListButton 
                  icon={<Flag className="w-5 h-5" />} 
                  label="Delete" 
                  variant="danger" 
                  onClick={onDelete}
                />
              ) : (
                <ListButton icon={<Flag className="w-5 h-5" />} label="Report" variant="danger" />
              )}
              
              <ListButton icon={<Settings className="w-5 h-5" />} label="Manage content preferences" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ActionButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 rounded-2xl transition-all"
  >
    <div className="w-14 h-14 flex items-center justify-center rounded-full border border-white/20">
      {icon}
    </div>
    <span className="text-[11px] font-medium text-white/80">{label}</span>
  </button>
);

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
