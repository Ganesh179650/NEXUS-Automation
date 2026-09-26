import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Fingerprint, Lock, Check, X, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BiometricToggle({
  isEnabled,
  isSupported,
  securityPin,
  onEnable,
  onDisable,
  onLockNow,
  onNotify,
}) {
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleClick = () => {
    if (isEnabled) {
      // Disable security lock
      onDisable();
      if (onNotify) onNotify('App Lock Security Disabled', 'info');
    } else {
      // Open Setup Modal to enable
      setPinInput('');
      setConfirmPinInput('');
      setErrorMsg('');
      setShowSetupModal(true);
    }
  };

  const handleConfirmEnable = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      setErrorMsg('Please enter a 4-digit fallback PIN.');
      return;
    }
    if (pinInput !== confirmPinInput) {
      setErrorMsg('PIN numbers do not match.');
      return;
    }

    const res = await onEnable(pinInput);
    if (res.success) {
      setShowSetupModal(false);
      if (onNotify) {
        onNotify(
          res.method === 'biometric'
            ? 'Biometric & PIN Security Lock Enabled!'
            : 'App PIN Security Lock Enabled!',
          'success'
        );
      }
    } else {
      setErrorMsg(res.error || 'Failed to enable lock.');
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Toggle Button */}
        <button
          onClick={handleToggleClick}
          className={`px-3 py-1.5 rounded-full text-xs font-bold font-mono transition-all flex items-center gap-2 border clay-badge cursor-pointer ${
            isEnabled
              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35 shadow-[0_0_12px_rgba(6,182,212,0.25)] hover:bg-cyan-500/25'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
          }`}
          title={isEnabled ? 'App Lock is active. Click to disable.' : 'Click to enable App Lock security.'}
        >
          {isEnabled ? (
            <>
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">APP LOCK: ACTIVE</span>
              <span className="sm:hidden">LOCKED</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">APP LOCK: OFF</span>
              <span className="sm:hidden">LOCK OFF</span>
            </>
          )}
        </button>

        {/* Lock Now Button (if lock is active) */}
        {isEnabled && (
          <button
            onClick={onLockNow}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer"
            title="Lock App Now"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Setup Modal */}
      <AnimatePresence>
        {showSetupModal && (
          <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 shadow-2xl relative clay-card"
            >
              <button
                onClick={() => setShowSetupModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-heading">Enable App Lock</h3>
                  <p className="text-xs text-slate-400">Biometric & PIN Security</p>
                </div>
              </div>

              <form onSubmit={handleConfirmEnable} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    Set 4-Digit Fallback App PIN:
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono tracking-[0.5em] text-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Confirm 4-Digit PIN:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center font-mono tracking-[0.5em] text-lg text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                {errorMsg && <p className="text-xs font-semibold text-rose-400">{errorMsg}</p>}



                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSetupModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20"
                  >
                    Enable Security Lock
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
