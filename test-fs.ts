import { readFileSync } from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

try {
  const firebaseConfig = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
  console.log("Config loaded project:", firebaseConfig.projectId);
  console.log("Database ID:", firebaseConfig.firestoreDatabaseId);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  
  setDoc(doc(db, "bags", "BOLSA-001"), { id: "BOLSA-001", status: "unassigned", userId: null })
    .then(() => {
      console.log("Success! Write on custom database succeeded.");
      return getDoc(doc(db, "bags", "BOLSA-001"));
    })
    .then(snap => {
      console.log("Success! Read on custom database succeeded. Data:", snap.data());
      process.exit(0);
    })
    .catch(err => {
      console.error("Firestore custom database Read Error:", err);
      process.exit(1);
    });
} catch (e) {
  console.error("Crash:", e);
  process.exit(1);
}
