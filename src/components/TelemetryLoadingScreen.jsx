import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export default function TelemetryLoadingScreen() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative p-4 select-none">
      {/* Glow Ambient Background Orbs */}
      <div className="absolute w-80 h-80 rounded-full bg-cyan-500/15 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute w-80 h-80 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Clay Loading Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 220 }}
        className="clay-card p-10 sm:p-12 text-center relative z-10 border border-slate-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl rounded-3xl flex flex-col items-center justify-center space-y-6"
      >
        {/* ============================================================== */}
        {/* 3D POP-UP & FLOATING NEXUS HOME APP ICON ANIMATION             */}
        {/* ============================================================== */}
        <div className="relative w-36 h-36 flex items-center justify-center [perspective:1000px]">
          {/* Rotating Outer Glowing Ring 1 */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/50 animate-[spin_10s_linear_infinite]" />
          
          {/* Reverse Rotating Outer Ring 2 */}
          <div className="absolute -inset-3.5 rounded-full border border-violet-500/40 animate-[spin_14s_linear_infinite_reverse]" />
          
          {/* Pulsing Neon Halo Background */}
          <div className="absolute inset-2 rounded-3xl bg-gradient-to-tr from-cyan-500/35 to-violet-600/35 blur-xl animate-pulse" />

          {/* 3D Floating & Pop-up App Icon Frame */}
          <motion.div
            initial={{ scale: 0, rotateX: -35, rotateY: 15, y: 30 }}
            animate={{
              scale: [0.95, 1.06, 0.95],
              rotateX: [6, -6, 6],
              rotateY: [-12, 12, -12],
              y: [-8, 8, -8],
            }}
            transition={{
              scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
              rotateX: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              rotateY: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-violet-600 p-1 shadow-[0_15px_35px_rgba(6,182,212,0.45),0_0_25px_rgba(139,92,246,0.35),inset_-3px_-3px_8px_rgba(0,0,0,0.5),inset_3px_3px_8px_rgba(255,255,255,0.4)] cursor-pointer overflow-hidden transform-gpu"
          >
            {/* App Image Icon */}
            <img
              src="/App_image.png"
              alt="NEXUS HOME App Icon"
              className="w-full h-full rounded-[22px] object-cover shadow-inner"
            />

            {/* Specular Shimmer Highlight Overlay */}
            <div className="absolute inset-0 rounded-[22px] bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none animate-pulse" />
          </motion.div>
        </div>

        {/* NEXUS IOT SYSTEM Branding Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="px-4 py-1.5 rounded-full text-xs font-extrabold font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] clay-badge">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" /> NEXUS IOT SYSTEM
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
