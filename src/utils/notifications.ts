import { triggerHaptic, HapticType } from "./haptics";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToNotifications = async () => {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Get public key from server
    const keyResponse = await fetch('/api/vapid-public-key');
    if (!keyResponse.ok) throw new Error('Failed to fetch VAPID key');
    const { publicKey } = await keyResponse.json();
    
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Found existing subscription, refreshing...');
      // If we have one, we might want to unsubscribe and resubscribe to be safe
      // but for now let's just use it and ensure the server has it
    } else {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    // Send subscription to server
    const subResponse = await fetch('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!subResponse.ok) throw new Error('Failed to send subscription to server');

    triggerHaptic(HapticType.SUCCESS);
    return true;
  } catch (error) {
    console.error('Failed to subscribe to notifications', error);
    triggerHaptic(HapticType.ERROR);
    return false;
  }
};

export const unsubscribeFromNotifications = async () => {
  try {
    if (!('serviceWorker' in navigator)) return false;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Tell server to remove it
      await fetch('/api/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Unsubscribe locally
      await subscription.unsubscribe();
      triggerHaptic(HapticType.LIGHT);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe', error);
    return false;
  }
};

export const testNotification = async () => {
  try {
    await fetch('/api/test-notification', { method: 'POST' });
    triggerHaptic(HapticType.LIGHT);
  } catch (error) {
    console.error('Failed to send test notification', error);
  }
};

export const checkNotificationPermission = () => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};
