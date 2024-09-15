// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBH11oUextGQYyDYIU6pHDdaEuNjgZrqjo",
  authDomain: "emoshown.firebaseapp.com",
  projectId: "emoshown",
  storageBucket: "emoshown.appspot.com",
  messagingSenderId: "304217090068",
  appId: "1:304217090068:web:e81f1229bdca0b05835f01",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const firestore = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);
