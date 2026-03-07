import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { auth, db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { LogOut, Download, HelpCircle, Mail, MessageSquare, Info, Heart, ChevronRight, X, AlertTriangle, Moon, Sun, Monitor, Bell } from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "../ThemeContext";
import { cn } from "../lib/utils";
import { triggerHaptic, HapticType } from "../utils/haptics";
import { NotificationSettings } from "./NotificationSettings";
import { SupportPages } from "./SupportPages";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [view, setView] = useState<"main" | "notifications" | "help" | "contact" | "feedback" | "about" | "donate" | "info">("main");
  const mainScrollPos = React.useRef(0);

  // Handle browser back button for sub-views
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.view) {
        setView(event.state.view);
      } else if (event.state?.tab === 'settings') {
        setView('main');
      }
    };

    window.addEventListener("popstate", handlePopState);
    
    // Check initial state if we're already in a sub-view
    if (window.history.state?.view) {
      setView(window.history.state.view);
    }

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Restore scroll position when returning to main view
  React.useEffect(() => {
    if (view === 'main' && mainScrollPos.current > 0) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo({ top: mainScrollPos.current, behavior: 'instant' as any });
      }, 0);
    }
  }, [view]);

  const navigateToView = (newView: typeof view) => {
    if (newView === view) return;
    
    if (view === 'main') {
      mainScrollPos.current = window.scrollY;
    }
    
    setView(newView);
    window.history.pushState({ tab: 'settings', view: newView }, "");
  };

  const handleBack = () => {
    triggerHaptic(HapticType.LIGHT);
    window.history.back();
  };

  if (view === "notifications") {
    return <NotificationSettings onBack={handleBack} />;
  }

  if (["help", "contact", "feedback", "about", "donate"].includes(view)) {
    return <SupportPages view={view as any} onBack={handleBack} />;
  }

  const handleLogout = () => {
    triggerHaptic(HapticType.WARNING);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    triggerHaptic(HapticType.MEDIUM);
    auth.signOut();
  };

  const exportToExcel = async () => {
    if (!user) return;
    triggerHaptic(HapticType.LIGHT);

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    const expenses: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      expenses.push({
        ...data,
        id: doc.id
      });
    });

    // Sort in-memory to avoid index requirement
    expenses.sort((a, b) => a.timestamp - b.timestamp);

    const formattedExpenses = expenses.map(data => ({
      Name: data.name,
      Price: data.amount,
      Quantity: data.quantity,
      Total: data.amount * data.quantity,
      Category: data.category,
      Date: format(data.timestamp, "dd-MM-yyyy"),
      Time: format(data.timestamp, "hh:mm a"),
      Month: format(data.timestamp, "MMMM yyyy")
    }));

    const wb = XLSX.utils.book_new();
    
    // Group by month
    const months = [...new Set(formattedExpenses.map(e => e.Month))];
    
    months.forEach(month => {
      const monthData = formattedExpenses.filter(e => e.Month === month);
      const ws = XLSX.utils.json_to_sheet(monthData);
      
      // Calculate total for the month
      const monthTotal = monthData.reduce((sum, item) => sum + item.Total, 0);
      
      // Add a summary row
      // We add it 2 rows after the last data row (1 row gap)
      const lastRow = monthData.length + 2;
      XLSX.utils.sheet_add_aoa(ws, [
        ["", "", "GRAND TOTAL", monthTotal]
      ], { origin: `A${lastRow + 1}` });

      XLSX.utils.book_append_sheet(wb, ws, month.substring(0, 31)); // Sheet name max 31 chars
    });

    XLSX.writeFile(wb, `BudgetBee_Expenses_${format(new Date(), "dd_MMM_yyyy")}.xlsx`);
    triggerHaptic(HapticType.SUCCESS);
  };

  const menuItems = [
    { icon: HelpCircle, label: "Help Center", color: "text-blue-500", bg: "bg-blue-50", view: "help" },
    { icon: Mail, label: "Contact Us", color: "text-purple-500", bg: "bg-purple-50", view: "contact" },
    { icon: MessageSquare, label: "Feedback", color: "text-orange-500", bg: "bg-orange-50", view: "feedback" },
    { icon: Info, label: "About Us", color: "text-zinc-500", bg: "bg-zinc-100", view: "about" },
    { icon: Heart, label: "Donate", color: "text-red-500", bg: "bg-red-50", view: "donate" },
  ];

  return (
    <div className="p-6 pt-[calc(1.5rem+var(--safe-top))] pb-32 space-y-8">
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-4 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-3xl text-emerald-600 dark:text-emerald-400 font-black">{user?.displayName?.[0]}</span>
          )}
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{user?.displayName}</h2>
        <p className="text-zinc-400 dark:text-zinc-500 font-medium">{user?.email}</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Data Management</h3>
        <button
          onClick={exportToExcel}
          className="w-full bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Download size={24} />
            </div>
            <div className="text-left">
              <p className="font-bold text-zinc-900 dark:text-white">Download Excel Report</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Monthly breakdown of expenses</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-zinc-300 dark:text-zinc-600" />
        </button>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Preferences</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          <button
            onClick={() => {
              triggerHaptic(HapticType.LIGHT);
              navigateToView("notifications");
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bell size={20} />
              </div>
              <span className="font-bold text-zinc-700 dark:text-zinc-300">Notifications</span>
            </div>
            <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-600" />
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Appearance</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm p-2 flex gap-1">
          {[
            { id: "system", label: "System", icon: Monitor },
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id as any);
                triggerHaptic(HapticType.LIGHT);
              }}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl transition-all",
                theme === t.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
                  : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              )}
            >
              <t.icon size={20} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Support & Info</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic(HapticType.LIGHT);
                navigateToView(item.view as any);
              }}
              className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-none active:scale-[0.98]"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-xl ${item.bg} dark:bg-zinc-800 flex items-center justify-center ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-600" />
            </button>
          ))}
        </div>
      </section>

      <div className="pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-3 p-5 rounded-3xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors active:scale-[0.98]"
        >
          <LogOut size={20} />
          <span>Logout Account</span>
        </button>
        <p className="text-center mt-8 text-[10px] text-zinc-300 dark:text-zinc-700 font-black uppercase tracking-[0.2em]">Budgetbee by Ferrypot v1.0.0</p>
      </div>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xs bg-white dark:bg-zinc-900 rounded-[32px] p-8 z-[60] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Logout?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-8">Are you sure you want to logout from Budget by Ferrypot?</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold active:scale-95 transition-all"
                >
                  No
                </button>
                <button
                  onClick={confirmLogout}
                  className="p-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-100 dark:shadow-red-900/20 active:scale-95 transition-all"
                >
                  Yes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
