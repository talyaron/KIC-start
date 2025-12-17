// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyA1NfYu_GADaJKgfBFq_leBIUTkj-xkOks",
    authDomain: "first-progect-7f82d.firebaseapp.com",
    projectId: "first-progect-7f82d",
    storageBucket: "first-progect-7f82d.firebasestorage.app",
    messagingSenderId: "760130698764",
    appId: "1:760130698764:web:849bfb01058a055652f829",
    measurementId: "G-E8DHLZFENZ"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const colorPicker = document.getElementById('colorPicker');
const body = document.body;
const statusDot = document.querySelector('.dot');

// Firestore Reference
const colorDocRef = db.collection("app").doc("color_state");

// Listen for real-time updates
colorDocRef.onSnapshot((docSnapshot) => {
    if (docSnapshot.exists) {
        const data = docSnapshot.data();
        const newColor = data.hex;

        // Update UI
        updateTheme(newColor);

        // Update picker value if it's not the one being dragged currently
        if (colorPicker.value !== newColor) {
            colorPicker.value = newColor;
        }
    } else {
        // Create the document if it doesn't exist
        colorDocRef.set({ hex: '#1a1a1a' });
    }
}, (error) => {
    console.error("Error getting document:", error);
    statusDot.style.backgroundColor = 'red';
    // If error is due to permissions or file:// protocol issues
    if (window.location.protocol === 'file:') {
        console.warn("Firestore might not work correctly when opened directly from file:// due to browser security restrictions. Please use a local server.");
    }
});

// Handle user input
colorPicker.addEventListener('input', (e) => {
    const newColor = e.target.value;
    updateTheme(newColor); // Immediate local feedback

    // Update Firestore
    colorDocRef.set({ hex: newColor })
        .catch((error) => {
            console.error("Error writing document: ", error);
        });
});

function updateTheme(color) {
    body.style.backgroundColor = color;

    // Calculate contrast for text color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    body.style.color = (yiq >= 128) ? '#1a1a1a' : '#ffffff';
}
