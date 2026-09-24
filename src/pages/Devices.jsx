import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, DoorOpen, ShieldAlert, Power } from 'lucide-react';
import ServoControl from '../components/ServoControl';
import LEDControl from '../components/LEDControl';
import MotorControl from '../components/MotorControl';
import QuickActions from '../components/QuickActions';
import TelemetryLoadingScreen from '../components/TelemetryLoadingScreen';
import { setServo1Angle, setServo2Angle, setLED1, setLED2, setMotor } from '../services/deviceService';
import { useDeviceOnlineNotification } from '../hooks/useDeviceOnlineNotification';

export default function Devices({ data, onNotify, reduceMotion, isDeviceOffline = false, isCheckingTelemetry = true, isInitialLoading = false }) {
  if (isInitialLoading) {
    return <TelemetryLoadingScreen />;
  }
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

  const [isOfflineControlEnabled, setIsOfflineControlEnabled] = useState(false);
  const isOfflineOrChecking = isDeviceOffline || isCheckingTelemetry;
  const isControlDisabled = isOfflineOrChecking && !isOfflineControlEnabled;

  useDeviceOnlineNotification({
    isOfflineControlEnabled,
    isDeviceOffline,
    isCheckingTelemetry,
    statusDetermined: !isCheckingTelemetry,
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
        onNotify('Device offline: Controls disabled. Enable "OFFLINE CONTROL" to override', 'error');
      }
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
            HARDWARE ACTUATOR SUITE
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2 flex items-center gap-3">
            <Sliders className="w-7 h-7 text-cyan-400" /> APPLIANCE & DOOR CONTROLS
          </h1>
          <p className="text-sm text-slate-400">
            Direct Firebase control for Door 1 (GPIO 25), Door 2 (GPIO 26), LEDs, and DC Motor drive.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isOfflineOrChecking && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleToggleOfflineControl}
              className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2.5 border select-none ${
                isOfflineControlEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-[0_0_16px_rgba(245,158,11,0.35)] clay-badge'
                  : 'bg-slate-900/90 text-amber-400/90 border-amber-500/35 hover:border-amber-500/60 hover:bg-amber-500/10'
              }`}
              title="Toggle Offline Manual Control"
            >
              <ShieldAlert className={`w-4 h-4 ${isOfflineControlEnabled ? 'text-amber-400 animate-pulse' : 'text-amber-400/80'}`} />
              <span>OFFLINE CONTROL: <span className={isOfflineControlEnabled ? 'text-amber-300 font-extrabold' : 'text-slate-400'}>{isOfflineControlEnabled ? 'ENABLED' : 'DISABLED'}</span></span>

              <div className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${isOfflineControlEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-700/80 justify-start'}`}>
                <motion.div layout className="w-3 h-3 rounded-full bg-slate-950 shadow-md" />
              </div>
            </motion.button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            Realtime DB Target: <span className="text-cyan-400">/servo1, /servo2, /led1, /led2, /motor</span>
          </div>
        </div>
      </motion.div>

      {/* Main 2x2 Grid for Door 1, Door 2, LED 1, LED 2 */}
      <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:gap-6">
        <ServoControl
          id="servo1"
          title="DOOR 1 (SERVO 1)"
          gpio="GPIO 25"
          firebasePath="/servo1"
          angle={data.servo1}
          disabled={isControlDisabled}
          onOfflineClick={handleOfflineClick}
          onAngleChange={async (angle) => {
            try {
              await setServo1Angle(angle);
            } catch (e) {
              console.error('Failed to update Door 1', e);
            }
          }}
          reduceMotion={reduceMotion}
        />

        <ServoControl
          id="servo2"
          title="DOOR 2 (SERVO 2)"
          gpio="GPIO 26"
          firebasePath="/servo2"
          angle={data.servo2}
          disabled={isControlDisabled}
          onOfflineClick={handleOfflineClick}
          onAngleChange={async (angle) => {
            try {
              await setServo2Angle(angle);
            } catch (e) {
              console.error('Failed to update Door 2', e);
            }
          }}
          reduceMotion={reduceMotion}
        />

        <LEDControl
          title="LED 1 LIGHT"
          firebasePath="/led1"
          state={data.led1}
          color="#06b6d4"
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

        <LEDControl
          title="LED 2 LIGHT"
          firebasePath="/led2"
          state={data.led2}
          color="#a855f7"
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
      </motion.div>

      {/* Motor & Quick System Actions */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MotorControl
          title="MOTOR FAN DRIVE"
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
          reduceMotion={reduceMotion}
        />

        <div className="md:col-span-2">
          <QuickActions onNotification={onNotify} disabled={isControlDisabled} isCheckingTelemetry={isCheckingTelemetry} />
        </div>
      </motion.div>
    </motion.div>
  );
}
