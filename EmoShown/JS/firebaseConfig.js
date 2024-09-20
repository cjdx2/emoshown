// Import the necessary modules
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBH11oUextGQYyDYIU6pHDdaEuNjgZrqjo",
  authDomain: "emoshown.firebaseapp.com",
  projectId: "emoshown",
  storageBucket: "emoshown.appspot.com",
  messagingSenderId: "304217090068",
  appId: "1:304217090068:web:e81f1229bdca0b05835f01",
};

// Check if there are any initialized apps already to avoid re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore
export const firestore = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Directly initialize Firebase Auth with persistence for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };
