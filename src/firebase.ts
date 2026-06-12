import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// WARNING: Direct client-side connection to Firestore initialized here
// in order to adhere strictly to the user request for a seamless Vercel deployment
// where server-side /api routes are unavailable.
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
