import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuration for Firebase
// We prioritize process.env.API_KEY (injected by Vite).
// If that is missing (local dev without .env), we fall back to the known public key for this project.
const apiKey = process.env.API_KEY || "AIzaSyAnjmqJyDTFckcSzBVxwjoGxvsGwR7VEXU";

if (!apiKey) {
  console.warn("Firebase: API_KEY is undefined. Authentication will likely fail.");
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "gen-lang-client-0377336352.firebaseapp.com",
  projectId: "gen-lang-client-0377336352",
  storageBucket: "gen-lang-client-0377336352.appspot.com",
  messagingSenderId: "377336352", 
  appId: "1:377336352:web:placeholder" 
};

// Initialize Firebase
let app;
let auth: any;
let db: any;
let googleProvider: any;

try {
  app = firebaseApp.initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    throw error;
  }
};

export const signOut = async () => {
  if (!auth) return;
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export { auth, db };