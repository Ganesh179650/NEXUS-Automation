import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ShieldCheck, Eye, Database, Cpu, Wifi } from 'lucide-react';
import InstallPrompt from '../components/InstallPrompt';

export default function Settings({ reduceMotion, onToggleReduceMotion, isConnected, onNotify }) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <motion.div variants={item}>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
          SYSTEM PREFERENCES
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-3">
          <SettingsIcon className="w-7 h-7 text-cyan-400" /> SYSTEM SETTINGS & CONFIG
        </h1>
        <p className="text-sm text-slate-400">
          Customize performance options, 3D rendering modes, and view Firebase RTDB connection status.
        </p>
      </motion.div>

      {/* PWA App Installability & Status Section */}
      <motion.div variants={item}>
        <InstallPrompt isSettingsPage={true} />
      </motion.div>

      {/* Accessibility & Performance Panel */}
      <motion.div variants={item} className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">ACCESSIBILITY & 3D PERFORMANCE</h3>
            <p className="text-xs text-slate-400">Optimize graphics for low-end hardware or motion sensitivity</p>
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-t border-b border-slate-800">
          <div>
            <span className="text-sm font-semibold text-white block">Reduce Motion & Disable 3D Background</span>
            <p className="text-xs text-slate-400">
              Pauses ambient 3D particle canvas and simplifies WebGL shaders to conserve GPU power.
            </p>
          </div>

          <button
            onClick={() => {
              onToggleReduceMotion();
              onNotify(`Reduce Motion ${!reduceMotion ? 'Enabled' : 'Disabled'}`, 'info');
            }}
            className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 ${
              reduceMotion ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-slate-800'
            }`}
          >
            <motion.div
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`w-6 h-6 rounded-full bg-white shadow-md ${reduceMotion ? 'ml-6' : 'ml-0'}`}
            />
          </button>
        </div>
      </motion.div>

      {/* Firebase Realtime Database Metadata Panel */}
      <motion.div variants={item} className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">FIREBASE RTDB METADATA</h3>
            <p className="text-xs text-slate-400">Direct Web SDK database connection properties</p>
          </div>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" /> Database Connection (.info/connected)
            </span>
            <span className={`font-bold ${isConnected ? 'text-cyan-400' : 'text-rose-400'}`}>
              {isConnected ? 'ONLINE / CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Database URL</span>
            <span className="text-slate-200 truncate max-w-xs">
              https://automation-b7189-default-rtdb.firebaseio.com
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Project ID</span>
            <span className="text-slate-200">automation-b7189</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">App SDK Version</span>
            <span className="text-slate-200">Firebase v11 Web SDK (Modular)</span>
          </div>
        </div>
      </motion.div>

      {/* Hardware Pinout Mapping */}
      <motion.div variants={item} className="glass-panel rounded-2xl p-6 border border-slate-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-white text-base">ESP32 HARDWARE PINOUT DICTIONARY</h3>
            <p className="text-xs text-slate-400">Microcontroller GPIO & sensor assignment map</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">SERVO 1</span>
            <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              ESP32 GPIO 25 (/servo1)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">SERVO 2</span>
            <span className="font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              ESP32 GPIO 26 (/servo2)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">LED 1</span>
            <span className="font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">Digital Output (/led1)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">LED 2</span>
            <span className="font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">Digital Output (/led2)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">MOTOR CONTROL</span>
            <span className="font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">Digital Output (/motor)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">GAS SENSOR</span>
            <span className="font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded">ADC Input (/gas)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">TEMPERATURE</span>
            <span className="font-mono text-amber-400 bg-slate-800 px-2 py-0.5 rounded">DHT/Analog (/temperature)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
            <span className="font-semibold text-white">HUMIDITY</span>
            <span className="font-mono text-cyan-400 bg-slate-800 px-2 py-0.5 rounded">DHT Input (/humidity)</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
