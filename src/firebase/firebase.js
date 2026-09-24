import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDS4rBkI0m9bF-UaLM3Y97BY-Hd1fm_HdU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "automation-b7189.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://automation-b7189-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "automation-b7189",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "automation-b7189.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "230300968244",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:230300968244:web:333275a0fb3482550b7161",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-VSGNTB814D"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = getDatabase(app);

// Initialize Firestore
const firestore = getFirestore(app);

export { app, db, firestore };

