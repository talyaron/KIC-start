import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Replace with your Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDEUi6nRU_jtGW-xI2JX7iPEPd3nVQjrnE",
  authDomain: "shooter-c72fa.firebaseapp.com",
  projectId: "shooter-c72fa",
  storageBucket: "shooter-c72fa.firebasestorage.app",
  messagingSenderId: "626173741986",
  appId: "1:626173741986:web:068099801a5f9b954240fb",
  measurementId: "G-RHD644M74W"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };
