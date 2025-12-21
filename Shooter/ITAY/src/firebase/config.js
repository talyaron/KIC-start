// Firebase Configuration with provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyDl1OK1RAnBwbdWxEwlgZv869agSQn-mlQ",
  authDomain: "project-keco.firebaseapp.com",
  projectId: "project-keco",
  storageBucket: "project-keco.firebasestorage.app",
  messagingSenderId: "859756799800",
  appId: "1:859756799800:web:1e500da3e8a8cbcd4f83cd",
  measurementId: "G-ZR83Y597DN",
  databaseURL: "https://project-keco-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Enable Realtime Database logging for debugging
firebase.database.enableLogging(true);

// Export Firebase services
export const auth = app.auth();
export const firestore = app.firestore();
export const database = app.database(firebaseConfig.databaseURL);

export default firebase;

console.log('🔥 Firebase initialized successfully');
