// TODO: Replace these with your actual Firebase project keys
// 1. Go to console.firebase.google.com
// 2. Create a new project (or use an existing one)
// 3. Go to Project Settings -> General -> "Your apps" -> Add Web App
// 4. Copy the "firebaseConfig" object and paste it below

const firebaseConfig = {
    apiKey: "AIzaSyD-XXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized");
} catch (e) {
    console.error("Firebase Initialization Error. Make sure you updated firebase-config.js!", e);
}

const db = firebase.database();
