// Firebase Configuration with provided credentials
const firebaseConfig = {
  apiKey: "AIzaSyDl1OK1RAnBwbdWxEwlgZv869agSQn-mlQ",
  authDomain: "project-keco.firebaseapp.com",
  projectId: "project-keco",
  storageBucket: "project-keco.firebasestorage.app",
  messagingSenderId: "859756799800",
  appId: "1:859756799800:web:1e500da3e8a8cbcd4f83cd",
  measurementId: "G-ZR83Y597DN",
  databaseURL: "https://project-keco-default-rtdb.europe-west1.firebasedatabase.app/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Export Firebase services
export const auth = firebase.auth();
export const firestore = firebase.firestore();
export const database = firebase.database();

// Configure Firestore Cache (New API)
const settings = {
  cacheElementChild: true
};

// Enable offline persistence for Firestore
firestore.enablePersistence({ synchronizeTabs: true }).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

console.log('🔥 Firebase initialized successfully');
