import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Flame, DoorOpen, DoorClosed, Activity, Lightbulb, Fan, Wifi, WifiOff, ShieldAlert } from 'lucide-react';
import StatCard from '../components/StatCard';
import LEDControl from '../components/LEDControl';
import MotorControl from '../components/MotorControl';
import OfflineControlCard from '../components/OfflineControlCard';
import SensorChart from '../components/SensorChart';
import TelemetryLoadingScreen from '../components/TelemetryLoadingScreen';
import ThemeToggle from '../components/ThemeToggle';
import BiometricToggle from '../components/BiometricToggle';
import { setServo1Angle, setServo2Angle, setLED1, setLED2, setMotor } from '../services/deviceService';
import { useDeviceOnlineNotification } from '../hooks/useDeviceOnlineNotification';

export default function Dashboard({
  data,
  stats,
  history,
  onClearHistory,
  onNotify,
  lastChangedKey,
  offlineStatus = {},
  isDeviceOffline = false,
  isCheckingTelemetry = true,
  statusDetermined = false,
  isInitialLoading = false,
  reduceMotion,
  onNavigate,
  gasAlarm,
  theme,
  onToggleTheme,
  biometricLock,
}) {
  if (isInitialLoading) {
    return <TelemetryLoadingScreen />;
  }
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const door1Open = (data.servo1 || 0) > 45;
  const door2Open = (data.servo2 || 0) > 45;

  const [isOfflineControlEnabled, setIsOfflineControlEnabled] = useState(false);
  const isOfflineOrChecking = isDeviceOffline || isCheckingTelemetry || !statusDetermined;
  const isControlDisabled = isOfflineOrChecking && !isOfflineControlEnabled;

  // Auto push system lock-screen notification when hardware comes ONLINE if offline control was active with devices ON
  useDeviceOnlineNotification({
    isOfflineControlEnabled,
    isDeviceOffline,
    isCheckingTelemetry,
    statusDetermined,
    data,
  });

  useEffect(() => {
    if (!isOfflineOrChecking) {
      setIsOfflineControlEnabled(false);
    }
  }, [isOfflineOrChecking]);

  const handleToggleOfflineControl = () => {
    const nextState = !isOfflineControlEnabled;
    setIsOfflineControlEnabled(nextState);
    if (onNotify) {
      if (nextState) {
        onNotify('Offline Control Enabled: Appliance & Door Controls are now unlocked', 'warning');
      } else {
        onNotify('Offline Control Disabled: Controls re-locked during offline mode', 'info');
      }
    }
  };

  const handleOfflineClick = () => {
    if (onNotify) {
      if (isCheckingTelemetry) {
        onNotify('Checking device connectivity... Controls disabled until confirmed online (or enable Offline Control)', 'info');
      } else {
        onNotify('Device offline: Controls disabled. Enable "OFFLINE CONTROL" in controls section to override', 'error');
      }
    }
  };

  const handleToggleDoor1 = async () => {
    if (isControlDisabled) {
      handleOfflineClick();
      return;
    }
    const targetAngle = door1Open ? 0 : 180;
    try {
      await setServo1Angle(targetAngle);
    } catch (e) {
      console.error('Failed to update Door 1', e);
    }
  };

  const handleToggleDoor2 = async () => {
    if (isControlDisabled) {
      handleOfflineClick();
      return;
    }
    const targetAngle = door2Open ? 0 : 180;
    try {
      await setServo2Angle(targetAngle);
    } catch (e) {
      console.error('Failed to update Door 2', e);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
      {/* Hero Header */}
      <motion.div variants={item} className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          NEXUS <span className="text-cyan-400">HOME CONTROL CENTER</span>
        </h1>

        {/* Mobile Edge-to-Edge Row: Left Edge = DEVICE STATUS | Right Edge = Theme Toggle */}
        <div className="flex items-center justify-between gap-2.5 w-full pt-1">
          {/* Left Edge: System Connection Status Badge */}
          <div className="shrink-0">
            {isCheckingTelemetry || !statusDetermined ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-amber-400 bg-amber-500/15 border border-amber-500/35 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.25)] clay-badge">
                <Wifi className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>CHECKING CONNECTIVITY...</span>
              </span>
            ) : isDeviceOffline ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-rose-400 bg-rose-500/15 border border-rose-500/35 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.25)] clay-badge">
                <WifiOff className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>DEVICE OFFLINE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-500/35 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.25)] clay-badge">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                </span>
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>DEVICE ONLINE</span>
              </span>
            )}
          </div>

          {/* Right Edge: Biometric Security & Theme Controls */}
          <div className="shrink-0 flex items-center gap-2">
            {biometricLock && (
              <BiometricToggle
                isEnabled={biometricLock.isEnabled}
                isSupported={biometricLock.isSupported}
                securityPin={biometricLock.securityPin}
                onEnable={biometricLock.enableBiometricLock}
                onDisable={biometricLock.disableBiometricLock}
                onLockNow={biometricLock.lockApp}
                onNotify={onNotify}
              />
            )}
            {onToggleTheme && <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 pt-0.5">
          Interactive Remote Appliance & Door Controls with Realtime Telemetry
        </p>
      </motion.div>

      {/* SECTION 1: ENVIRONMENTAL TELEMETRY CARDS (1 Row • 3 Columns) */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            ENVIRONMENTAL TELEMETRY
          </h2>
        </div>

        {(() => {
          const isUnavailable = isCheckingTelemetry || !statusDetermined || isDeviceOffline;
          const isTempUnavailable = isUnavailable || offlineStatus.temperature;
          const isHumUnavailable = isUnavailable || offlineStatus.humidity;
          const isGasUnavailable = isUnavailable || offlineStatus.gas;

          const tempStats = !isTempUnavailable && typeof stats === 'function' ? stats('temp') : (!isTempUnavailable ? (stats?.temp || null) : null);
          const humStats = !isHumUnavailable && typeof stats === 'function' ? stats('humidity') : (!isHumUnavailable ? (stats?.humidity || null) : null);
          const gasStats = !isGasUnavailable && typeof stats === 'function' ? stats('gas') : (!isGasUnavailable ? (stats?.gas || null) : null);

          return (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <StatCard
                title="TEMPERATURE"
                value={!isTempUnavailable && data.temperature !== null ? `${data.temperature}` : '--'}
                unit="°C"
                subtitle="Climate"
                icon={Thermometer}
                accentColor="amber"
                isPulsing={!isTempUnavailable && lastChangedKey === 'temperature'}
                isOffline={isTempUnavailable}
                reduceMotion={reduceMotion}
                stats={tempStats}
              />
              <StatCard
                title="HUMIDITY"
                value={!isHumUnavailable && data.humidity !== null ? `${data.humidity}` : '--'}
                unit="%"
                subtitle="Moisture"
                icon={Droplets}
                accentColor="cyan"
                isPulsing={!isHumUnavailable && lastChangedKey === 'humidity'}
                isOffline={isHumUnavailable}
                reduceMotion={reduceMotion}
                stats={humStats}
              />
              <StatCard
                title="GAS SENSOR"
                value={!isGasUnavailable && data.gas !== null ? `${data.gas}` : '--'}
                unit="ADC"
                subtitle="Raw ADC"
                icon={Flame}
                accentColor="red"
                isPulsing={!isGasUnavailable && lastChangedKey === 'gas'}
                isOffline={isGasUnavailable}
                reduceMotion={reduceMotion}
                stats={gasStats}
              />
            </div>
          );
        })()}
      </motion.div>

      {/* SECTION 2: INTERACTIVE APPLIANCE & DOOR CONTROLS (All 5 Cards Uniform Size) */}
      <motion.div variants={item} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-white text-base sm:text-lg flex items-center gap-2">
            <DoorOpen className="w-5 h-5 text-cyan-400" />
            INTERACTIVE APPLIANCE & DOOR CONTROLS
          </h2>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-3 ${isOfflineOrChecking ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-2.5 sm:gap-4`}>
          {/* Door 1 Card */}
          <StatCard
            title="DOOR 1"
            value={door1Open ? 'OPEN' : 'CLOSED'}
            unit={data.servo1 !== null ? `(${data.servo1}°)` : ''}
            subtitle=""
            icon={door1Open ? DoorOpen : DoorClosed}
            accentColor="violet"
            isPulsing={lastChangedKey === 'servo1'}
            disabled={isControlDisabled}
            onOfflineClick={handleOfflineClick}
            reduceMotion={reduceMotion}
            onClick={handleToggleDoor1}
          />

          {/* Door 2 Card */}
          <StatCard
            title="DOOR 2"
            value={door2Open ? 'OPEN' : 'CLOSED'}
            unit={data.servo2 !== null ? `(${data.servo2}°)` : ''}
            subtitle=""
            icon={door2Open ? DoorOpen : DoorClosed}
            accentColor="cyan"
            isPulsing={lastChangedKey === 'servo2'}
            disabled={isControlDisabled}
            onOfflineClick={handleOfflineClick}
            reduceMotion={reduceMotion}
            onClick={handleToggleDoor2}
          />

          {/* LED 1 Light Card */}
          <LEDControl
            title="LED 1 LIGHT"
            firebasePath="/led1"
            state={data.led1}
            accentColor="cyan"
            disabled={isControlDisabled}
            onOfflineClick={handleOfflineClick}
            onToggle={async (state) => {
              try {
                await setLED1(state);
              } catch (e) {
                console.error('Failed to update LED 1', e);
              }
            }}
            reduceMotion={reduceMotion}
          />

          {/* LED 2 Light Card */}
          <LEDControl
            title="LED 2 LIGHT"
            firebasePath="/led2"
            state={data.led2}
            accentColor="violet"
            disabled={isControlDisabled}
            onOfflineClick={handleOfflineClick}
            onToggle={async (state) => {
              try {
                await setLED2(state);
              } catch (e) {
                console.error('Failed to update LED 2', e);
              }
            }}
            reduceMotion={reduceMotion}
          />

          {/* Motor Fan Drive Card */}
          <MotorControl
            title="MOTOR FAN"
            firebasePath="/motor"
            state={data.motor}
            disabled={isControlDisabled}
            onOfflineClick={handleOfflineClick}
            onToggle={async (state) => {
              try {
                await setMotor(state);
              } catch (e) {
                console.error('Failed to update Motor', e);
              }
            }}
          />

          {/* Offline Control Card - Placed side-by-side with Motor Fan card */}
          {isOfflineOrChecking && (
            <OfflineControlCard
              isEnabled={isOfflineControlEnabled}
              onToggle={handleToggleOfflineControl}
              reduceMotion={reduceMotion}
            />
          )}
        </div>
      </motion.div>

      {/* SECTION 3: FULL-WIDTH TELEMETRY TIMELINE CHART */}
      <motion.div variants={item} className="w-full">
        <SensorChart history={history} metric="all" title="ENVIRONMENTAL TELEMETRY TIMELINE" onClearHistory={onClearHistory} onNotify={onNotify} isDeviceOffline={isDeviceOffline} />
      </motion.div>
    </motion.div>
  );
}
