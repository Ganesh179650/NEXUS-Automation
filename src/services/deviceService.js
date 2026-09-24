import { ref, set, update, push, query, orderByChild, limitToLast, remove, onValue, off } from 'firebase/database';
import { db } from '../firebase/firebase';

/**
 * Validates and clamps servo angle to 0–180 degrees.
 */
export const sanitizeServoAngle = (angle) => {
  const num = parseInt(angle, 10);
  if (isNaN(num)) return 90;
  return Math.max(0, Math.min(180, num));
};

/**
 * Validates binary state to 0 or 1.
 */
export const sanitizeBinaryState = (state) => {
  if (state === true || state === 1 || state === '1' || state === 'ON') return 1;
  return 0;
};

// --- WRITE OPERATIONS ---

export const setServo1Angle = async (angle) => {
  const sanitized = sanitizeServoAngle(angle);
  const servoRef = ref(db, 'servo1');
  return await set(servoRef, sanitized);
};

export const setServo2Angle = async (angle) => {
  const sanitized = sanitizeServoAngle(angle);
  const servoRef = ref(db, 'servo2');
  return await set(servoRef, sanitized);
};

export const setBothServoAngles = async (angle) => {
  const sanitized = sanitizeServoAngle(angle);
  const rootRef = ref(db);
  return await update(rootRef, {
    servo1: sanitized,
    servo2: sanitized
  });
};

export const setLED1 = async (state) => {
  const sanitized = sanitizeBinaryState(state);
  const ledRef = ref(db, 'led1');
  return await set(ledRef, sanitized);
};

export const setLED2 = async (state) => {
  const sanitized = sanitizeBinaryState(state);
  const ledRef = ref(db, 'led2');
  return await set(ledRef, sanitized);
};

export const setAllLEDs = async (state) => {
  const sanitized = sanitizeBinaryState(state);
  const rootRef = ref(db);
  return await update(rootRef, {
    led1: sanitized,
    led2: sanitized
  });
};

export const setMotor = async (state) => {
  const sanitized = sanitizeBinaryState(state);
  const motorRef = ref(db, 'motor');
  return await set(motorRef, sanitized);
};

// --- SUBSCRIBER LISTENERS ---

export const subscribeToPath = (path, callback) => {
  const pathRef = ref(db, path);
  const unsubscribe = onValue(
    pathRef,
    (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : null;
      callback(val, null);
    },
    (error) => {
      console.error(`Firebase error on path /${path}:`, error);
      callback(null, error);
    }
  );
  return () => off(pathRef, 'value', unsubscribe);
};

export const subscribeToFirebaseConnection = (callback) => {
  const connectedRef = ref(db, '.info/connected');
  const unsubscribe = onValue(connectedRef, (snapshot) => {
    callback(snapshot.val() === true);
  });
  return () => off(connectedRef, 'value', unsubscribe);
};

export const subscribeToServo1 = (cb) => subscribeToPath('servo1', cb);
export const subscribeToServo2 = (cb) => subscribeToPath('servo2', cb);
export const subscribeToLED1 = (cb) => subscribeToPath('led1', cb);
export const subscribeToLED2 = (cb) => subscribeToPath('led2', cb);
export const subscribeToMotor = (cb) => subscribeToPath('motor', cb);
export const subscribeToGas = (cb) => subscribeToPath('gas', cb);
export const subscribeToTemperature = (cb) => subscribeToPath('temperature', cb);
export const subscribeToHumidity = (cb) => subscribeToPath('humidity', cb);

// --- TELEMETRY HISTORY PERSISTENCE IN FIREBASE RTDB ---

export const saveTelemetryRecord = async (record) => {
  if (!record || (record.temp === null && record.humidity === null && record.gas === null)) return;
  try {
    const historyRef = ref(db, 'history');
    await push(historyRef, record);
  } catch (err) {
    console.error('Failed to save telemetry record to Firebase RTDB:', err);
  }
};

export const subscribeToTelemetryHistory = (callback, maxRecords = 2000) => {
  const historyRef = ref(db, 'history');
  const historyQuery = query(historyRef, orderByChild('timestamp'), limitToLast(maxRecords));
  
  const unsubscribe = onValue(
    historyQuery,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback([], null);
        return;
      }
      const rawObj = snapshot.val();
      const recordsList = Object.keys(rawObj).map((key) => ({
        id: key,
        ...rawObj[key],
      }));
      // Sort strictly by timestamp ascending
      recordsList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      callback(recordsList, null);
    },
    (error) => {
      console.error('Firebase error on /history query:', error);
      callback(null, error);
    }
  );
  return () => off(historyQuery, 'value', unsubscribe);
};

export const clearTelemetryHistory = async () => {
  try {
    const historyRef = ref(db, 'history');
    await remove(historyRef);
  } catch (err) {
    console.error('Failed to clear telemetry history in Firebase RTDB:', err);
  }
};
