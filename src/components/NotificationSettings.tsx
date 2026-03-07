import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Bell, BellOff, Send, Info, AlertCircle } from "lucide-react";
import { triggerHaptic, HapticType } from "../utils/haptics";
import { subscribeToNotifications, testNotification, checkNotificationPermission, unsubscribeFromNotifications } from "../utils/notifications";
import { cn } from "../lib/utils";

interface NotificationSettingsProps {
  onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const [notificationStatus, setNotificationStatus] = useState(checkNotificationPermission());
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    triggerHaptic(HapticType.LIGHT);
    
    // First unsubscribe to clear any stale state
    await unsubscribeFromNotifications();
    
    const success = await subscribeToNotifications();
    if (success) {
      setNotificationStatus('granted');
    } else {
      setNotificationStatus(checkNotificationPermission());
    }
    setIsSubscribing(false);
  };

  const handleReset = async () => {
    setIsSubscribing(true);
    triggerHaptic(HapticType.MEDIUM);
    await unsubscribeFromNotifications();
    const success = await subscribeToNotifications();
    if (success) {
      setNotificationStatus('granted');
    } else {
      setNotificationStatus(checkNotificationPermission());
    }
    setIsSubscribing(false);
  };

  const handleTestNotification = async () => {
    await testNotification();
    triggerHaptic(HapticType.SUCCESS);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button 
          onClick={() => {
            triggerHaptic(HapticType.LIGHT);
            onBack();
          }}
          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 active:scale-90 transition-all shadow-sm"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-zinc-900 dark:text-white">Notifications</h2>
      </div>

      <div className="p-6 space-y-8">
        {/* Status Card */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">Status</h3>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                  notificationStatus === 'granted' 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 scale-110"
                    : notificationStatus === 'denied'
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                    : "bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                )}>
                  {notificationStatus === 'granted' ? <Bell size={28} /> : <BellOff size={28} />}
                </div>
                <div className="text-left">
                  <p className="font-black text-zinc-900 dark:text-white text-lg">Hourly Reminders</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    {notificationStatus === 'granted' 
                      ? "Active and running" 
                      : notificationStatus === 'denied'
                      ? "Blocked by browser"
                      : "Disabled"}
                  </p>
                </div>
              </div>
            </div>

            {notificationStatus === 'denied' ? (
              <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100/50 dark:border-red-800/50 flex gap-3">
                <AlertCircle size={18} className="text-red-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] text-red-700 dark:text-red-400 font-bold uppercase tracking-tight">Access Blocked</p>
                  <p className="text-[11px] text-red-600/70 dark:text-red-400/70 font-medium leading-relaxed">
                    You've blocked notifications. To enable them, you must reset permissions in your browser or phone settings.
                  </p>
                </div>
              </div>
            ) : notificationStatus !== 'granted' ? (
              <button
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ENABLING...</span>
                  </>
                ) : (
                  "ENABLE NOTIFICATIONS"
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50 flex gap-3">
                  <Info size={18} className="text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed">
                    "If you buy anything, kindly add it to your list!" — You'll receive this reminder every hour.
                  </p>
                </div>
                
                <button
                  onClick={handleTestNotification}
                  className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  <span>SEND TEST NOTIFICATION</span>
                </button>

                <button
                  onClick={handleReset}
                  disabled={isSubscribing}
                  className="w-full py-3 text-zinc-400 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-widest hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {isSubscribing ? "RESETTING..." : "Reset Subscription"}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Info Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">How it works</h3>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs shrink-0">1</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed pt-1">
                We use the standard Web Push API to send reminders directly to your device.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs shrink-0">2</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed pt-1">
                Reminders are sent every hour to help you stay on top of your budget.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs shrink-0">3</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed pt-1">
                This works even if the app is closed, as long as you've added it to your Home Screen.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
