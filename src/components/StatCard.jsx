import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export default function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  accentColor = 'cyan', // 'cyan' | 'amber' | 'red' | 'violet' | 'emerald'
  isPulsing = false,
  isOffline,
  disabled = false,
  onOfflineClick,
  reduceMotion = false,
  onClick,
  stats = null,
}) {
  const [isFlashing, setIsFlashing] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-60, 60], [5, -5]);
  const rotateY = useTransform(x, [-60, 60], [-5, 5]);

  const handleMouseMove = (e) => {
    if (reduceMotion || disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = (e) => {
    if (disabled) {
      if (onOfflineClick) onOfflineClick(e);
      return;
    }
    if (onClick) onClick(e);
  };

  const colorStyles = {
    cyan: {
      border: 'border-cyan-500/40',
      iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 clay-badge',
      text: 'text-cyan-400',
    },
    amber: {
      border: 'border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30 clay-badge',
      text: 'text-amber-400',
    },
    red: {
      border: 'border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30 clay-badge',
      text: 'text-rose-400',
    },
    violet: {
      border: 'border-violet-500/40',
      iconBg: 'bg-violet-500/15 text-violet-400 border-violet-500/30 clay-badge',
      text: 'text-violet-400',
    },
    emerald: {
      border: 'border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 clay-badge',
      text: 'text-emerald-400',
    },
  }[accentColor] || {
    border: 'border-cyan-500/40',
    iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 clay-badge',
    text: 'text-cyan-400',
  };

  const displayValue = value !== null && value !== undefined ? value : '--';
  const isDoorClosed = displayValue === 'CLOSED';
  const isDoorOpen = displayValue === 'OPEN';

  const valueTextColor = isDoorClosed
    ? 'text-slate-500'
    : isDoorOpen
    ? colorStyles.text
    : colorStyles.text;

  const iconBadgeBg = isDoorClosed
    ? 'bg-slate-950 text-slate-500 border-slate-800'
    : colorStyles.iconBg;

  const cardActiveStyle = disabled
    ? 'border-slate-800/40 bg-slate-900/40 opacity-50 cursor-not-allowed'
    : isDoorOpen || isPulsing
    ? `${colorStyles.border} bg-slate-900/80`
    : 'border-slate-800/80 bg-slate-900/60';

  return (
    <motion.div
      style={{
        rotateX: reduceMotion || disabled ? 0 : rotateX,
        rotateY: reduceMotion || disabled ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileHover={disabled ? {} : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`clay-card ${disabled ? 'cursor-not-allowed' : 'clay-card-interactive'} p-2.5 sm:p-4 ${cardActiveStyle} group select-none flex flex-col justify-between overflow-hidden`}
    >
      <div>
        <div className="flex items-start justify-between gap-1.5 mb-1 sm:mb-2">
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">{title}</span>
          </div>
          {Icon && (
            <div className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border ${iconBadgeBg} group-hover:scale-110 transition-transform shrink-0`}>
              <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${isDoorClosed ? 'text-slate-500' : ''}`} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1 my-0.5">
          <span className={`text-base sm:text-2xl font-extrabold font-heading tabular-nums tracking-tight ${valueTextColor}`}>
            {displayValue}
          </span>
          {unit && <span className="text-[10px] sm:text-xs font-bold text-slate-400 shrink-0">{unit}</span>}
        </div>

        {subtitle && <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>}
      </div>

      {stats && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-center font-mono">
          <div className="p-1 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-[8px] sm:text-[9px] text-slate-400 block font-semibold">MIN</span>
            <span className="text-[9px] sm:text-xs font-bold text-slate-200 tabular-nums">{stats.min ?? '--'}</span>
          </div>
          <div className="p-1 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-[8px] sm:text-[9px] text-slate-400 block font-semibold">AVG</span>
            <span className="text-[9px] sm:text-xs font-bold text-slate-200 tabular-nums">{stats.avg ?? '--'}</span>
          </div>
          <div className="p-1 rounded-lg bg-slate-900/70 border border-slate-800/80">
            <span className="text-[8px] sm:text-[9px] text-slate-400 block font-semibold">MAX</span>
            <span className="text-[9px] sm:text-xs font-bold text-slate-200 tabular-nums">{stats.max ?? '--'}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
