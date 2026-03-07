/**
 * Utility for haptic feedback using the Vibration API.
 * Most mobile browsers support this, especially when the app is "installed" as a PWA.
 */

export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

const VIBRATION_PATTERNS: Record<HapticType, number | number[]> = {
  [HapticType.LIGHT]: 10,
  [HapticType.MEDIUM]: 20,
  [HapticType.SUCCESS]: [10, 30, 10],
  [HapticType.WARNING]: [40, 40, 40],
  [HapticType.ERROR]: [60, 100, 60],
};

export const triggerHaptic = (type: HapticType = HapticType.LIGHT) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(VIBRATION_PATTERNS[type]);
    } catch (e) {
      // Ignore vibration errors (some browsers might block it if not triggered by user interaction)
      console.warn('Haptic feedback failed:', e);
    }
  }
};
