import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Zap, Loader2 } from 'lucide-react';

import Toast from './components/Toast';
import WebGLCanvas from './components/WebGLCanvas';
import AmbientBackground3D from './components/AmbientBackground3D';
import InstallPrompt from './components/InstallPrompt';
import GasAlarmModal from './components/GasAlarmModal';
import ThemeToggle from './components/ThemeToggle';
import AppLockOverlay from './components/AppLockOverlay';

import Dashboard from './pages/Dashboard';

import { useAllIoTValues } from './hooks/useRealtimeValue';
import { useSessionHistory } from './hooks/useSessionHistory';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useGasAlarm } from './hooks/useGasAlarm';
import { useTheme } from './hooks/useTheme';
import { useBiometricLock } from './hooks/useBiometricLock';

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Theme Management (Dark Mode vs Light Neomorphism)
  const { theme, toggleTheme } = useTheme();

  // Device Biometric Security Lock
  const biometricLock = useBiometricLock();

  // Custom hooks for real-time data, session stats, and motion settings
  const { data, loading, isInitialLoading, isConnected, lastChangedKey, offlineStatus, isDeviceOffline, isCheckingTelemetry, statusDetermined } = useAllIoTValues();
  const { history, getStats, clearHistory } = useSessionHistory(data.temperature, data.humidity, data.gas);
  const { reduceMotion, toggleReducedMotion } = useReducedMotion();

  // Mobile Gas Leak Alarm (> 2300 ADC) with Phone Vibration & Buzzer Siren
  const gasAlarm = useGasAlarm(data.gas, isDeviceOffline);

  // Non-blocking toast notifier
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      if (prev.some((t) => t.message === message)) return prev;
      return [...prev, { id, message, type }].slice(-3);
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Device Security Lock Overlay */}
      <AppLockOverlay
        isLocked={biometricLock.isLocked}
        isSupported={biometricLock.isSupported}
        securityPin={biometricLock.securityPin}
        onUnlockWithBiometrics={biometricLock.unlockWithBiometrics}
        onUnlockWithPIN={biometricLock.unlockWithPIN}
      />

      {/* High Gas Emergency Alarm Modal (Phone Vibration + Buzzer Siren Overlay) */}
      <GasAlarmModal
        gasValue={data.gas}
        threshold={gasAlarm.alarmThreshold}
        isOpen={gasAlarm.isAlarmTriggered}
        onSilence={gasAlarm.silenceAlarm}
        isStandalone={gasAlarm.isStandalone}
        pwaOnlyMode={gasAlarm.pwaOnlyMode}
        isTesting={gasAlarm.isTesting}
      />

      {/* PWA Floating Install Prompt */}
      <InstallPrompt />

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 bg-noise pointer-events-none z-10" />

      {/* Ambient 3D Particle Canvas Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <WebGLCanvas reduceMotion={reduceMotion} interactive={false}>
          <AmbientBackground3D reduceMotion={reduceMotion} />
        </WebGLCanvas>
      </div>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col relative z-20">

        {/* Router Page Content Boundary */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    data={data}
                    stats={getStats}
                    history={history}
                    onClearHistory={clearHistory}
                    onNotify={addToast}
                    lastChangedKey={lastChangedKey}
                    offlineStatus={offlineStatus}
                    isDeviceOffline={isDeviceOffline}
                    isCheckingTelemetry={isCheckingTelemetry}
                    statusDetermined={statusDetermined}
                    isInitialLoading={isInitialLoading}
                    reduceMotion={reduceMotion}
                    onNavigate={(path) => navigate(path)}
                    gasAlarm={gasAlarm}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    biometricLock={biometricLock}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>

      {/* Non-blocking Toast Alerts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

