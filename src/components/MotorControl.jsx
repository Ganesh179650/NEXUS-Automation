import React from 'react';
import { motion } from 'framer-motion';
import { Fan } from 'lucide-react';

export default function MotorControl({
  title = 'MOTOR FAN',
  firebasePath = '/motor',
  state = 0,
  onToggle,
  disabled = false,
  onOfflineClick,
  reduceMotion = false,
}) {
  const isON = state === 1 || state === true || state === '1';

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
        !disabled && isON ? 'border-emerald-500/40 bg-slate-900/80' : 'border-slate-800/80 bg-slate-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-1.5 mb-1 sm:mb-2">
        <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</span>
        <div
          className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-transform group-hover:scale-110 shrink-0 ${
            isON
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 clay-badge'
              : 'bg-slate-950 text-slate-500 border-slate-800'
          }`}
        >
          <Fan className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isON ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: '3s' }} />
        </div>
      </div>

      <div className="flex items-baseline gap-1 my-0.5">
        <span
          className={`text-base sm:text-3xl font-extrabold font-heading tracking-tight ${
            isON ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          {isON ? 'RUNNING' : 'STOPPED'}
        </span>
      </div>
    </motion.div>
  );
}
