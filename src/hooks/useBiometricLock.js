import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY_ENABLED = 'nexus_biometric_enabled';
const STORAGE_KEY_PIN = 'nexus_biometric_pin';
const STORAGE_KEY_CRED_ID = 'nexus_biometric_cred_id';

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

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
              residentKey: 'discouraged',
              requireResidentKey: false,
            },
            timeout: 60000,
          },
        });

        if (credential) {
          if (credential.rawId) {
            try {
              localStorage.setItem(STORAGE_KEY_CRED_ID, bufferToBase64(credential.rawId));
            } catch (e) {
              console.warn('Could not store rawId:', e);
            }
          }
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
    localStorage.removeItem(STORAGE_KEY_CRED_ID);
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

        const publicKeyOpts = {
          challenge,
          timeout: 60000,
          userVerification: 'required',
        };

        const storedCredId = localStorage.getItem(STORAGE_KEY_CRED_ID);
        if (storedCredId) {
          try {
            publicKeyOpts.allowCredentials = [
              {
                id: base64ToBuffer(storedCredId),
                type: 'public-key',
                transports: ['internal'],
              },
            ];
          } catch (e) {
            console.warn('Error parsing stored cred ID:', e);
          }
        }

        let credential;
        try {
          credential = await navigator.credentials.get({
            publicKey: publicKeyOpts,
          });
        } catch (getErr) {
          // Fallback if targeted passkey was invalid state
          if (storedCredId && getErr.name === 'InvalidStateError') {
            const fallbackOpts = { ...publicKeyOpts };
            delete fallbackOpts.allowCredentials;
            credential = await navigator.credentials.get({
              publicKey: fallbackOpts,
            });
          } else {
            throw getErr;
          }
        }

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

  // Background Auto-Lock Listener:
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
