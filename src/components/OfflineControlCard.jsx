import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Power } from 'lucide-react';

export default function OfflineControlCard({
  isEnabled = false,
  onToggle,
  reduceMotion = false,
}) {
  return (
    <motion.div
      whileHover={reduceMotion ? {} : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onToggle}
      className={`clay-card clay-card-interactive p-2.5 sm:p-5 flex flex-col justify-between overflow-hidden group select-none cursor-pointer transition-all ${
        isEnabled
          ? 'border-amber-500/60 bg-slate-900/90 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'border-amber-500/30 bg-slate-900/60 hover:border-amber-500/50'
      }`}
      title="Toggle Offline Controls Override"
    >
      <div className="flex items-start justify-between gap-1.5 mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider truncate flex items-center gap-1">
          OFFLINE CONTROL
        </span>
        <div
          className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-transform group-hover:scale-110 shrink-0 ${
            isEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 clay-badge'
              : 'bg-slate-950 text-amber-500/70 border-slate-800'
          }`}
        >
          <ShieldAlert className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isEnabled ? 'text-amber-400 animate-pulse' : 'text-amber-500/80'}`} />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 my-0.5">
        <span
          className={`text-base sm:text-3xl font-extrabold font-heading tracking-tight ${
            isEnabled ? 'text-amber-300' : 'text-slate-500'
          }`}
        >
          {isEnabled ? 'ENABLED' : 'DISABLED'}
        </span>
        <span className="text-[9px] sm:text-[11px] font-mono text-amber-400/80 truncate">
          {isEnabled ? 'UNLOCKED' : 'CLICK TO OVERRIDE'}
        </span>
      </div>
    </motion.div>
  );
}
