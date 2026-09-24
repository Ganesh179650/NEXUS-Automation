import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY_ENABLED = 'nexus_biometric_enabled';
const STORAGE_KEY_PIN = 'nexus_biometric_pin';

export function useBiometricLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  });
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ENABLED) === 'true';
  });
  const [securityPin, setSecurityPinState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_PIN) || '';
  });

  const isAttemptingAuth = useRef(false);

  // Check hardware and browser support for WebAuthn platform authenticators (Fingerprint, Face ID, Device PIN)
  useEffect(() => {
    async function checkSupport() {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch (e) {
          console.warn('Biometric support check error:', e);
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    }
    checkSupport();
  }, []);

  // Set or update security PIN
  const setSecurityPin = useCallback((pin) => {
    localStorage.setItem(STORAGE_KEY_PIN, pin);
    setSecurityPinState(pin);
  }, []);

  // Turn ON Biometric / App Lock
  const enableBiometricLock = useCallback(async (customPin = '') => {
    if (customPin) {
      localStorage.setItem(STORAGE_KEY_PIN, customPin);
      setSecurityPinState(customPin);
    }

    if (window.PublicKeyCredential && isSupported) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'Nexus Home IoT' },
            user: {
              id: new Uint8Array(16),
              name: 'nexus_user',
              displayName: 'Nexus IoT User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
            },
            timeout: 60000,
          },
        });

        if (credential) {
          localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
          setIsEnabled(true);
          setIsLocked(false);
          return { success: true, method: 'biometric' };
        }
      } catch (err) {
        console.warn('WebAuthn registration skipped/failed:', err);
        // Fall back to enabling with PIN if PIN exists or was provided
        if (customPin || localStorage.getItem(STORAGE_KEY_PIN)) {
          localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
          setIsEnabled(true);
          setIsLocked(false);
          return { success: true, method: 'pin' };
        }
        return { success: false, error: err?.message || 'Verification cancelled' };
      }
    }

    // Enable with PIN fallback if biometrics not available
    if (customPin || localStorage.getItem(STORAGE_KEY_PIN)) {
      localStorage.setItem(STORAGE_KEY_ENABLED, 'true');
      setIsEnabled(true);
      setIsLocked(false);
      return { success: true, method: 'pin' };
    }

    return { success: false, error: 'No PIN set and Biometrics unavailable' };
  }, [isSupported]);

  // Turn OFF Biometric / App Lock
  const disableBiometricLock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ENABLED);
    setIsEnabled(false);
    setIsLocked(false);
  }, []);

  // Unlock with Fingerprint / Face ID / Phone Lock Screen PIN
  const unlockWithBiometrics = useCallback(async () => {
    if (isAttemptingAuth.current) return false;
    isAttemptingAuth.current = true;

    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        const credential = await navigator.credentials.get({
          publicKey: {
            challenge,
            timeout: 60000,
            userVerification: 'required',
          },
        });

        if (credential) {
          setIsLocked(false);
          isAttemptingAuth.current = false;
          return true;
        }
      }
    } catch (err) {
      console.warn('Biometric unlock cancelled or failed:', err);
    } finally {
      isAttemptingAuth.current = false;
    }
    return false;
  }, []);

  // Unlock with Fallback App Security PIN
  const unlockWithPIN = useCallback((enteredPin) => {
    const savedPin = localStorage.getItem(STORAGE_KEY_PIN);
    if (savedPin && enteredPin === savedPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  // Manually lock app
  const lockApp = useCallback(() => {
    if (isEnabled) {
      setIsLocked(true);
    }
  }, [isEnabled]);

  // PhonePe-style Background Auto-Lock Listener:
  // Immediately locks when phone is locked, app is minimized, or user switches tabs
  useEffect(() => {
    if (!isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsLocked(true);
      }
    };

    const handleBlur = () => {
      // Optional: lock when window loses focus (e.g. app switching)
      setIsLocked(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isEnabled]);

  return {
    isSupported,
    isEnabled,
    isLocked,
    securityPin,
    setSecurityPin,
    enableBiometricLock,
    disableBiometricLock,
    unlockWithBiometrics,
    unlockWithPIN,
    lockApp,
  };
}
