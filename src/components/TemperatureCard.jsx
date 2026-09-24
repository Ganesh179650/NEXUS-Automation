import React from 'react';
import { Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TemperatureCard({ value, stats }) {
  const numericVal = value !== null && value !== undefined ? Number(value) : null;
  const displayVal = numericVal !== null ? numericVal.toFixed(1) : '--';

  // Temperature percent fill (Range: 0°C to 50°C)
  const percent = numericVal !== null ? Math.min(100, Math.max(0, (numericVal / 50) * 100)) : 0;
  const trend = stats?.trend || 'stable';

  return (
    <div className="clay-card p-3.5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 clay-badge shrink-0">
              <Thermometer className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-white text-xs sm:text-base leading-tight truncate">ROOM TEMP</h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">/temperature (°C)</p>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="hidden xs:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full clay-inset-dark text-[10px] sm:text-xs font-semibold text-slate-300 shrink-0">
            {trend === 'up' && <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />}
            {trend === 'stable' && <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />}
            <span className="capitalize">{trend}</span>
          </div>
        </div>

        {/* Value Display */}
        <div className="flex items-baseline gap-1.5 sm:gap-3 my-2 sm:my-4">
          <span className="text-3xl sm:text-5xl font-extrabold font-heading text-amber-400 tabular-nums tracking-tight">
            {displayVal}
          </span>
          <span className="text-sm sm:text-lg font-bold text-slate-400">°C</span>
        </div>

        {/* Linear Spring Progress Bar */}
        <div className="w-full bg-slate-950 h-2.5 sm:h-3 rounded-full overflow-hidden p-0.5 clay-inset-dark">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 70, damping: 15 }}
          />
        </div>
      </div>
    </div>
  );
}
