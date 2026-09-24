import { useState, useEffect, useRef, useCallback } from 'react';
import { saveTelemetryRecord, subscribeToTelemetryHistory, clearTelemetryHistory } from '../services/deviceService';
import { saveSensorReading } from '../services/firestoreService';

const CACHE_KEY = 'NEXUS_TELEMETRY_CACHE';

/**
 * Hook to manage persistent real-time historical data points for sensors.
 * Syncs with Firebase Realtime Database (/history) and caches locally in browser.
 */
export function useSessionHistory(tempVal, humidityVal, gasVal, maxPoints = 2000) {
  const [history, setHistory] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const lastSavedRef = useRef({ time: 0, temp: null, humidity: null, gas: null });

  // 1. Subscribe to Firebase RTDB /history records
  useEffect(() => {
    const unsubscribe = subscribeToTelemetryHistory((remoteRecords, error) => {
      if (error || !remoteRecords) return;

      setHistory((prev) => {
        const map = new Map();
        
        // Add existing local items
        prev.forEach((item) => {
          const key = item.id || `${item.timestamp}-${item.temp}-${item.humidity}-${item.gas}`;
          map.set(key, item);
        });

        // Add/overwrite with remote items from Firebase RTDB
        remoteRecords.forEach((item) => {
          const key = item.id || `${item.timestamp}-${item.temp}-${item.humidity}-${item.gas}`;
          map.set(key, item);
        });

        const merged = Array.from(map.values());
        merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        const trimmed = merged.length > maxPoints ? merged.slice(merged.length - maxPoints) : merged;

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
        } catch (e) {
          console.warn('LocalStorage telemetry save warning:', e);
        }

        return trimmed;
      });
    }, maxPoints);

    return () => unsubscribe();
  }, [maxPoints]);

  // 2. Auto-log new incoming live readings to Firebase RTDB and Firestore
  useEffect(() => {
    if (tempVal === null && humidityVal === null && gasVal === null) return;

    const now = Date.now();
    const last = lastSavedRef.current;
    const timeElapsed = now - last.time;

    const valuesChanged =
      last.temp !== tempVal ||
      last.humidity !== humidityVal ||
      last.gas !== gasVal;

    // Log if values changed and at least 3s elapsed, OR if 15s elapsed without change
    if ((valuesChanged && timeElapsed > 3000) || timeElapsed > 15000) {
      const dateObj = new Date(now);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

      const newRecord = {
        timestamp: now,
        time: timeStr,
        dateStr,
        temp: tempVal !== null ? Number(tempVal) : null,
        humidity: humidityVal !== null ? Number(humidityVal) : null,
        gas: gasVal !== null ? Number(gasVal) : null,
      };

      lastSavedRef.current = {
        time: now,
        temp: tempVal,
        humidity: humidityVal,
        gas: gasVal,
      };

      // Persist to Firebase RTDB
      saveTelemetryRecord(newRecord);

      // Persist to Firestore with serverTimestamp()
      saveSensorReading({ temp: tempVal, humidity: humidityVal, gas: gasVal });
    }
  }, [tempVal, humidityVal, gasVal]);

  /**
   * Calculate stats (Min, Max, Average, Trend, Count) for a metric key ('temp', 'humidity', 'gas')
   */
  const getStats = useCallback(
    (key) => {
      const validPoints = history
        .map((h) => h[key])
        .filter((val) => typeof val === 'number' && !isNaN(val));

      if (validPoints.length === 0) {
        return { min: '--', max: '--', avg: '--', trend: 'stable', count: 0 };
      }

      const min = Math.min(...validPoints);
      const max = Math.max(...validPoints);
      const sum = validPoints.reduce((acc, curr) => acc + curr, 0);
      const avg = (sum / validPoints.length).toFixed(1);

      let trend = 'stable';
      if (validPoints.length >= 2) {
        const recent = validPoints[validPoints.length - 1];
        const previous = validPoints[validPoints.length - 2];
        if (recent > previous) trend = 'up';
        else if (recent < previous) trend = 'down';
      }

      return { min, max, avg, trend, count: validPoints.length };
    },
    [history]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    await clearTelemetryHistory();
  }, []);

  return { history, getStats, clearHistory };
}
