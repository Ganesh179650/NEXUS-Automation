import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggleTheme, className = '' }) {
  const isLight = theme === 'light';

  return (
    <button
      onClick={onToggleTheme}
      type="button"
      aria-label={`Switch to ${isLight ? 'Dark' : 'Light Neomorphism'} theme`}
      className={`relative inline-flex items-center w-16 h-8 p-1 rounded-full transition-all duration-300 select-none cursor-pointer ${
        isLight
          ? 'bg-[#e6eaf0] border border-white/80 shadow-[inset_3px_3px_6px_#b8c4d4,inset_-3px_-3px_6px_#ffffff]'
          : 'bg-slate-950/90 border border-slate-800 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.6),inset_-1px_-1px_3px_rgba(255,255,255,0.08)]'
      } ${className}`}
    >
      {/* Background Track Icons */}
      <div className="flex items-center justify-between w-full px-1.5 pointer-events-none">
        {/* Left Side: Moon Icon (Dark Mode) */}
        <Moon className={`w-4 h-4 transition-colors duration-300 ${!isLight ? 'text-cyan-400' : 'text-slate-400'}`} />

        {/* Right Side: Sun Icon (Light Mode) */}
        <Sun className={`w-4 h-4 transition-colors duration-300 ${isLight ? 'text-amber-500' : 'text-slate-600'}`} />
      </div>

      {/* Sliding Glowing Knob */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-1 bottom-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          isLight
            ? 'left-9 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-[2px_2px_5px_#b8c4d4,-2px_-2px_5px_#ffffff]'
            : 'left-1 bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
        }`}
      >
        {isLight ? (
          <Sun className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <Moon className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
      </motion.div>
    </button>
  );
}
