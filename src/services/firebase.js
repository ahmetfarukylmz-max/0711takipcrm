import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase Configuration
// TODO: Move these credentials to environment variables (.env)
const firebaseConfig = {
  apiKey: "AIzaSyC4sX0QJpGgHqxQcTQYP3Jy4eMw9el4L0k",
  authDomain: "takipcrm-c1d3f.firebaseapp.com",
  projectId: "takipcrm-c1d3f",
  storageBucket: "takipcrm-c1d3f.appspot.com",
  messagingSenderId: "342863238377",
  appId: "1:342863238377:web:bc010cc0233bf863c8cc78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
