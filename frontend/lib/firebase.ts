import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration using environment variables
// Ensure these are set in your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check if all required keys are present
const isConfigValid = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

if (!isConfigValid && typeof window !== 'undefined') {
  console.warn(
    "Firebase: Missing configuration keys. Please add NEXT_PUBLIC_FIREBASE_* variables to your .env.local file."
  );
}

// Initialize Firebase only if config is valid
let app;
let auth: any;
const googleProvider = new GoogleAuthProvider();

if (isConfigValid) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // Provide a mock auth object or leave it undefined to prevent immediate crash
  // The login button will handle the missing config error when clicked
  auth = null; 
}

export { auth, googleProvider };
