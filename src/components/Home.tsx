import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, orderBy, limit, Timestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { Expense } from "../types";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import { Plus, Search, TrendingUp, Wallet, Clock, Tag, Trash2, Edit2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { triggerHaptic, HapticType } from "../utils/haptics";
import { BudgetAdvisor } from "./BudgetAdvisor";

export const Home: React.FC<{ onAddClick: () => void; onEditExpense: (expense: Expense) => void }> = ({ onAddClick, onEditExpense }) => {
  const { user, isNewUser } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [quickAdds, setQuickAdds] = useState<{name: string, category: string}[]>([]);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "expenses"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Expense[] = [];
      let total = 0;
      let today = 0;
      const startOfToday = new Date().setHours(0, 0, 0, 0);

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Expense, 'id'>;
        const item = { ...data, id: doc.id } as Expense;
        items.push(item);
        total += item.amount * item.quantity;
        if (item.timestamp >= startOfToday) {
          today += item.amount * item.quantity;
        }
      });

      // Sort in-memory to avoid index requirement
      items.sort((a, b) => b.timestamp - a.timestamp);

      setExpenses(items);
      setTotalExpense(total);
      setTodayExpense(today);

      // Simple logic for quick adds: most frequent items
      const counts: Record<string, {count: number, category: string}> = {};
      items.forEach(item => {
        if (!counts[item.name]) counts[item.name] = { count: 0, category: item.category || 'General' };
        counts[item.name].count++;
      });
      const sorted = Object.entries(counts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4)
        .map(([name, data]) => ({ name, category: data.category }));
      setQuickAdds(sorted);
    }, (error) => {
      console.error("Snapshot error:", error);
    });

    return unsubscribe;
  }, [user]);

  const handleQuickAdd = async (item: {name: string, category: string}) => {
    if (!user) return;
    triggerHaptic(HapticType.LIGHT);
    try {
      // Find the last price for this item
      const lastItem = expenses.find(e => e.name === item.name);
      await addDoc(collection(db, "expenses"), {
        userId: user.uid,
        name: item.name,
        amount: lastItem?.amount || 0,
        quantity: 1,
        category: item.category,
        timestamp: Date.now()
      });
      triggerHaptic(HapticType.SUCCESS);
    } catch (error) {
      console.error("Quick add failed", error);
      triggerHaptic(HapticType.ERROR);
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      await deleteDoc(doc(db, "expenses", expenseToDelete.id));
      setExpenseToDelete(null);
      triggerHaptic(HapticType.SUCCESS);
    } catch (error) {
      console.error("Delete failed", error);
      triggerHaptic(HapticType.ERROR);
    }
  };

  return (
    <div className="pt-[calc(180px+var(--safe-top))] pb-32">
      {/* Fixed Header Section */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 shadow-sm w-full md:max-w-2xl lg:max-w-4xl mx-auto pt-safe">
        {/* Welcome Header */}
        <div className="p-4 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Hi, {user?.displayName?.split(' ')[0] || 'User'}</p>
              <h1 className="text-xl font-black text-zinc-900 dark:text-white">
                {isNewUser ? "Welcome to Budgetbee 🐝" : "Welcome Back! 🐝"}
              </h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user?.displayName?.[0]}</span>
              )}
            </div>
          </div>

          {/* Total Section */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-500 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
              <div className="flex items-center space-x-2 mb-1 opacity-80">
                <Wallet size={12} />
                <span className="text-[9px] uppercase tracking-widest font-black">Total spent</span>
              </div>
              <p className="text-xl font-black tracking-tight">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center space-x-2 mb-1 text-zinc-400 dark:text-zinc-500">
                <TrendingUp size={12} />
                <span className="text-[9px] uppercase tracking-widest font-black">Today's Spend</span>
              </div>
              <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">₹{todayExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Quick Add */}
        {quickAdds.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 ml-1">
              <h2 className="text-slate-500 dark:text-slate-400 text-[15px] font-bold">Quick Add</h2>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">Frequent</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {quickAdds.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAdd(item)}
                  className="group flex items-center bg-white dark:bg-zinc-900 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 px-4 py-2.5 rounded-2xl transition-all active:scale-95 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm"
                >
                  <Plus size={14} className="mr-2 text-emerald-500 group-hover:rotate-90 transition-transform" />
                  <span className="text-slate-700 dark:text-zinc-300 text-[14px] font-bold">{item.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* AI Budget Advisor */}
        <BudgetAdvisor expenses={expenses} />

        {/* Recently Added */}
        <section>
          <div className="flex items-center justify-between mb-4 ml-1">
            <h2 className="text-slate-500 dark:text-slate-400 text-[15px] font-bold">Recently Added</h2>
          </div>
          
          <div className="space-y-3">
            {expenses.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No expenses yet. Tap + to start!</p>
                </div>
              ) : (
                expenses.map((expense) => (
                  <div key={expense.id} className="relative group">
                    {/* Background Actions */}
                    <div className="absolute inset-0 flex items-center justify-between px-6 rounded-2xl overflow-hidden">
                      <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <Edit2 size={18} />
                        <span className="text-xs">Edit</span>
                      </div>
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 font-bold">
                        <span className="text-xs">Delete</span>
                        <Trash2 size={18} />
                      </div>
                    </div>

                    {/* Draggable Card */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      dragSnapToOrigin
                      onDragEnd={(_, info) => {
                        if (info.offset.x > 80) {
                          triggerHaptic(HapticType.MEDIUM);
                          onEditExpense(expense);
                        } else if (info.offset.x < -80) {
                          triggerHaptic(HapticType.WARNING);
                          setExpenseToDelete(expense);
                        }
                      }}
                      className="relative bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] dark:shadow-black/20 flex items-center justify-between group active:scale-[0.98] transition-all z-10 border border-transparent dark:border-zinc-800/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">{expense.name}</h3>
                          {expense.quantity > 1 && (
                            <span className="text-[11px] font-black bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                              X{expense.quantity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-400 dark:text-zinc-500">
                          <Clock size={14} />
                          <span className="text-[13px] font-medium">
                            {format(expense.timestamp, 'dd MMM, hh:mm a')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[19px] font-bold text-slate-900 dark:text-white tracking-tight">
                          ₹{(expense.amount * expense.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {expense.quantity > 1 && (
                          <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
                            ₹{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </div>
                ))
              )}
            </div>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {expenseToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpenseToDelete(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xs bg-white dark:bg-zinc-900 rounded-[32px] p-8 z-[80] shadow-2xl text-center border border-zinc-100 dark:border-zinc-800"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 dark:text-red-400 mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Delete Expense?</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-8">Are you sure you want to delete "{expenseToDelete.name}"? This action cannot be undone.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExpenseToDelete(null)}
                  className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
                  className="p-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-100 dark:shadow-red-900/20 active:scale-95 transition-all"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
