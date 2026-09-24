import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Lightbulb, RotateCw, Fan, CheckSquare } from 'lucide-react';
import { setAllLEDs, setBothServoAngles, setMotor } from '../services/deviceService';

export default function QuickActions({ onNotification, disabled = false, isCheckingTelemetry = false }) {
  const triggerNotice = () => {
    if (onNotification) {
      if (isCheckingTelemetry) {
        onNotification('Checking device connectivity... Controls disabled until confirmed online', 'info');
      } else {
        onNotification('Device offline: Cannot control device until reconnected', 'error');
      }
    }
  };

  const handleAllLEDs = async (state) => {
    if (disabled) {
      triggerNotice();
      return;
    }
    try {
      await setAllLEDs(state);
    } catch (e) {
      console.error('Failed to update LEDs', e);
    }
  };

  const handleBothServos = async (angle) => {
    if (disabled) {
      triggerNotice();
      return;
    }
    try {
      await setBothServoAngles(angle);
    } catch (e) {
      console.error('Failed to update Servos', e);
    }
  };

  const handleMotor = async (state) => {
    if (disabled) {
      triggerNotice();
      return;
    }
    try {
      await setMotor(state);
    } catch (e) {
      console.error('Failed to update Motor', e);
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.08)] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-white text-base">QUICK SYSTEM ACTIONS</h3>
          <p className="text-xs text-slate-400">Atomic Multi-Device Commands</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* All LEDs ON / OFF */}
        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          disabled={disabled}
          onClick={() => handleAllLEDs(1)}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-4 h-4 text-cyan-400" />
          <span>All LEDs ON</span>
        </motion.button>

        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          disabled={disabled}
          onClick={() => handleAllLEDs(0)}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:bg-slate-800 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lightbulb className="w-4 h-4 text-slate-500" />
          <span>All LEDs OFF</span>
        </motion.button>

        {/* Both Servos Presets */}
        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          disabled={disabled}
          onClick={() => handleBothServos(90)}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCw className="w-4 h-4 text-violet-400" />
          <span>Both Servos 90°</span>
        </motion.button>

        {/* Motor ON / OFF */}
        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          disabled={disabled}
          onClick={() => handleMotor(1)}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-semibold text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Fan className="w-4 h-4 text-emerald-400" />
          <span>Motor ON</span>
        </motion.button>
      </div>
    </div>
  );
}
