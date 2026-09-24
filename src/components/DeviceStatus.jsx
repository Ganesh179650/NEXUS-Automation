import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export default function DeviceStatus({ isConnected = false, isChecking = false }) {
  const isAmber = isChecking;
  const isOnline = isConnected && !isChecking;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full clay-inset-dark">
      <span className="relative flex h-2.5 w-2.5">
        {(isOnline || isAmber) && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isAmber ? 'bg-amber-400' : 'bg-cyan-400'
            }`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
            isAmber
              ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
              : isOnline
              ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
              : 'bg-rose-500'
          }`}
        />
      </span>
      {isOnline ? (
        <Wifi className="w-3.5 h-3.5 text-cyan-400" />
      ) : isAmber ? (
        <Wifi className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-rose-400" />
      )}
    </div>
  );
}
