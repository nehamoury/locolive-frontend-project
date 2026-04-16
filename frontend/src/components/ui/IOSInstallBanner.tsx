import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, ChevronRight } from 'lucide-react';

export const IOSInstallBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // iOS detection including iPadOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasDismissed = localStorage.getItem('ios_install_dismissed') === 'true';

    // Session-based visit tracking
    const hasVisitedSession = sessionStorage.getItem('ios_install_session_visited');

    if (!hasVisitedSession) {
      const visitCount = parseInt(localStorage.getItem('ios_install_visits') || '0', 10);
      localStorage.setItem('ios_install_visits', String(visitCount + 1));
      sessionStorage.setItem('ios_install_session_visited', 'true');
    }

    const visitCount = parseInt(localStorage.getItem('ios_install_visits') || '0', 10);
    const shouldShow = isIOS && !isStandalone && !wasDismissed && visitCount >= 1;

    let timer: ReturnType<typeof setTimeout> | null = null;

    if (shouldShow) {
      timer = setTimeout(() => setIsVisible(true), 30000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('ios_install_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-4 bottom-24 md:bottom-8 z-[100] max-w-md mx-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Add Locolive to Home Screen</h3>
                  <p className="text-white/80 text-xs">Better offline experience</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm text-center">
                Follow these steps to install Locolive on your device:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Step 1</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Tap the <span className="font-medium text-gray-700 dark:text-gray-300">Share</span> icon below your browser's address bar
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Step 2</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Scroll down and tap <span className="font-medium text-gray-700 dark:text-gray-300">"Add to Home Screen"</span>
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-green-500">✓</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">Step 3</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Tap <span className="font-medium text-gray-700 dark:text-gray-300">"Add"</span> in the top right corner
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};