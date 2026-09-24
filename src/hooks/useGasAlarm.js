import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for High Gas Sensor (> 2300 ADC) Mobile Alert, Vibration, and Buzzer Siren.
 * Designed specifically for installed Progressive Web Apps (PWA standalone mode),
 * with support for AudioContext siren synthesis, phone vibration API, and system notifications.
 */
export function useGasAlarm(gasValue, isDeviceOffline = false) {
  const [alarmThreshold, setAlarmThreshold] = useState(2300);
  const [isSilenced, setIsSilenced] = useState(false);
  const [pwaOnlyMode, setPwaOnlyMode] = useState(true); // Only trigger when installed as app
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const lastNotifiedValueRef = useRef(null);

  // 1. Detect Standalone PWA mode
  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      // Auto-request lock screen notification permission if running in installed PWA app mode
      if (
        (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) &&
        Notification.permission === 'default'
      ) {
        Notification.requestPermission().then((perm) => {
          setNotificationPermission(perm);
        });
      }
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', checkStandalone);
      }
    };
  }, []);

  // 2. Request System Notification Permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        return perm;
      } catch (err) {
        console.error('Failed to request notification permission', err);
      }
    }
    return 'denied';
  }, []);

  // 3. Web Audio API Emergency Siren Synthesizer (Buzzer Sound)
  const startBuzzerSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioCtxRef.current = new AudioContext();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      setAudioUnlocked(true);

      // Stop existing oscillator if any
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch (_) {}
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch A5 siren base

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05); // Volume curve

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;

      // Pulsing two-tone siren effect (880Hz <-> 523Hz)
      let highTone = true;
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = setInterval(() => {
        if (oscRef.current && audioCtxRef.current) {
          const now = audioCtxRef.current.currentTime;
          oscRef.current.frequency.setValueAtTime(highTone ? 523.25 : 880, now);
          highTone = !highTone;
        }
      }, 250);
    } catch (e) {
      console.error('Audio synthesizer error:', e);
    }
  }, []);

  const stopBuzzerSound = useCallback(() => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (gainRef.current && audioCtxRef.current) {
      try {
        const now = audioCtxRef.current.currentTime;
        gainRef.current.gain.linearRampToValueAtTime(0.001, now + 0.1);
      } catch (_) {}
    }
    if (oscRef.current) {
      try {
        setTimeout(() => {
          if (oscRef.current) {
            oscRef.current.stop();
            oscRef.current.disconnect();
            oscRef.current = null;
          }
        }, 120);
      } catch (_) {}
    }
  }, []);

  // 4. Mobile Hardware Vibration API
  const startVibration = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      const triggerVibe = () => {
        try {
          // Urgent alarm pattern: 600ms vibrate, 200ms pause, 600ms vibrate, 200ms pause, 1000ms vibrate
          navigator.vibrate([600, 200, 600, 200, 1000]);
        } catch (e) {
          console.warn('Vibration failed', e);
        }
      };

      triggerVibe();
      if (vibrationIntervalRef.current) clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = setInterval(triggerVibe, 2600);
    }
  }, []);

  const stopVibration = useCallback(() => {
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0); // Cancel all vibrations
      } catch (_) {}
    }
  }, []);

  // 5. Check if Alarm Condition is Active
  const numGas = Number(gasValue);
  const isThresholdExceeded = !isDeviceOffline && !isNaN(numGas) && numGas > alarmThreshold;
  
  // Requirement: If pwaOnlyMode is ON, alert triggers ONLY when app is installed (standalone mode).
  // If pwaOnlyMode is OFF, alert triggers in browser tabs as well.
  const isAppCriteriaMet = !pwaOnlyMode || isStandalone;
  const isAlarmTriggered = (isThresholdExceeded || isTesting) && isAppCriteriaMet;

  // 6. Reset Silence Flag when Gas drops back to normal safety levels
  useEffect(() => {
    if (!isThresholdExceeded && !isTesting) {
      setIsSilenced(false);
      lastNotifiedValueRef.current = null;
    }
  }, [isThresholdExceeded, isTesting]);

  // 7. Handle Siren, Vibration, and Push Notification Triggers
  useEffect(() => {
    if (isAlarmTriggered && !isSilenced) {
      // Start Phone Audio Buzzer Siren
      startBuzzerSound();

      // Start Mobile Phone Vibration
      startVibration();

      // Send Native Lock-Screen System Push Notification (works when app is backgrounded / screen is locked)
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        lastNotifiedValueRef.current !== numGas
      ) {
        try {
          const currentVal = isTesting ? 2450 : numGas;
          const title = '🚨 DANGER: HIGH GAS LEAK DETECTED!';
          const options = {
            body: `Gas Sensor value (${currentVal} ADC) exceeded safety threshold of ${alarmThreshold}! Open windows immediately.`,
            icon: '/App_image.png',
            badge: '/App_image.png',
            tag: 'gas-leak-alert',
            renotify: true,
            requireInteraction: true, // Keeps notification persistent on lock screen / drawer like Instagram & WhatsApp
            vibrate: [600, 200, 600, 200, 1000],
            data: { url: '/dashboard' },
          };

          // Priority 1: Service Worker Lock-Screen Notification (works when app is closed / backgrounded / phone locked)
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

          lastNotifiedValueRef.current = numGas;
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }
    } else {
      stopBuzzerSound();
      stopVibration();
    }

    return () => {
      stopBuzzerSound();
      stopVibration();
    };
  }, [isAlarmTriggered, isSilenced, numGas, alarmThreshold, isTesting, startBuzzerSound, stopBuzzerSound, startVibration, stopVibration]);

  // Silence current alarm
  const silenceAlarm = useCallback(() => {
    setIsSilenced(true);
    stopBuzzerSound();
    stopVibration();
  }, [stopBuzzerSound, stopVibration]);

  // Unlock Audio context on user gesture (e.g. clicking test button or prompt)
  const unlockAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    setAudioUnlocked(true);
  }, []);

  // Test Alarm for 4 seconds
  const testAlarm = useCallback(() => {
    unlockAudioContext();
    setIsTesting(true);
    setIsSilenced(false);
    setTimeout(() => {
      setIsTesting(false);
    }, 4500);
  }, [unlockAudioContext]);

  return {
    alarmThreshold,
    setAlarmThreshold,
    isAlarmTriggered,
    isThresholdExceeded,
    isSilenced,
    silenceAlarm,
    pwaOnlyMode,
    setPwaOnlyMode,
    isStandalone,
    notificationPermission,
    requestNotificationPermission,
    audioUnlocked,
    unlockAudioContext,
    testAlarm,
    isTesting,
  };
}
