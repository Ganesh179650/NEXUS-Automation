import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, DoorClosed, Minus, Plus } from 'lucide-react';
import WebGLCanvas from './WebGLCanvas';
import DoorModel3D from './DoorModel3D';
import { sanitizeServoAngle } from '../services/deviceService';

export default function ServoControl({
  id = 'servo1',
  title = 'DOOR 1 (SERVO 1)',
  gpio = 'GPIO 25',
  firebasePath = '/servo1',
  angle = 0,
  onAngleChange,
  disabled = false,
  onOfflineClick,
  reduceMotion = false,
}) {
  const [sliderVal, setSliderVal] = useState(angle);
  const [isDragging, setIsDragging] = useState(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (!isDragging) {
      setSliderVal(angle !== null && angle !== undefined ? angle : 0);
    }
  }, [angle, isDragging]);

  const handleSliderChange = (e) => {
    if (disabled) {
      if (onOfflineClick) onOfflineClick();
      return;
    }
    const newVal = sanitizeServoAngle(e.target.value);
    setSliderVal(newVal);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onAngleChange(newVal);
    }, 120);
  };

  const handleCommitAngle = (newAngle) => {
    if (disabled) {
      if (onOfflineClick) onOfflineClick();
      return;
    }
    const clamped = sanitizeServoAngle(newAngle);
    setSliderVal(clamped);
    onAngleChange(clamped);
  };

  const currentAngle = angle !== null && angle !== undefined ? angle : 0;
  const isOpen = currentAngle > 45;

  const handleToggleDoor = (e) => {
    e?.stopPropagation();
    if (disabled) {
      if (onOfflineClick) onOfflineClick();
      return;
    }
    handleCommitAngle(isOpen ? 0 : 180);
  };

  return (
    <motion.div
      whileHover={disabled ? {} : { y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={handleToggleDoor}
      className={`clay-card ${disabled ? 'opacity-50 cursor-not-allowed border-slate-800/40 bg-slate-900/40' : 'clay-card-interactive'} p-3.5 sm:p-5 flex flex-col justify-between overflow-hidden group select-none ${
        !disabled && isOpen ? 'border-emerald-500/40 bg-slate-900/80' : 'border-slate-800/80 bg-slate-900/60'
      }`}
    >
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-1">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-transform group-hover:scale-110 shrink-0 ${
                isOpen
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 clay-badge'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {isOpen ? (
                <DoorOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400" />
              ) : (
                <DoorClosed className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-slate-500" />
              )}
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-xs sm:text-base leading-tight truncate">{title}</h3>
              <p className="text-[10px] text-cyan-400 font-mono font-medium">{gpio}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold font-mono tracking-wider ${
                isOpen
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              {isOpen ? 'OPEN' : 'CLOSED'}
            </span>
            <p className={`text-[11px] font-bold font-heading tabular-nums ${isOpen ? 'text-emerald-400' : 'text-slate-500'}`}>
              {currentAngle}°
            </p>
          </div>
        </div>

        {/* 3D Door Model View (Swinging Door Panel) */}
        <div className="w-full h-28 sm:h-36 my-2 sm:my-3 rounded-xl overflow-hidden bg-slate-950/60 border border-slate-800 relative">
          <WebGLCanvas reduceMotion={reduceMotion} fallbackText="3D Door Visualizer...">
            <DoorModel3D angle={currentAngle} />
          </WebGLCanvas>
        </div>

        {/* Manual Angle Slider */}
        <div className="relative mb-3 pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              disabled={disabled}
              onClick={() => handleCommitAngle(sliderVal - 15)}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Slightly Close"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <input
              type="range"
              min="0"
              max="180"
              disabled={disabled}
              value={sliderVal}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              disabled={disabled}
              onClick={() => handleCommitAngle(sliderVal + 15)}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Slightly Open"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* CLICK TO TOGGLE DOOR Button */}
      <div className="mt-1" onClick={(e) => e.stopPropagation()}>
        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          disabled={disabled}
          onClick={handleToggleDoor}
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            disabled
              ? 'bg-slate-900 border border-slate-800 text-slate-600 opacity-50 cursor-not-allowed pointer-events-none'
              : isOpen
              ? 'bg-slate-800 border border-slate-700 text-slate-200 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
              : 'bg-emerald-500 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:bg-emerald-400'
          }`}
        >
          {isOpen ? (
            <>
              <DoorClosed className="w-4 h-4 text-rose-400" />
              <span>CLICK TO CLOSE DOOR</span>
            </>
          ) : (
            <>
              <DoorOpen className="w-4 h-4" />
              <span>CLICK TO OPEN DOOR</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
