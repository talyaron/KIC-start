// Firebase Configuration (Firestore Mode)
const firebaseConfig = {
    apiKey: "AIzaSyB714P_E1XF6ce4WOVvo-EhDnSS4isQHWw",
    authDomain: "kyc-dan.firebaseapp.com",
    projectId: "kyc-dan",
    storageBucket: "kyc-dan.firebasestorage.app",
    messagingSenderId: "332101643338",
    appId: "1:332101643338:web:68d379b1c62d025a7c8ab3",
    measurementId: "G-0HB5M20RKM"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized (Firestore Mode)");
} catch (error) {
    console.error("Firebase Initialization Error.", error);
    alert("Firebase Error: " + error.message);
}

// Export global references
window.auth = firebase.auth();
window.db = firebase.firestore();

// For backward compatibility with existing code that uses just 'db' or 'auth' in the same scope
const auth = window.auth;
const db = window.db;
