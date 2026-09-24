import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Zap } from 'lucide-react';
import WebGLCanvas from './WebGLCanvas';
import ServoModel3D from './ServoModel3D';

export default function DualServoControl({
  servo1Angle = 90,
  servo2Angle = 90,
  onBothAngleChange,
  reduceMotion = false,
}) {
  const presets = [0, 45, 90, 135, 180];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-violet-500/30 shadow-[0_0_25px_rgba(168,85,247,0.1)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-lg flex items-center gap-2">
              DUAL SERVO SYNCHRONIZER
            </h3>
            <p className="text-xs text-slate-400">Atomic Firebase Multi-Path Update ({`/servo1`} + {`/servo2`})</p>
          </div>
        </div>

        {/* Current Live Angles Display */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">SERVO 1</span>
            <span className="text-xl font-bold font-heading text-cyan-400 tabular-nums">{servo1Angle}°</span>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">SERVO 2</span>
            <span className="text-xl font-bold font-heading text-violet-400 tabular-nums">{servo2Angle}°</span>
          </div>
        </div>
      </div>

      {/* Side-by-side 3D Servo Canvas View */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="h-36 rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden relative">
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
            Servo 1 (GPIO 25)
          </span>
          <WebGLCanvas reduceMotion={reduceMotion} fallbackText="Servo 1 3D">
            <ServoModel3D angle={servo1Angle} />
          </WebGLCanvas>
        </div>

        <div className="h-36 rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden relative">
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-bold text-violet-400 border border-violet-500/20">
            Servo 2 (GPIO 26)
          </span>
          <WebGLCanvas reduceMotion={reduceMotion} fallbackText="Servo 2 3D">
            <ServoModel3D angle={servo2Angle} />
          </WebGLCanvas>
        </div>
      </div>

      {/* Synchronized Action Preset Buttons */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Atomic Dual Presets</p>
        <div className="grid grid-cols-5 gap-2">
          {presets.map((preset) => {
            const isMatched = servo1Angle === preset && servo2Angle === preset;
            return (
              <motion.button
                key={preset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onBothAngleChange(preset)}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                  isMatched
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-300 hover:border-violet-500/50 hover:text-white'
                }`}
              >
                <span>BOTH {preset}°</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
