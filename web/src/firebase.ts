import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';

// Firebase configuration - User needs to replace with their own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDemo-REPLACE-WITH-YOUR-KEY",
  authDomain: "pulsebuilder-app.firebaseapp.com",
  projectId: "pulsebuilder-app",
  storageBucket: "pulsebuilder-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const emailProvider = new EmailAuthProvider();
