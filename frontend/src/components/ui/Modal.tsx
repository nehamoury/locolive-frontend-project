import * as React from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 z-[200] flex items-center justify-center p-6"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[280px] md:max-w-md bg-white border border-border-base rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.05)] z-[201] overflow-hidden"
          >
            <div className="flex items-center justify-between p-7 pb-2">
              {title ? (
                <h2 className="text-xl font-black text-text-base uppercase tracking-tight pl-2">
                  {title}
                </h2>
              ) : (
                <div className="w-10 h-10" />
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-300 hover:text-text-base transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-8 text-text-base">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export { Modal }
