
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD0clKTWjWI0MunjDoZB3ylL68Sc5P7Ly8",
  authDomain: "crazy-site-f2897.firebaseapp.com",
  projectId: "crazy-site-f2897",
  storageBucket: "crazy-site-f2897.firebasestorage.app",
  messagingSenderId: "630522631636",
  appId: "1:630522631636:web:889064236ebef145683241",
  measurementId: "G-F615Z0X9LF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
