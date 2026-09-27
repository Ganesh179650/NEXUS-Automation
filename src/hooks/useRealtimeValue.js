import { useState, useEffect, useRef } from 'react';
import { subscribeToPath, subscribeToFirebaseConnection } from '../services/deviceService';

/**
 * Hook to subscribe to a single Firebase Realtime Database path.
 * Returns { value, loading, error, isPulsing }
 */
export function useRealtimeValue(path, defaultValue = null) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevValueRef = useRef(defaultValue);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToPath(path, (val, err) => {
      setLoading(false);
      if (err) {
        setError(err);
      } else {
        setError(null);
        if (val !== null && val !== undefined) {
          // Trigger value pulse animation if value changed
          if (prevValueRef.current !== null && prevValueRef.current !== val) {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 500);
          }
          prevValueRef.current = val;
          setValue(val);
        } else {
          setValue(null);
        }
      }
    });

    return () => unsubscribe();
  }, [path]);

  return { value, loading, error, isPulsing };
}

/**
 * Hook to subscribe to all 8 Firebase IoT paths concurrently with staleness tracking.
 */
export function useAllIoTValues(offlineThresholdMs = 17000, initialCheckMs = 7000) {
  const [data, setData] = useState({
    servo1: null,
    servo2: null,
    led1: null,
    led2: null,
    motor: null,
    gas: null,
    temperature: null,
    humidity: null,
    buzzer: null,
    ping: null,
  });
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastChangedKey, setLastChangedKey] = useState(null);

  const [isDeviceOffline, setIsDeviceOffline] = useState(false);
  const [isCheckingTelemetry, setIsCheckingTelemetry] = useState(true);

  // Only set to true AFTER online/offline has been conclusively decided.
  // Prevents the badge from flashing "DEVICE ONLINE" before actual status is known.
  const [statusDetermined, setStatusDetermined] = useState(false);

  // Store mount timestamp
  const mountTimeRef = useRef(Date.now());

  // Store initial cached snapshot value for each path to distinguish Firebase cache sync from real ESP32 live pushes
  const initialSnapshotValuesRef = useRef({
    servo1: undefined,
    servo2: undefined,
    led1: undefined,
    led2: undefined,
    motor: undefined,
    gas: undefined,
    temperature: undefined,
    humidity: undefined,
    buzzer: undefined,
    ping: undefined,
  });

  // Store timestamp of last genuine live update pushed by physical ESP32
  const lastLiveUpdateRef = useRef({
    servo1: null,
    servo2: null,
    led1: null,
    led2: null,
    motor: null,
    gas: null,
    temperature: null,
    humidity: null,
    buzzer: null,
    ping: null,
  });

  // Track if any genuine live update has been confirmed from physical ESP32
  const liveConfirmedRef = useRef(false);

  const [offlineStatus, setOfflineStatus] = useState({
    servo1: 'checking',
    servo2: 'checking',
    led1: 'checking',
    led2: 'checking',
    motor: 'checking',
    gas: 'checking',
    temperature: 'checking',
    humidity: 'checking',
    buzzer: 'checking',
    ping: 'checking',
  });

  useEffect(() => {
    mountTimeRef.current = Date.now();
    liveConfirmedRef.current = false;
    setIsCheckingTelemetry(true);
    setStatusDetermined(false);
    setIsInitialLoading(true);

    // Smooth 1.5s boot/rendering phase for TelemetryLoadingScreen
    const initialLoadingTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    initialSnapshotValuesRef.current = {
      servo1: undefined,
      servo2: undefined,
      led1: undefined,
      led2: undefined,
      motor: undefined,
      gas: undefined,
      temperature: undefined,
      humidity: undefined,
      buzzer: undefined,
      ping: undefined,
    };

    const unsubConn = subscribeToFirebaseConnection((connected) => {
      setIsConnected(connected);
    });

    const paths = ['servo1', 'servo2', 'led1', 'led2', 'motor', 'gas', 'temperature', 'humidity', 'buzzer', 'ping'];
    const unsubs = paths.map((path) => {
      return subscribeToPath(path, (val) => {
        if (val !== null && val !== undefined) {
          const now = Date.now();

          if (initialSnapshotValuesRef.current[path] === undefined) {
            // Initial snapshot callback from Firebase RTDB cache on mount
            initialSnapshotValuesRef.current[path] = val;
          } else {
            // Subsequent callback for this path.
            // A genuine live update from ESP32 is confirmed if ping heartbeat or sensor values update
            const isValueChanged = val !== initialSnapshotValuesRef.current[path];
            const isHeartbeatOrSensor = path === 'ping' || path === 'temperature' || path === 'humidity' || path === 'gas';

            if (isValueChanged || path === 'ping') {
              initialSnapshotValuesRef.current[path] = val;
              if (isHeartbeatOrSensor) {
                lastLiveUpdateRef.current[path] = now;
                liveConfirmedRef.current = true;

                queueMicrotask(() => {
                  setIsCheckingTelemetry(false);
                  setIsDeviceOffline(false);
                  setStatusDetermined(true);
                });
              }
            }
          }
        }

        queueMicrotask(() => {
          setData((prev) => {
            if (prev[path] !== val) {
              setLastChangedKey(path);
              setTimeout(() => setLastChangedKey(null), 500);
            }
            return { ...prev, [path]: val };
          });
          setLoading(false);
        });
      });
    });

    // Check staleness and connectivity status every 1 second
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsedSinceMount = now - mountTimeRef.current;
      const isStillInCheckWindow = elapsedSinceMount < initialCheckMs;

      if (!liveConfirmedRef.current && isStillInCheckWindow) {
        // Still in check window AND no genuine live update confirmed yet -> STAY IN CHECKING CONNECTIVITY
        setIsCheckingTelemetry(true);
        setIsDeviceOffline(false);
        setStatusDetermined(false);
        setOfflineStatus({
          servo1: 'checking',
          servo2: 'checking',
          led1: 'checking',
          led2: 'checking',
          motor: 'checking',
          gas: 'checking',
          temperature: 'checking',
          humidity: 'checking',
          buzzer: 'checking',
          ping: 'checking',
        });
      } else {
        // Check window has expired OR a live update was confirmed!
        const pingLive = lastLiveUpdateRef.current.ping;
        const tempLive = lastLiveUpdateRef.current.temperature;
        const humLive = lastLiveUpdateRef.current.humidity;
        const gasLive = lastLiveUpdateRef.current.gas;

        // Check if any of the 4 values (ping, temperature, humidity, gas) has updated within offlineThresholdMs
        const isPingRecent = pingLive && (now - pingLive <= offlineThresholdMs);
        const isTempRecent = tempLive && (now - tempLive <= offlineThresholdMs);
        const isHumRecent = humLive && (now - humLive <= offlineThresholdMs);
        const isGasRecent = gasLive && (now - gasLive <= offlineThresholdMs);

        // Device is ONLINE if ANY ONE of the 4 values (ping, temperature, humidity, gas) is updated!
        // Device is OFFLINE ONLY if ALL 4 values are missing or stale.
        const isAnyValueLive = isPingRecent || isTempRecent || isHumRecent || isGasRecent;
        const isOffline = !isAnyValueLive;

        setIsDeviceOffline(isOffline);
        setIsCheckingTelemetry(false);
        setStatusDetermined(true);

        setOfflineStatus((prev) => {
          let changed = false;
          const next = { ...prev };

          paths.forEach((p) => {
            const live = lastLiveUpdateRef.current[p];
            const isStale = !live || now - live > offlineThresholdMs;
            if (next[p] !== isStale) {
              next[p] = isStale;
              changed = true;
            }
          });

          next.temperature = isOffline;
          next.humidity = isOffline;
          next.gas = isOffline;
          next.ping = isOffline;

          return changed || prev.temperature !== isOffline ? next : prev;
        });
      }
    }, 1000);

    // Background / Screen Lock visibility listener to trigger instant telemetry re-sync
    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const pingLive = lastLiveUpdateRef.current.ping;
        const tempLive = lastLiveUpdateRef.current.temperature;
        const humLive = lastLiveUpdateRef.current.humidity;
        const gasLive = lastLiveUpdateRef.current.gas;
        const isAnyValueLive =
          (pingLive && now - pingLive <= offlineThresholdMs) ||
          (tempLive && now - tempLive <= offlineThresholdMs) ||
          (humLive && now - humLive <= offlineThresholdMs) ||
          (gasLive && now - gasLive <= offlineThresholdMs);

        if (isAnyValueLive) {
          setIsDeviceOffline(false);
          setIsCheckingTelemetry(false);
          setStatusDetermined(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilitySync);
    window.addEventListener('focus', handleVisibilitySync);

    return () => {
      clearTimeout(initialLoadingTimer);
      unsubConn();
      unsubs.forEach((unsub) => unsub());
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
      window.removeEventListener('focus', handleVisibilitySync);
    };
  }, [offlineThresholdMs, initialCheckMs]);

  return { data, loading, isInitialLoading, isConnected, lastChangedKey, offlineStatus, isDeviceOffline, isCheckingTelemetry, statusDetermined };
}
