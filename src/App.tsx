/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./ThemeContext";
import { SplashScreen } from "./components/SplashScreen";
import { Login } from "./components/Login";
import { Home } from "./components/Home";
import { Settings } from "./components/Settings";
import { AddItemModal } from "./components/AddItemModal";
import { ExitConfirmationModal } from "./components/ExitConfirmationModal";
import { motion, AnimatePresence } from "motion/react";
import { Home as HomeIcon, Settings as SettingsIcon, Plus } from "lucide-react";
import { Expense } from "./types";
import { triggerHaptic, HapticType } from "./utils/haptics";
import { cn } from "./lib/utils";

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<"home" | "settings">("home");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const scrollPositions = React.useRef<Record<string, number>>({});
  const isModalOpenRef = React.useRef(false);
  const isSuccessRef = React.useRef(false);

  useEffect(() => {
    isModalOpenRef.current = isAddModalOpen;
  }, [isAddModalOpen]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const wasModalOpen = isModalOpenRef.current;

      if (event.state?.modal === "add") {
        setIsAddModalOpen(true);
        // Keep the tab that was active when modal opened
        if (event.state.tab) setActiveTab(event.state.tab);
      } else {
        setIsAddModalOpen(false);
        
        if (wasModalOpen) {
          if (isSuccessRef.current) {
            // Requirement: Success Add should always go to Home
            setActiveTab("home");
            isSuccessRef.current = false;
            // Ensure we stay on home state in history
            window.history.replaceState({ tab: "home" }, "");
          } else {
            // Requirement: Exit (X) should return to the previous tab
            setActiveTab(event.state?.tab || "home");
          }
        } else if (event.state?.tab) {
          setActiveTab(event.state.tab);
        } else if (!event.state) {
          // We hit the beginning of history while on Home
          if (activeTab === "home") {
            setShowExitConfirm(true);
            // Push state back so they stay on home if they cancel
            window.history.pushState({ tab: "home" }, "");
          } else {
            // If they were on settings and hit back to null, go to home
            setActiveTab("home");
            window.history.replaceState({ tab: "home" }, "");
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    
    // Initial state setup to prime the history stack
    if (!window.history.state) {
      window.history.replaceState({ tab: "home" }, "");
      // Push an extra state so the first "back" button press is caught by popstate
      window.history.pushState({ tab: "home" }, "");
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);

  const handleExitApp = () => {
    // In a web app, we can't always close the window, but we try
    try {
      window.close();
      // Fallback for browsers that block window.close()
      window.location.href = "about:blank";
    } catch (e) {
      window.location.href = "https://google.com";
    }
  };

  // Save scroll position before switching tabs
  const navigateToTab = (tab: "home" | "settings") => {
    if (tab === activeTab) return;
    
    scrollPositions.current[activeTab] = window.scrollY;
    setActiveTab(tab);
    // Use replaceState to avoid navigation loops
    window.history.replaceState({ tab }, "");
    triggerHaptic(HapticType.LIGHT);
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
    // Push state so back button closes modal and returns to current tab
    window.history.pushState({ tab: activeTab, modal: "add" }, "");
    triggerHaptic(HapticType.MEDIUM);
  };

  const handleCloseModal = (isSuccess: boolean = false) => {
    if (isSuccess) {
      isSuccessRef.current = true;
    }
    
    if (window.history.state?.modal === "add") {
      window.history.back();
    } else {
      setIsAddModalOpen(false);
      if (isSuccess) {
        setActiveTab("home");
      }
    }
    setExpenseToEdit(null);
  };

  // Restore scroll position after tab switch
  useEffect(() => {
    const savedScroll = scrollPositions.current[activeTab] || 0;
    // Small delay to ensure content is rendered
    setTimeout(() => {
      window.scrollTo({ top: savedScroll, behavior: "instant" as any });
    }, 0);
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      // Only set to home if we're not already on a specific tab from history
      if (!window.history.state?.tab) {
        setActiveTab("home");
      }
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleEditExpense = (expense: Expense) => {
    setExpenseToEdit(expense);
    openAddModal();
  };

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 w-full md:max-w-2xl lg:max-w-4xl mx-auto relative overflow-x-hidden md:border-x md:border-zinc-200 dark:md:border-zinc-800">
      {/* SVG Filter for Liquid/Gooey effect */}
      <svg className="hidden">
        <defs>
          <filter id="liquid-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: activeTab === 'home' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: activeTab === 'home' ? 20 : -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "home" ? (
            <Home onAddClick={openAddModal} onEditExpense={handleEditExpense} />
          ) : (
            <Settings />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-[calc(1.2rem+var(--safe-bottom))] px-6 pointer-events-none">
        <motion.nav 
          layout
          className="pointer-events-auto w-full max-w-[320px] bg-white/90 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-full border border-zinc-200 dark:border-white/10 p-1.5 flex items-center justify-between shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          style={{ filter: "url(#liquid-goo)" }}
        >
          <button
            onClick={() => navigateToTab("home")}
            className="flex-1 flex flex-col items-center py-2.5 rounded-full relative z-10"
          >
            {activeTab === "home" && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full"
                transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.7, rotate: -10 }}
              className={activeTab === "home" ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}
            >
              <HomeIcon size={20} strokeWidth={activeTab === "home" ? 2.5 : 2} />
            </motion.div>
            <span className={cn(
              "text-[9px] font-black mt-0.5 uppercase tracking-wider relative z-10",
              activeTab === "home" ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-400 dark:text-zinc-500"
            )}>Home</span>
          </button>

          <motion.button
            layout
            whileTap={{ scale: 0.8, rotate: 90 }}
            onClick={openAddModal}
            className="mx-1 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/40 relative z-20"
          >
            <Plus size={24} strokeWidth={3} />
          </motion.button>

          <button
            onClick={() => navigateToTab("settings")}
            className="flex-1 flex flex-col items-center py-2.5 rounded-full relative z-10"
          >
            {activeTab === "settings" && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full"
                transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.7, rotate: 10 }}
              className={activeTab === "settings" ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-400 dark:text-zinc-500"}
            >
              <SettingsIcon size={20} strokeWidth={activeTab === "settings" ? 2.5 : 2} />
            </motion.div>
            <span className={cn(
              "text-[9px] font-black mt-0.5 uppercase tracking-wider relative z-10",
              activeTab === "settings" ? "text-emerald-600 dark:text-emerald-500" : "text-zinc-400 dark:text-zinc-500"
            )}>Settings</span>
          </button>
        </motion.nav>
      </div>

      <AddItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => handleCloseModal(false)} 
        onSuccess={() => handleCloseModal(true)}
        editExpense={expenseToEdit} 
      />
      <ExitConfirmationModal 
        isOpen={showExitConfirm} 
        onClose={() => setShowExitConfirm(false)} 
        onConfirm={handleExitApp} 
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
