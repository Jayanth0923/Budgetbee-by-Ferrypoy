import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, LogOut } from "lucide-react";
import { triggerHaptic, HapticType } from "../utils/haptics";

interface ExitConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-amber-600 dark:text-amber-500" size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
              Exit Budgetbee?
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
              Are you sure you want to close the app? Any unsaved changes might be lost.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  triggerHaptic(HapticType.LIGHT);
                  onClose();
                }}
                className="flex items-center justify-center space-x-2 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
              
              <button
                onClick={() => {
                  triggerHaptic(HapticType.MEDIUM);
                  onConfirm();
                }}
                className="flex items-center justify-center space-x-2 p-4 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-semibold hover:opacity-90 transition-opacity"
              >
                <LogOut size={18} />
                <span>Exit App</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
