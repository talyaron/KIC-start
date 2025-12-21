import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBC0L0Vl9xQ1ph2MK78K-W0_e2XYw3SbqI",
    authDomain: "shooter-project-f8b75.firebaseapp.com",
    projectId: "shooter-project-f8b75",
    storageBucket: "shooter-project-f8b75.firebasestorage.app",
    messagingSenderId: "456224708680",
    appId: "1:456224708680:web:252a9cd4934c3f54de607d",
    measurementId: "G-4YBWVF3MRK",
    databaseURL: "https://shooter-project-f8b75-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export services for the app to use
export const auth = getAuth(app);
export const db = getDatabase(app); // Switched to RTDB
export { analytics };
