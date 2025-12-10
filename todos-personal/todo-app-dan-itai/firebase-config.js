// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2yPjsrBNtOBf35VjdC6wMh-Cb0S386M8",
  authDomain: "kic1-ab4a0.firebaseapp.com",
  projectId: "kic1-ab4a0",
  storageBucket: "kic1-ab4a0.firebasestorage.app",
  messagingSenderId: "607927688870",
  appId: "1:607927688870:web:be3e726e8d519f16839e67",
  measurementId: "G-WG4SHMNKQ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);
