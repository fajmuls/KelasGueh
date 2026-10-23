/**
 * Utility for PWA Web Notifications
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Browser ini tidak mendukung notifikasi.');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendLocalNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: '/logo/Kelas_Gueh_Logo_Static.svg',
      badge: '/logo/Kelas_Gueh_Logo_Static.svg',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    // Fallback for some mobile browsers that require Service Worker registration
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          icon: '/logo/Kelas_Gueh_Logo_Static.svg',
          badge: '/logo/Kelas_Gueh_Logo_Static.svg',
          ...options,
        });
      });
    }
  }
};

export const schedulePaymentReminder = (memberName: string, amount: number) => {
  const title = '💰 Pengingat Iuran Kas';
  const body = `Halo ${memberName}, jangan lupa bayar iuran kas kelas ya! Total: Rp ${amount.toLocaleString('id-ID')}.`;
  
  sendLocalNotification(title, { body });
};
