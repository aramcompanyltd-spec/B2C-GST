
// FIX: Using Firebase v8 compat syntax to resolve module errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// IMPORTANT: In a real production environment, these should be managed by environment variables.
const firebaseConfig = {
  apiKey: "AIzaSyDjSgGd3q2OHMUsoQGLyOV2F8F3QZBIA_g",
  authDomain: "gst-calculator-app-28b35.firebaseapp.com",
  projectId: "gst-calculator-app-28b35",
  storageBucket: "gst-calculator-app-28b35.firebasestorage.app",
  messagingSenderId: "111823769193",
  appId: "1:111823769193:web:b2880ec78e6ddb045b1cf8",
  measurementId: "G-9MM9307EHQ"
};
// FIX: Initialize Firebase using the v8 compat syntax, checking if it's already initialized to prevent errors during hot-reloads.
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
const auth = app.auth();
const db = app.firestore();

// This is a placeholder for the appld used in the Firestore path.
// In a real multi-tenant app, this might be dynamic.
const appId = 'default-app-id';

export { auth, db, appId };