import React from "react";
import { motion } from "motion/react";
import { ChevronLeft, HelpCircle, Mail, MessageSquare, Info, Heart, ExternalLink, Copy, Check } from "lucide-react";
import { triggerHaptic, HapticType } from "../utils/haptics";
import { useState } from "react";

interface SupportPagesProps {
  view: "help" | "contact" | "feedback" | "about" | "donate";
  onBack: () => void;
}

export const SupportPages: React.FC<SupportPagesProps> = ({ view, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const upiId = "jayanthmuddulurt2004-1@oksbi";
  const name = "Jayanth";

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    triggerHaptic(HapticType.SUCCESS);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderContent = () => {
    switch (view) {
      case "help":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {[
                  { q: "How do I add an expense?", a: "Click the '+' button in the bottom navigation bar to add a new expense." },
                  { q: "Can I export my data?", a: "Yes, go to Settings > Data Management and click 'Download Excel Report'." },
                  { q: "Is my data secure?", a: "Your data is stored securely in Firebase and is only accessible by you." },
                  { q: "How do I change the theme?", a: "In Settings > Appearance, you can choose between Light, Dark, or System themes." }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">{item.q}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="space-y-4">
            <a 
              href="mailto:support@ferrypot.com"
              className="block bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm active:scale-[0.98] transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Mail size={24} />
                </div>
                <div>
                  <p className="font-bold text-zinc-900 dark:text-white">Email Support</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">support@ferrypot.com</p>
                </div>
              </div>
            </a>
            <div className="bg-zinc-100 dark:bg-zinc-800/50 p-6 rounded-[32px] text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">We usually respond within 24 hours.</p>
            </div>
          </div>
        );
      case "feedback":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
              <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-6">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Share your thoughts</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">Your feedback helps us make Budgetbee by Ferrypot better for everyone.</p>
              <button 
                onClick={() => window.open("https://forms.gle/placeholder", "_blank")}
                className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-200 dark:shadow-orange-900/20 active:scale-95 transition-all"
              >
                Open Feedback Form
              </button>
            </div>
          </div>
        );
      case "about":
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
              <div className="w-24 h-24 bg-emerald-500 rounded-[32px] flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/20">
                <span className="text-4xl font-black">B</span>
              </div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-1">Budgetbee by Ferrypot</h3>
              <p className="text-emerald-500 font-bold text-sm mb-6">Version 1.0.0</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed mb-8">
                Budgetbee by Ferrypot is a simple, intuitive expense tracker designed to help you take control of your finances. Developed with love by Ferrypot.
              </p>
              <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-300 dark:text-zinc-600 font-black uppercase tracking-widest">© 2024 Ferrypot Apps</p>
              </div>
            </div>
          </div>
        );
      case "donate":
        const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&cu=INR`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-zinc-100 dark:border-zinc-800 shadow-sm text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <Heart size={40} fill="currentColor" />
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Support Budgetbee by Ferrypot</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">If you find this app helpful, consider making a contribution to support its development.</p>
              
              {/* Toggle Switch */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-8 max-w-[240px] mx-auto">
                <button 
                  onClick={() => { triggerHaptic(HapticType.LIGHT); setShowQR(true); }}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${showQR ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'}`}
                >
                  QR Code
                </button>
                <button 
                  onClick={() => { triggerHaptic(HapticType.LIGHT); setShowQR(false); }}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${!showQR ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'}`}
                >
                  UPI ID
                </button>
              </div>

              <div className="mb-8">
                {showQR ? (
                  <div className="bg-zinc-50 dark:bg-white p-6 rounded-3xl inline-block border border-zinc-100 shadow-inner">
                    <img 
                      src={qrUrl} 
                      alt="UPI QR Code" 
                      className="w-48 h-48"
                      referrerPolicy="no-referrer"
                    />
                    <p className="mt-4 text-[10px] text-zinc-400 font-black uppercase tracking-widest">Scan to Pay</p>
                  </div>
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-2">UPI ID for Contribution</p>
                    <div className="flex items-center justify-center space-x-3">
                      <span className="font-mono font-bold text-zinc-900 dark:text-white break-all">{upiId}</span>
                      <button 
                        onClick={handleCopyUPI}
                        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors flex-shrink-0"
                      >
                        {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} className="text-zinc-400" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => {
                    triggerHaptic(HapticType.MEDIUM);
                    window.location.href = upiUrl;
                  }}
                  className="w-full py-4 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-200 dark:shadow-red-900/20 active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                  <ExternalLink size={20} />
                  <span>Pay via UPI App</span>
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-medium px-8">
              Your contributions help keep Budgetbee by Ferrypot ad-free and support future updates. Thank you for your kindness!
            </p>
          </div>
        );
    }
  };

  const titles = {
    help: "Help Center",
    contact: "Contact Us",
    feedback: "Feedback",
    about: "About Us",
    donate: "Donate & Support"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 pb-32"
    >
      <header className="flex items-center mb-8">
        <button 
          onClick={() => {
            triggerHaptic(HapticType.LIGHT);
            onBack();
          }}
          className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white shadow-sm active:scale-90 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="ml-4 text-xl font-black text-zinc-900 dark:text-white">{titles[view]}</h2>
      </header>

      {renderContent()}
    </motion.div>
  );
};
