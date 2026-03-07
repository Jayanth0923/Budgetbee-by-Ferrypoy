import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, IndianRupee, Hash, Tag, Package } from "lucide-react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../AuthContext";
import { cn } from "../lib/utils";
import { Expense } from "../types";
import { triggerHaptic, HapticType } from "../utils/haptics";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editExpense?: Expense | null;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSuccess, editExpense }) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [category, setCategory] = useState("General");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editExpense) {
      setName(editExpense.name);
      setAmount(editExpense.amount.toString());
      setQuantity(editExpense.quantity.toString());
      setCategory(editExpense.category || "General");
    } else {
      setName("");
      setAmount("");
      setQuantity("1");
      setCategory("General");
    }
  }, [editExpense, isOpen]);

  const categories = ["General", "Food", "Transport", "Shopping", "Bills", "Entertainment", "Health"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user || !name || !amount) return;

    const parsedAmount = parseFloat(amount);
    const parsedQuantity = parseInt(quantity);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      triggerHaptic(HapticType.WARNING);
      return;
    }

    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setError("Please enter a valid quantity of 1 or more.");
      triggerHaptic(HapticType.WARNING);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editExpense) {
        const expenseRef = doc(db, "expenses", editExpense.id);
        await updateDoc(expenseRef, {
          name,
          amount: parsedAmount,
          quantity: parsedQuantity,
          category,
        });
      } else {
        await addDoc(collection(db, "expenses"), {
          userId: user.uid,
          name,
          amount: parsedAmount,
          quantity: parsedQuantity,
          category,
          timestamp: Date.now()
        });
      }
      triggerHaptic(HapticType.SUCCESS);
      // Reset state first
      setName("");
      setAmount("");
      setQuantity("1");
      setCategory("General");
      setError(null);
      // Then close with success
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error: any) {
      console.error("Failed to save expense", error);
      triggerHaptic(HapticType.ERROR);
      alert("Failed to save expense: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 pb-[calc(2rem+var(--safe-bottom))] z-50 shadow-2xl border-t border-zinc-100 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{editExpense ? "Edit Expense" : "Add Expense"}</h2>
              <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-xs font-bold"
                >
                  {error}
                </motion.div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Item Name</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" size={18} />
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What did you buy?"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Price (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" size={18} />
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Quantity</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" size={18} />
                    <input
                      required
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        triggerHaptic(HapticType.LIGHT);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        category === cat
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full bg-emerald-500 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Expense</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
