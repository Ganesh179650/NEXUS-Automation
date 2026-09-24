import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';

export default function LEDControl({
  title = 'LED 1 LIGHT',
  firebasePath = '/led1',
  state = 0,
  onToggle,
  accentColor = 'cyan',
  disabled = false,
  onOfflineClick,
  reduceMotion = false,
}) {
  const isON = state === 1 || state === true || state === '1';

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/40',
      badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 clay-badge',
      text: 'text-cyan-400',
    },
    violet: {
      border: 'border-violet-500/40',
      badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30 clay-badge',
      text: 'text-violet-400',
    },
    emerald: {
      border: 'border-emerald-500/40',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 clay-badge',
      text: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/40',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30 clay-badge',
      text: 'text-amber-400',
    },
    red: {
      border: 'border-rose-500/40',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30 clay-badge',
      text: 'text-rose-400',
    },
  }[accentColor] || {
    border: 'border-cyan-500/40',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 clay-badge',
    text: 'text-cyan-400',
  };

  const handleClick = () => {
    if (disabled) {
      if (onOfflineClick) onOfflineClick();
      return;
    }
    if (onToggle) onToggle(isON ? 0 : 1);
  };

  return (
    <motion.div
      whileHover={disabled ? {} : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={handleClick}
      className={`clay-card ${disabled ? 'opacity-50 cursor-not-allowed border-slate-800/40 bg-slate-900/40' : 'clay-card-interactive'} p-2.5 sm:p-5 flex flex-col justify-between overflow-hidden group select-none ${
        !disabled && isON ? `${colorStyles.border} bg-slate-900/80` : 'border-slate-800/80 bg-slate-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</span>
        <div
          className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-transform group-hover:scale-110 shrink-0 ${
            isON
              ? colorStyles.badge
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <Lightbulb className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isON ? colorStyles.text : 'text-slate-500'}`} />
        </div>
      </div>

      <div className="flex items-baseline gap-1 my-0.5">
        <span
          className={`text-base sm:text-3xl font-extrabold font-heading tracking-tight ${
            isON ? colorStyles.text : 'text-slate-500'
          }`}
        >
          {isON ? 'ON' : 'OFF'}
        </span>
      </div>
    </motion.div>
  );
}
