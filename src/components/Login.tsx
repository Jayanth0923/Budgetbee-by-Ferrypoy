import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { motion } from "motion/react";
import { LogIn, AlertCircle } from "lucide-react";

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      const errorCode = err.code;
      
      if (errorCode === "auth/configuration-not-found") {
        setError("Google Sign-In is not enabled in your Firebase Console.");
      } else if (errorCode === "auth/unauthorized-domain") {
        setError(`This domain (${window.location.hostname}) is not authorized in your Firebase Console. Please add it to Authentication > Settings > Authorized domains.`);
      } else if (errorCode === "auth/popup-closed-by-user" || errorCode === "auth/cancelled-popup-request") {
        // User closed the popup or clicked twice, ignore these
        setError(null);
      } else if (errorCode === "auth/popup-blocked") {
        setError("The login popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setError(err.message || "An unexpected error occurred during login.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 pt-[calc(1.5rem+var(--safe-top))] pb-[calc(1.5rem+var(--safe-bottom))]">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-8">
          <span className="text-4xl">🐝</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Budgetbee by Ferrypot</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-12">Track your daily expenses with ease and precision.</p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start space-x-3 text-left"
          >
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200">Login Issue</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 leading-relaxed">{error}</p>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-zinc-300 border-t-emerald-500 rounded-full animate-spin" />
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Continue with Google</span>
            </>
          )}
        </button>
        
        <p className="mt-8 text-xs text-zinc-400 dark:text-zinc-600">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};
