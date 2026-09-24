import React from 'react';
import { Flame, Bell, Vibrate, Volume2, Smartphone, ShieldCheck, Play, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function GasAlarmCard({ gasAlarm, currentGas }) {
  const {
    alarmThreshold,
    isStandalone,
    pwaOnlyMode,
    setPwaOnlyMode,
    notificationPermission,
    requestNotificationPermission,
    testAlarm,
    isTesting,
    isThresholdExceeded,
  } = gasAlarm;

  return (
    <div className="clay-card p-5 sm:p-6 border border-rose-500/30 bg-gradient-to-br from-[#1c0d16]/90 to-[#0e1726]/90 relative overflow-hidden">
      {/* Glow pulse when threshold exceeded */}
      {isThresholdExceeded && (
        <div className="absolute inset-0 bg-rose-600/10 animate-pulse pointer-events-none" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 clay-badge">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-extrabold text-white text-base sm:text-lg">
                MOBILE GAS LEAK SIREN & VIBRATION
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                PWA EXCLUSIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Triggers mobile phone vibration & buzzer alarm sound when Gas ADC exceeds threshold (<strong className="text-white">&gt; {alarmThreshold} ADC</strong>).
            </p>
          </div>
        </div>

        {/* Test Alarm Button */}
        <button
          onClick={testAlarm}
          disabled={isTesting}
          className={`py-2.5 px-4 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 ${
            isTesting
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isTesting ? 'SIREN & VIBE TESTING...' : 'TEST SIREN & VIBRATION'}</span>
        </button>
      </div>

      {/* Grid of Mobile Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono">
        {/* 1. App Standalone Status */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] block">1. APP INSTALL STATUS</span>
          <div className="flex items-center justify-between">
            <span className={`font-bold flex items-center gap-1.5 ${isStandalone ? 'text-emerald-400' : 'text-cyan-400'}`}>
              <Smartphone className="w-4 h-4" />
              {isStandalone ? 'INSTALLED (APP MODE)' : 'BROWSER TAB'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            {isStandalone
              ? 'App installed on device home screen'
              : 'Install app to enable standalone background alerts'}
          </p>
        </div>

        {/* 2. Mobile Vibration & Sound API */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] block">2. HARDWARE ALERT API</span>
          <div className="flex items-center gap-3 text-rose-300 font-bold">
            <span className="flex items-center gap-1">
              <Vibrate className="w-3.5 h-3.5 text-rose-400" /> Vibration
            </span>
            <span className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-amber-400" /> Buzzer Siren
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Dual-tone Web Audio siren + native phone pattern vibration
          </p>
        </div>

        {/* 3. System Push Notifications */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-slate-400 text-[10px] block">3. SYSTEM NOTIFICATIONS</span>
          <div className="flex items-center justify-between">
            <span className={`font-bold flex items-center gap-1 ${notificationPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Bell className="w-3.5 h-3.5" />
              {notificationPermission === 'granted' ? 'GRANTED' : 'NOT ALLOWED'}
            </span>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] hover:bg-cyan-500/30"
              >
                ENABLE
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">
            Pushes instant phone notification on gas &gt; {alarmThreshold}
          </p>
        </div>
      </div>

      {/* Mode Toggle & Threshold Info */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Trigger condition:</span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono font-bold">
            Gas Sensor &gt; {alarmThreshold} ADC
          </span>
          <span className="text-slate-500 text-[11px]">
            (Current: <strong className="text-white font-mono">{currentGas !== null && currentGas !== undefined ? currentGas : '--'} ADC</strong>)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pwaOnlyMode}
              onChange={(e) => setPwaOnlyMode(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
            />
            <span className="text-slate-300 text-xs">Only trigger when installed like an app</span>
          </label>
        </div>
      </div>
    </div>
  );
}
