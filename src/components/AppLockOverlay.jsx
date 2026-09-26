import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, KeyRound, ShieldAlert, CheckCircle2, Delete, Sparkles } from 'lucide-react';

export default function AppLockOverlay({
  isLocked,
  isSupported,
  securityPin,
  onUnlockWithBiometrics,
  onUnlockWithPIN,
}) {
  const [showPinInput, setShowPinInput] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [bioError, setBioError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto trigger biometrics prompt on lock overlay mount or lock change
  const triggerBiometricAuth = useCallback(async () => {
    setBioError('');
    setIsAuthenticating(true);
    try {
      const success = await onUnlockWithBiometrics();
      if (!success) {
        setBioError('Biometric authentication failed or cancelled');
      }
    } catch (err) {
      setBioError('Authentication error. Try PIN code.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [onUnlockWithBiometrics]);

  useEffect(() => {
    if (isLocked) {
      setEnteredPin('');
      setPinError('');
      setBioError('');
      // Auto-trigger biometric prompt similar to PhonePe
      triggerBiometricAuth();
    }
  }, [isLocked, triggerBiometricAuth]);

  // Handle PIN key press
  const handlePinPress = (digit) => {
    if (enteredPin.length < 4) {
      const newPin = enteredPin + digit;
      setEnteredPin(newPin);
      setPinError('');

      if (newPin.length === 4) {
        // Automatically check 4-digit PIN
        setTimeout(() => {
          const success = onUnlockWithPIN(newPin);
          if (!success) {
            setPinError('Incorrect App PIN. Please try again.');
            setEnteredPin('');
          }
        }, 150);
      }
    }
  };

  const handlePinDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[9999] bg-[#070a12]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-slate-100 select-none overflow-hidden"
      >
        {/* Ambient Glowing Background Highlights */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col items-center text-center relative z-10">
          {/* Top Brand Logo / Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative mb-6"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-cyan-500/30 flex items-center justify-center shadow-2xl shadow-cyan-500/20 clay-card">
              <div className="relative">
                <Lock className="w-11 h-11 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" />
                <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            <div className="absolute -bottom-2 right-0 bg-cyan-500 text-slate-950 p-1.5 rounded-full shadow-lg">
              <Fingerprint className="w-4 h-4" />
            </div>
          </motion.div>

          <h2 className="text-2xl font-black tracking-tight text-white font-heading mb-6 flex items-center gap-2">
            NEXUS <span className="text-cyan-400">APP LOCK</span>
          </h2>

          {!showPinInput ? (
            /* Biometric Primary View */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-4"
            >
              {bioError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{bioError}</span>
                </div>
              )}

              {/* Main Fingerprint / Device Lock Button */}
              <button
                onClick={triggerBiometricAuth}
                disabled={isAuthenticating}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 transition-all border border-cyan-400/30 clay-btn cursor-pointer"
              >
                <Fingerprint className="w-6 h-6 animate-pulse text-cyan-100" />
                <span>{isAuthenticating ? 'Scanning Device Lock...' : 'Unlock with Fingerprint / PIN'}</span>
              </button>

              {/* Secondary PIN Code Button */}
              {securityPin && (
                <button
                  onClick={() => {
                    setShowPinInput(true);
                    setBioError('');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  <span>Use App PIN Code</span>
                </button>
              )}
            </motion.div>
          ) : (
            /* Custom 4-Digit App PIN Keypad View */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-5"
            >
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">Enter 4-Digit App PIN</p>

                {/* 4 PIN Dots */}
                <div className="flex justify-center gap-3 py-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = enteredPin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border transition-all ${
                          isFilled
                            ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.8)] scale-110'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      />
                    );
                  })}
                </div>

                {pinError && <p className="text-xs font-semibold text-rose-400 pt-1">{pinError}</p>}
              </div>

              {/* Number Keypad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinPress(num.toString())}
                    className="h-12 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-cyan-500/20 border border-slate-800 hover:border-slate-700 text-lg font-bold text-slate-200 hover:text-white transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinPress('0')}
                  className="h-12 rounded-xl bg-slate-900/90 hover:bg-slate-800 active:bg-cyan-500/20 border border-slate-800 hover:border-slate-700 text-lg font-bold text-slate-200 hover:text-white transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  className="h-12 rounded-xl bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                  aria-label="Delete last digit"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Back to Biometrics Button */}
              <button
                onClick={() => {
                  setShowPinInput(false);
                  setEnteredPin('');
                  setPinError('');
                }}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 pt-2 block mx-auto cursor-pointer"
              >
                Switch back to Fingerprint / Device Lock
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
