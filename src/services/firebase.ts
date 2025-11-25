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
const setVars = requiredEnvVars.filter((varName) => import.meta.env[varName]);

// Check if we're in a CI environment (GitHub Actions sets CI=true)
// Vite exposes this as VITE_CI if defined in workflow
const isCI = import.meta.env.VITE_CI === 'true' || import.meta.env.MODE === 'test';

// Smart validation logic:
// 1. If NO vars are set → Use fallback (development/CI)
// 2. If SOME vars are set but not all → Error (misconfiguration)
// 3. If ALL vars are set → Use them (production)

if (setVars.length > 0 && missingVars.length > 0 && !isCI) {
  // Partial configuration detected - this is an error
  throw new Error(
    `Incomplete Firebase configuration. Missing: ${missingVars.join(', ')}\n` +
      'Please ensure all Firebase environment variables are set, or remove them all to use fallback config.\n' +
      'Copy .env.example to .env and fill in all Firebase credentials.'
  );
}

// If no vars are set at all, use fallback with warning
if (setVars.length === 0) {
  const mode = import.meta.env.DEV ? 'development' : isCI ? 'CI' : 'production';
  console.warn(
    `⚠️ Firebase environment variables not found. Using development fallback config in ${mode} mode.\n` +
      'For production deployment, set Firebase secrets in GitHub repository settings or .env file.'
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
