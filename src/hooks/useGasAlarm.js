import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Helper to write string into DataView for WAV RIFF header
 */
function writeWavString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Programmatically synthesizes a 1-second 44.1kHz 16-bit PCM WAV dual-tone siren (880Hz <-> 523Hz) Data URI.
 * HTML5 <audio> elements playing this WAV Data URI continue to play continuously in the background
 * and when the mobile phone screen is locked.
 */
function createSirenWavDataUri() {
  if (typeof window === 'undefined') return '';
  try {
    const sampleRate = 44100;
    const numSamples = sampleRate * 1; // 1 second loop
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF Header
    writeWavString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeWavString(view, 8, 'WAVE');

    // fmt subchunk
    writeWavString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono channel
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit depth

    // data subchunk
    writeWavString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Alternating 880Hz / 523.25Hz siren wave PCM data
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = (t % 0.5) < 0.25 ? 880 : 523.25;
      const sample = Math.sin(2 * Math.PI * freq * t);
      const intSample = Math.floor(sample * 30000);
      view.setInt16(44 + i * 2, intSample, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return 'data:audio/wav;base64,' + window.btoa(binary);
  } catch (e) {
    console.error('Failed to generate emergency siren WAV Data URI:', e);
    return '';
  }
}

/**
 * Custom hook for High Gas Sensor (> 1500 ADC) Alert, Phone Vibration, and Emergency Siren.
 * Supports continuous background monitoring, lock-screen siren audio playback (HTML5 Audio + MediaSession),
 * mobile phone vibration API, and Service Worker lock-screen notifications.
 */
export function useGasAlarm(gasValue, isDeviceOffline = false) {
  const [alarmThreshold, setAlarmThreshold] = useState(1500);
  const [isSilenced, setIsSilenced] = useState(false);
  const [pwaOnlyMode, setPwaOnlyMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      );
    }
    return false;
  });
  const [isStandalone, setIsStandalone] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);
  const bgAudioRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const vibrationIntervalRef = useRef(null);
  const lastNotifiedValueRef = useRef(null);

  // Initialize HTML5 Background Siren Audio Element (works in background & lock screen)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const wavUri = createSirenWavDataUri();
      if (wavUri) {
        const audio = new Audio(wavUri);
        audio.loop = true;
        audio.volume = 1.0;
        bgAudioRef.current = audio;
      }
    }
    return () => {
      if (bgAudioRef.current) {
        try {
          bgAudioRef.current.pause();
          bgAudioRef.current = null;
        } catch (_) {}
      }
    };
  }, []);

  // 1. Detect Standalone PWA mode
  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(standalone);
      if (standalone) {
        setPwaOnlyMode(true);
      }
    };

    checkStandalone();
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkStandalone);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
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

  // 3. Foreground Web Audio API Synthesizer
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
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;

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
      console.error('Foreground Audio synthesizer error:', e);
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

  // 4. Background HTML5 Emergency Audio Siren (plays in background & lock screen)
  const startBackgroundSiren = useCallback(() => {
    try {
      if (bgAudioRef.current) {
        bgAudioRef.current.currentTime = 0;
        bgAudioRef.current.volume = 1.0;
        const playPromise = bgAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Background HTML5 siren audio playback pending gesture unlock:', err);
          });
        }
      }
      if (typeof window !== 'undefined' && 'navigator' in window && 'mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: '🚨 DANGER: HIGH GAS LEAK DETECTED!',
          artist: 'NEXUS HOME IoT Safety Monitor',
          album: 'High Gas Level (> 1500 ADC) Emergency Siren',
          artwork: [
            { src: '/App_image.png', sizes: '192x192', type: 'image/png' },
            { src: '/App_image.png', sizes: '512x512', type: 'image/png' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    } catch (e) {
      console.error('Failed to trigger background HTML5 siren:', e);
    }
  }, []);

  const stopBackgroundSiren = useCallback(() => {
    try {
      if (bgAudioRef.current) {
        bgAudioRef.current.pause();
        bgAudioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && 'navigator' in window && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    } catch (_) {}
  }, []);

  // 5. Mobile Hardware Vibration API
  const startVibration = useCallback(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      const triggerVibe = () => {
        try {
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
        navigator.vibrate(0);
      } catch (_) {}
    }
  }, []);

  // 6. Check if Alarm Condition is Active
  const numGas = Number(gasValue);
  const isThresholdExceeded = !isDeviceOffline && !isNaN(numGas) && numGas > alarmThreshold;
  const isAppCriteriaMet = !pwaOnlyMode || isStandalone;
  const isAlarmTriggered = (isThresholdExceeded || isTesting) && isAppCriteriaMet;

  // 7. Reset Silence Flag when Gas drops back to normal safety levels
  useEffect(() => {
    if (!isThresholdExceeded && !isTesting) {
      setIsSilenced(false);
      lastNotifiedValueRef.current = null;
    }
  }, [isThresholdExceeded, isTesting]);

  // 8. Handle Siren, Vibration, and Push Notification Triggers
  useEffect(() => {
    if (isAlarmTriggered && !isSilenced) {
      // Start Foreground Web Audio Siren
      startBuzzerSound();

      // Start Lock Screen / Background HTML5 Audio Siren
      startBackgroundSiren();

      // Start Mobile Phone Vibration
      startVibration();

      // Send Native Lock-Screen System Push Notification
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
            requireInteraction: true,
            vibrate: [600, 200, 600, 200, 1000],
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

          lastNotifiedValueRef.current = numGas;
        } catch (e) {
          console.error('Failed to trigger notification', e);
        }
      }
    } else {
      stopBuzzerSound();
      stopBackgroundSiren();
      stopVibration();
    }

    return () => {
      stopBuzzerSound();
      stopBackgroundSiren();
      stopVibration();
    };
  }, [isAlarmTriggered, isSilenced, numGas, alarmThreshold, isTesting, startBuzzerSound, startBackgroundSiren, stopBuzzerSound, stopBackgroundSiren, startVibration, stopVibration]);

  // 9. Continuous Lock-Screen & App Background Monitor (Handles document.visibilitychange, focus, blur)
  useEffect(() => {
    const handleVisibilityOrLockState = () => {
      if (isAlarmTriggered && !isSilenced) {
        startBackgroundSiren();
        startBuzzerSound();
        startVibration();

        // Send persistent notification on lock screen if document is hidden
        if (document.hidden && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const currentVal = isTesting ? 2450 : numGas;
          const title = '🚨 DANGER: HIGH GAS LEAK DETECTED!';
          const options = {
            body: `Gas Sensor value (${currentVal} ADC) exceeded safety threshold of ${alarmThreshold}! Open windows immediately.`,
            icon: '/App_image.png',
            badge: '/App_image.png',
            tag: 'gas-leak-alert',
            renotify: true,
            requireInteraction: true,
            vibrate: [600, 200, 600, 200, 1000],
            data: { url: '/dashboard' },
          };

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((reg) => {
              if (reg && reg.showNotification) reg.showNotification(title, options);
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrLockState);
    window.addEventListener('focus', handleVisibilityOrLockState);
    window.addEventListener('blur', handleVisibilityOrLockState);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrLockState);
      window.removeEventListener('focus', handleVisibilityOrLockState);
      window.removeEventListener('blur', handleVisibilityOrLockState);
    };
  }, [isAlarmTriggered, isSilenced, isTesting, numGas, alarmThreshold, startBackgroundSiren, startBuzzerSound, startVibration]);

  // 10. Silence current alarm
  const silenceAlarm = useCallback(() => {
    setIsSilenced(true);
    stopBuzzerSound();
    stopBackgroundSiren();
    stopVibration();
  }, [stopBuzzerSound, stopBackgroundSiren, stopVibration]);

  // 11. Unlock Audio context & HTML5 audio on first user gesture
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
    if (bgAudioRef.current) {
      bgAudioRef.current.play().then(() => {
        bgAudioRef.current.pause();
      }).catch(() => {});
    }
    setAudioUnlocked(true);
  }, []);

  // Pre-unlock audio on any user gesture across the app
  useEffect(() => {
    const handleGesture = () => {
      unlockAudioContext();
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };

    window.addEventListener('touchstart', handleGesture, { once: true });
    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });

    return () => {
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [unlockAudioContext]);

  // 12. Test Alarm for 4.5 seconds
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
