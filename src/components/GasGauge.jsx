import React from 'react';
import { Flame, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GasGauge({ value, stats }) {
  const numericVal = value !== null && value !== undefined ? Number(value) : null;
  const displayVal = numericVal !== null ? numericVal : '--';

  let status = { label: 'NORMAL', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', icon: ShieldCheck };
  if (numericVal !== null) {
    if (numericVal < 200) {
      status = { label: 'LOW / OPTIMAL', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30', icon: ShieldCheck };
    } else if (numericVal < 450) {
      status = { label: 'NORMAL', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: ShieldCheck };
    } else if (numericVal < 700) {
      status = { label: 'WARNING THRESHOLD', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle };
    } else {
      status = { label: 'CRITICAL / HIGH', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', icon: AlertTriangle };
    }
  }

  const percent = numericVal !== null ? Math.min(100, Math.max(0, (numericVal / 1024) * 100)) : 0;
  const StatusIcon = status.icon;

  return (
    <div className="clay-card p-3.5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 clay-badge shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-white text-xs sm:text-base leading-tight truncate">GAS SENSOR</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">/gas (Raw ADC)</p>
            </div>
          </div>

          <div className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs font-bold border flex items-center gap-1 sm:gap-1.5 ${status.bg} ${status.color} clay-inset-dark shrink-0`}>
            <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="truncate">{status.label}</span>
          </div>
        </div>

        {/* Circular Spring Arc Gauge */}
        <div className="flex flex-col items-center justify-center my-2 sm:my-4 relative">
          <svg className="w-28 h-28 sm:w-44 sm:h-44 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#0f172a"
              strokeWidth="10"
              fill="transparent"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#gasGradient)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray="251.2"
              animate={{ strokeDashoffset: 251.2 - (251.2 * percent) / 100 }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
            />
            <defs>
              <linearGradient id="gasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl sm:text-3xl font-extrabold font-heading text-white tabular-nums tracking-tight">
              {displayVal}
            </span>
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Raw ADC</span>
          </div>
        </div>
      </div>
    </div>
  );
}
