import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDAgvJ_mR7VIa8gqGOgHKogm32t7fuLBvU",
  authDomain: "shalomtest1.firebaseapp.com",
  projectId: "shalomtest1",
  storageBucket: "shalomtest1.firebasestorage.app",
  messagingSenderId: "115510731085",
  appId: "1:115510731085:web:89af5e5037ea3f69235704"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
