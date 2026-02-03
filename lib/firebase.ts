import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// Firebase configuration
// TODO: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB2CqkewTz3UDwWqgKv9ZUelZQ8jUzF9wA",
  authDomain: "ssit-lms.firebaseapp.com",
  projectId: "ssit-lms",
  storageBucket: "ssit-lms.firebasestorage.app",
  messagingSenderId: "177514984923",
  appId: "1:177514984923:web:8ec32116ebd0f492d963fe",
  measurementId: "G-ZP303G352G"
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export default app;

