import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD24CyssxP8FN5tGmhU2OYb_X4wnopJ7GY",
  authDomain: "jungle-cook-d3e61.firebaseapp.com",
  projectId: "jungle-cook-d3e61",
  storageBucket: "jungle-cook-d3e61.firebasestorage.app",
  messagingSenderId: "312962292074",
  appId: "1:312962292074:web:8fd866c6b5ff5883faad13",
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const auth = isFirebaseConfigured
  ? getAuth(initializeApp(firebaseConfig))
  : null;

export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
};
