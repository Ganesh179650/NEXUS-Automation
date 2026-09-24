import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

const COLLECTION_NAME = 'sensorHistory';
let lastWriteTime = 0;
let lastValues = { temp: null, humidity: null, gas: null };

/**
 * Persists a sensor telemetry record to Firestore 'sensorHistory' with serverTimestamp().
 * Throttles writes to at most once per 30 seconds unless values change significantly.
 */
export async function saveSensorReading({ temp, humidity, gas }) {
  if (temp === null && humidity === null && gas === null) return;

  const now = Date.now();
  const timeElapsed = now - lastWriteTime;

  const tempNum = temp !== null && temp !== undefined ? Number(temp) : null;
  const humNum = humidity !== null && humidity !== undefined ? Number(humidity) : null;
  const gasNum = gas !== null && gas !== undefined ? Number(gas) : null;

  const valuesChanged =
    lastValues.temp !== tempNum ||
    lastValues.humidity !== humNum ||
    lastValues.gas !== gasNum;

  // Enforce minimum 30-second write interval if unchanged, or 10-second interval if changed
  if (timeElapsed < 10000 || (!valuesChanged && timeElapsed < 30000)) {
    return;
  }

  try {
    lastWriteTime = now;
    lastValues = { temp: tempNum, humidity: humNum, gas: gasNum };

    await addDoc(collection(firestore, COLLECTION_NAME), {
      temperature: tempNum,
      humidity: humNum,
      gas: gasNum,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to write sensor reading to Firestore sensorHistory:', err);
  }
}

/**
 * Format raw Firestore document into chart telemetry point object.
 */
function formatDoc(doc) {
  const data = doc.data();
  const ts = data.timestamp ? data.timestamp.toMillis() : Date.now();
  const d = new Date(ts);

  const tempVal = data.temperature !== undefined ? data.temperature : data.temp ?? null;

  return {
    id: doc.id,
    timestamp: ts,
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    dateStr: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    temp: tempVal,
    humidity: data.humidity ?? null,
    gas: data.gas ?? null,
  };
}

/**
 * Subscribes to historical sensor data from Firestore for a given date range.
 * - When end === 'now', attaches a live listener (onSnapshot) where timestamp >= start.
 * - When end is a fixed Date, performs a single-shot query (getDocs) where start <= timestamp <= end.
 */
export function subscribeToSensorHistory({ start, end }, callback) {
  if (!start || !(start instanceof Date)) {
    callback([], false, new Error('Invalid start date'));
    return () => {};
  }

  const startTimestamp = Timestamp.fromDate(start);

  if (end === 'now' || !end) {
    // Live query anchored to start timestamp up to current present moment
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('timestamp', '>=', startTimestamp),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map(formatDoc);
        callback(records, false, null);
      },
      (error) => {
        console.error('Firestore sensorHistory onSnapshot error:', error);
        callback([], false, error);
      }
    );

    return unsubscribe;
  } else if (end instanceof Date) {
    // Fixed closed historical range query
    const endTimestamp = Timestamp.fromDate(end);
    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'asc')
    );

    let active = true;

    getDocs(q)
      .then((snapshot) => {
        if (!active) return;
        const records = snapshot.docs.map(formatDoc);
        callback(records, false, null);
      })
      .catch((error) => {
        if (!active) return;
        console.error('Firestore sensorHistory getDocs error:', error);
        callback([], false, error);
      });

    return () => {
      active = false;
    };
  }

  callback([], false, null);
  return () => {};
}

/**
 * Cleanup function to purge historical telemetry records older than specified days (default 30 days).
 */
export async function cleanupOldSensorHistory(daysRetention = 30) {
  try {
    const cutoffDate = new Date(Date.now() - daysRetention * 24 * 60 * 60 * 1000);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const q = query(
      collection(firestore, COLLECTION_NAME),
      where('timestamp', '<', cutoffTimestamp)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
  } catch (err) {
    console.error('Error executing cleanupOldSensorHistory:', err);
    return 0;
  }
}
