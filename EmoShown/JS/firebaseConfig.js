// Import the necessary modules
import CryptoJS from 'crypto-js';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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

// Check if the Auth instance is already initialized before initializing it
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    console.log('Auth already initialized, using existing instance.');
  } else {
    throw error;
  }
}

// If auth is not initialized, initialize it with persistence
if (!auth) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

// Your secret key used for encryption and decryption (must be the same key used during encryption)
const secretKey = 'emoshown';

/**
 * Decrypt data using AES.
 * @param {string} encryptedData - The encrypted string to decrypt.
 * @returns {string} - The decrypted string.
 */
const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
};

/**
 * Get user details from Firestore based on a given userId and decrypt the data.
 * @param {string} userId - The user ID to search for in the 'users' collection.
 * @returns {Promise<Object|null>} - Returns user data object if found and decrypted, otherwise null.
 */
export const getUserDetails = async (userId) => {
  try {
    const usersCollection = collection(firestore, 'users');
    const q = query(usersCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const encryptedData = userDoc.data();

      // Decrypt the fields that were encrypted (adjust field names as needed)
      const decryptedData = {
        userId: encryptedData.userId,
        email: decryptData(encryptedData.email), // Assuming email was encrypted
        name: decryptData(encryptedData.name),   // Assuming name was encrypted
        // Add more fields as needed
      };

      return decryptedData;
    } else {
      console.log('No user found with the given userId.');
      return null;
    }
  } catch (error) {
    console.error('Error getting user details:', error);
    throw error;
  }
};

// Usage Example
const fetchUserDetails = async (userId) => {
  try {
    const userDetails = await getUserDetails(userId);
    if (userDetails) {
      console.log('User Details:', userDetails);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Failed to fetch user details:', error);
  }
};

// Replace with any userId stored in your Firebase database
// fetchUserDetails('replace-with-dynamic-userId');
