import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw, ChevronRight } from "lucide-react";
import { getBudgetInsights } from "../services/geminiService";
import { Expense } from "../types";
import { triggerHaptic, HapticType } from "../utils/haptics";
import ReactMarkdown from "react-markdown";

interface BudgetAdvisorProps {
  expenses: Expense[];
}

export const BudgetAdvisor: React.FC<BudgetAdvisorProps> = ({ expenses }) => {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchInsights = async () => {
    if (expenses.length === 0) return;
    setLoading(true);
    triggerHaptic(HapticType.LIGHT);
    const result = await getBudgetInsights(expenses);
    setInsights(result || "No insights available.");
    setLoading(false);
  };

  useEffect(() => {
    if (expenses.length > 0 && !insights) {
      fetchInsights();
    }
  }, [expenses]);

  if (expenses.length === 0) return null;

  return (
    <div className="mt-8 px-1">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => {
            setIsExpanded(!isExpanded);
            triggerHaptic(HapticType.LIGHT);
          }}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
            <Sparkles size={18} />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">AI Insights</h3>
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <ChevronRight size={16} className="text-zinc-400" />
            </motion.div>
          </div>
        </button>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <motion.div 
        initial={false}
        animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="overflow-hidden"
      >
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm relative overflow-hidden mb-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-3/4 animate-pulse" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-1/2 animate-pulse" />
                <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-2/3 animate-pulse" />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                <div className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed markdown-body">
                  <ReactMarkdown>{insights || ""}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest">Powered by Gemini</span>
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-emerald-500/10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
