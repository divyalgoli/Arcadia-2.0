/**
 * Arcadia — Firebase configuration
 * ------------------------------------------------------------------
 * Paste the config object from your own Firebase project below.
 *
 * How to get it:
 *   1. Go to https://console.firebase.google.com and create a project
 *      (it's free — the "Spark" plan covers this site easily).
 *   2. Enable "Authentication" → Sign-in method → Email/Password.
 *   3. Enable "Firestore Database" → Create database (production mode).
 *   4. Paste the security rules from FIREBASE_SETUP.md into the
 *      Firestore "Rules" tab.
 *   5. Project settings (gear icon) → "Your apps" → Add app → Web (</>) .
 *      Copy the firebaseConfig object Firebase gives you and paste its
 *      values in below.
 *
 * This file is loaded by the homepage AND by every game (each game
 * loads it via a relative "../../js/firebase-config.js" path), so it
 * only needs to be edited once, right here.
 *
 * Until you fill this in, login and the cloud leaderboard are simply
 * disabled everywhere — everything else on the site keeps working
 * normally.
 */
const ARCADIA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDFoUAXADEAIbLo6ciEufkpBLbXbEqlq18",
  authDomain: "gamehub-4ae3b.firebaseapp.com",
  projectId: "gamehub-4ae3b",
  storageBucket: "gamehub-4ae3b.firebasestorage.app",
  messagingSenderId: "895422306759",
  appId: "1:895422306759:web:32fb14b679fb082ad6e1e2"
};
