import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] sm:w-96 pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isSuccess = toast.type === 'success';

          const config = isError
            ? {
                bg: 'bg-[#0f172a]/95 border-rose-500/70 shadow-[0_10px_30px_rgba(244,63,94,0.35)]',
                accent: 'bg-rose-500',
                iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
                title: 'Control Restricted',
                titleColor: 'text-rose-400',
                Icon: AlertTriangle,
              }
            : isWarning
            ? {
                bg: 'bg-[#0f172a]/95 border-amber-500/70 shadow-[0_10px_30px_rgba(245,158,11,0.35)]',
                accent: 'bg-amber-500',
                iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                title: 'System Notice',
                titleColor: 'text-amber-400',
                Icon: ShieldAlert,
              }
            : isSuccess
            ? {
                bg: 'bg-[#0f172a]/95 border-emerald-500/70 shadow-[0_10px_30px_rgba(16,185,129,0.35)]',
                accent: 'bg-emerald-500',
                iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
                title: 'Success',
                titleColor: 'text-emerald-400',
                Icon: CheckCircle,
              }
            : {
                bg: 'bg-[#0f172a]/95 border-cyan-500/70 shadow-[0_10px_30px_rgba(6,182,212,0.35)]',
                accent: 'bg-cyan-500',
                iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
                title: 'Information',
                titleColor: 'text-cyan-400',
                Icon: Info,
              };

          const IconComponent = config.Icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl clay-card ${config.bg}`}
            >
              {/* Left Color Indicator Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${config.accent}`} />

              {/* Icon Badge */}
              <div className={`p-2 rounded-xl border ${config.iconBg} shrink-0 mt-0.5 ml-1`}>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              {/* Text Message */}
              <div className="flex-1 min-w-0 pr-1">
                <div className={`text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider mb-0.5 ${config.titleColor}`}>
                  {config.title}
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
