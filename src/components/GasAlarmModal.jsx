import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, VolumeX } from 'lucide-react';

export default function GasAlarmModal({
  gasValue,
  threshold = 1500,
  isOpen,
  onSilence,
  isStandalone,
  pwaOnlyMode,
  isTesting = false,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Pulsing Emergency Red Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-rose-950/90 backdrop-blur-xl animate-pulse"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md rounded-3xl border-2 border-rose-500/80 bg-[#170a12] p-6 text-white shadow-[0_0_60px_rgba(244,63,94,0.6)]"
        >
          {/* Flashing Hazard Icon Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-rose-600/30 blur-xl animate-ping" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-[0_0_30px_rgba(244,63,94,0.8)]">
                <Flame className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-widest">
                {isTesting ? 'ALARM TEST MODE' : 'EMERGENCY TELEMETRY ALERT'}
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-rose-400 tracking-tight mt-2">
                HIGH GAS LEAK DETECTED!
              </h2>
              <p className="text-xs text-rose-200/80 mt-1 max-w-xs mx-auto">
                Gas sensor level exceeded critical safety threshold of <strong className="text-white">{threshold} ADC</strong>.
              </p>
            </div>
          </div>

          {/* Realtime Sensor Value Card */}
          <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 text-center space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              CURRENT REALTIME GAS READING
            </span>
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-mono text-4xl sm:text-5xl font-black text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]">
                {gasValue !== null && gasValue !== undefined ? gasValue : threshold + 50}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono">ADC</span>
            </div>
            <p className="text-[11px] text-amber-300 font-medium">
              ⚠️ Level is <strong className="text-rose-400">{(gasValue || threshold + 50) - threshold} ADC above safety limit!</strong>
            </p>
          </div>



          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={onSilence}
              className="w-full py-3.5 px-4 rounded-2xl font-heading font-extrabold text-sm bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)] hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              <VolumeX className="w-5 h-5" />
              <span>MUTE ALARM SOUND & VIBRATION</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Ensure gas valves are shut off and ventilate the room immediately.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
