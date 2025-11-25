import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Configuration
// Note: These keys are safe to be public as they are client-side keys.
// Security is enforced through Firestore Security Rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC4sX0QJpGgHqxQcTQYP3Jy4eMw9el4L0k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'takipcrm-c1d3f.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'takipcrm-c1d3f',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'takipcrm-c1d3f.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '342863238377',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:342863238377:web:bc010cc0233bf863c8cc78',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
