import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Configuration
// Note: These keys are safe to be public as they are client-side keys.
// Security is enforced through Firestore Security Rules.

// Development fallback values (only used if .env is not configured)
const DEVELOPMENT_CONFIG = {
  apiKey: 'AIzaSyC4sX0QJpGgHqxQcTQYP3Jy4eMw9el4L0k',
  authDomain: 'takipcrm-c1d3f.firebaseapp.com',
  projectId: 'takipcrm-c1d3f',
  storageBucket: 'takipcrm-c1d3f.appspot.com',
  messagingSenderId: '342863238377',
  appId: '1:342863238377:web:bc010cc0233bf863c8cc78',
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredEnvVars.filter((varName) => !import.meta.env[varName]);

// In production, enforce environment variables
if (import.meta.env.PROD && missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n` +
      'Please copy .env.example to .env and fill in your Firebase credentials.'
  );
}

// In development, warn but allow fallback
if (import.meta.env.DEV && missingVars.length > 0) {
  console.warn(
    '⚠️ Firebase environment variables not found. Using development fallback config.\n' +
      'For production, please copy .env.example to .env and fill in your credentials.'
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEVELOPMENT_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEVELOPMENT_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEVELOPMENT_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEVELOPMENT_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEVELOPMENT_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEVELOPMENT_CONFIG.appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
