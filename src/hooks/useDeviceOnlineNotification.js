import { useEffect, useRef } from 'react';

/**
 * Custom hook to push native system / lock-screen notifications when the IoT device
 * comes back ONLINE after being in Offline Control mode with active devices.
 */
export function useDeviceOnlineNotification({
  isOfflineControlEnabled = false,
  isDeviceOffline = false,
  isCheckingTelemetry = true,
  statusDetermined = false,
  data = {},
}) {
  const prevOfflineStateRef = useRef(true);
  const wasOfflineControlActiveRef = useRef(false);
  const hadActiveDeviceRef = useRef(false);

  // Compute active devices
  const door1Open = (data.servo1 || 0) > 45;
  const door2Open = (data.servo2 || 0) > 45;
  const led1On = data.led1 === 1 || data.led1 === true || data.led1 === '1';
  const led2On = data.led2 === 1 || data.led2 === true || data.led2 === '1';
  const motorOn = data.motor === 1 || data.motor === true || data.motor === '1';

  const activeDeviceNames = [];
  if (door1Open) activeDeviceNames.push('Door 1');
  if (door2Open) activeDeviceNames.push('Door 2');
  if (led1On) activeDeviceNames.push('LED 1 Light');
  if (led2On) activeDeviceNames.push('LED 2 Light');
  if (motorOn) activeDeviceNames.push('Motor Fan');

  const isAnyDeviceOn = activeDeviceNames.length > 0;
  const isCurrentlyOffline = isDeviceOffline || isCheckingTelemetry || !statusDetermined;
  const isCurrentlyOnline = !isDeviceOffline && !isCheckingTelemetry && statusDetermined;

  // Track state while offline control is enabled
  useEffect(() => {
    if (isCurrentlyOffline && isOfflineControlEnabled) {
      wasOfflineControlActiveRef.current = true;
      if (isAnyDeviceOn) {
        hadActiveDeviceRef.current = true;
      }
    }
  }, [isCurrentlyOffline, isOfflineControlEnabled, isAnyDeviceOn]);

  // Trigger push notification on transition to ONLINE
  useEffect(() => {
    const wasOffline = prevOfflineStateRef.current;

    if (wasOffline && isCurrentlyOnline) {
      const offlineControlWasActive = wasOfflineControlActiveRef.current || isOfflineControlEnabled;
      const deviceWasActive = hadActiveDeviceRef.current || isAnyDeviceOn;

      if (offlineControlWasActive && deviceWasActive) {
        // Send System Notification (Lock Screen / Drawer compatible)
        if (typeof window !== 'undefined' && 'Notification' in window) {
          const sendPushNotification = () => {
            try {
              const activeStr = activeDeviceNames.length > 0 ? activeDeviceNames.join(', ') : 'active hardware controls';
              const title = '🌐 NEXUS HOME: DEVICE IS ONLINE';
              const options = {
                body: `Hardware reconnected online! Active controls (${activeStr}) are now synchronized live with Firebase.`,
                icon: '/App_image.png',
                badge: '/App_image.png',
                tag: 'device-online-reconnect',
                renotify: true,
                requireInteraction: true,
                vibrate: [300, 100, 300, 100, 500],
                data: { url: '/dashboard' },
              };

              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready
                  .then((reg) => {
                    if (reg && reg.showNotification) {
                      reg.showNotification(title, options);
                    } else {
                      new Notification(title, options);
                    }
                  })
                  .catch(() => {
                    new Notification(title, options);
                  });
              } else {
                new Notification(title, options);
              }
            } catch (err) {
              console.error('Failed to trigger device online push notification', err);
            }
          };

          if (Notification.permission === 'granted') {
            sendPushNotification();
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then((perm) => {
              if (perm === 'granted') {
                sendPushNotification();
              }
            });
          }
        }
      }

      // Reset tracking refs on online reconnection
      wasOfflineControlActiveRef.current = false;
      hadActiveDeviceRef.current = false;
    }

    prevOfflineStateRef.current = isCurrentlyOffline;
  }, [isCurrentlyOnline, isCurrentlyOffline, isOfflineControlEnabled, isAnyDeviceOn, activeDeviceNames]);
}
