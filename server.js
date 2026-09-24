import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyDS4rBkI0m9bF-UaLM3Y97BY-Hd1fm_HdU",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "automation-b7189.firebaseapp.com",
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL || "https://automation-b7189-default-rtdb.firebaseio.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "automation-b7189",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "automation-b7189.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "230300968244",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:230300968244:web:333275a0fb3482550b7161",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const firestore = getFirestore(app);

const COLLECTION_NAME = 'sensorHistory';
let currentReading = { temp: null, humidity: null, gas: null };
let lastSaved = { temp: null, humidity: null, gas: null, time: 0 };

console.log('[NEXUS TELEMETRY BACKEND DAEMON] Service starting...');

function handleRTDBUpdate(path, val) {
  if (path === 'temperature' || path === 'sensors/temperature') currentReading.temp = val;
  if (path === 'humidity' || path === 'sensors/humidity') currentReading.humidity = val;
  if (path === 'gas' || path === 'sensors/gas') currentReading.gas = val;
}

// Subscribe to RTDB paths
['temperature', 'humidity', 'gas', 'sensors/temperature', 'sensors/humidity'].forEach((path) => {
  onValue(ref(db, path), (snapshot) => {
    if (snapshot.exists()) {
      handleRTDBUpdate(path, snapshot.val());
    }
  });
});

// Periodic throttled write loop to Firestore
setInterval(async () => {
  const { temp, humidity, gas } = currentReading;
  if (temp === null && humidity === null && gas === null) return;

  const now = Date.now();
  const timeElapsed = now - lastSaved.time;
  const changed = lastSaved.temp !== temp || lastSaved.humidity !== humidity || lastSaved.gas !== gas;

  // Throttle: write every 30s minimum, or 15s if values updated
  if (timeElapsed >= 30000 || (changed && timeElapsed >= 15000)) {
    try {
      lastSaved = { temp, humidity, gas, time: now };
      await addDoc(collection(firestore, COLLECTION_NAME), {
        temperature: temp !== null ? Number(temp) : null,
        humidity: humidity !== null ? Number(humidity) : null,
        gas: gas !== null ? Number(gas) : null,
        timestamp: serverTimestamp(),
      });
      console.log(`[NEXUS BACKEND DAEMON] Saved Firestore record: T=${temp}°C H=${humidity}% G=${gas}`);
    } catch (err) {
      console.error('[NEXUS BACKEND DAEMON] Error persisting to Firestore:', err);
    }
  }
}, 5000);

// Daily Retention Cleanup Job (Purge records > 30 days)
async function runDailyCleanup() {
  try {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const q = query(collection(firestore, COLLECTION_NAME), where('timestamp', '<', cutoff));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(firestore);
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`[NEXUS BACKEND DAEMON] Purged ${snap.size} expired records older than 30 days.`);
    }
  } catch (err) {
    console.error('[NEXUS BACKEND DAEMON] Retention cleanup error:', err);
  }
}

setInterval(runDailyCleanup, 24 * 60 * 60 * 1000);
runDailyCleanup();
