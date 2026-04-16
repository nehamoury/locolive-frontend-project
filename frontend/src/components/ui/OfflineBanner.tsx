import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useNetwork } from '../../context/useNetwork';

export const OfflineBanner = () => {
  const { isOnline } = useNetwork();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4 text-white" />
            <p className="text-white text-sm font-medium">
              You are offline — some features may not work
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
