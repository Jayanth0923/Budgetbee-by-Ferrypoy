import React from "react";
import { motion } from "motion/react";

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-emerald-500 flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl">🐝</span>
        </div>
        <h1 className="text-white text-3xl font-bold tracking-tight">Budgetbee</h1>
        <p className="text-emerald-100 mt-2 font-medium">by Ferrypot</p>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-12 flex space-x-2"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <div className="w-2 h-2 bg-white rounded-full" />
        <div className="w-2 h-2 bg-white rounded-full" />
        <div className="w-2 h-2 bg-white rounded-full" />
      </motion.div>
    </div>
  );
};
