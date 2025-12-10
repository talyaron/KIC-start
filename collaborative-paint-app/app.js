// Collaborative Paint App Logic

// --- State ---
const state = {
    isDrawing: false,
    color: '#000000',
    size: 5,
    lastX: 0,
    lastY: 0,
    db: null, // Firestore instance
    unsubscribe: null // Listener unsubscriber
};

// --- DOM Elements (initialized after DOM loads) ---
let canvas, ctx, wrapper, colorPicker, sizeSlider, sizeValue;
let clearBtn, configBtn, configModal, saveConfigBtn, closeConfigBtn;
let firebaseConfigInput, connectionStatus, statusText;

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyD2yPjsrBNtOBf35VjdC6wMh-Cb0S386M8",
    authDomain: "kic1-ab4a0.firebaseapp.com",
    projectId: "kic1-ab4a0",
    storageBucket: "kic1-ab4a0.firebasestorage.app",
    messagingSenderId: "607927688870",
    appId: "1:607927688870:web:be3e726e8d519f16839e67",
    measurementId: "G-WG4SHMNKQ5"
};

// --- Initialization ---
function initDOMElements() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    wrapper = document.getElementById('canvasWrapper');
    colorPicker = document.getElementById('colorPicker');
    sizeSlider = document.getElementById('sizeSlider');
    sizeValue = document.getElementById('sizeValue');
    clearBtn = document.getElementById('clearBtn');
    configBtn = document.getElementById('configBtn');
    configModal = document.getElementById('configModal');
    saveConfigBtn = document.getElementById('saveConfigBtn');
    closeConfigBtn = document.getElementById('closeConfigBtn');
    firebaseConfigInput = document.getElementById('firebaseConfigInput');
    connectionStatus = document.getElementById('connectionStatus');
    statusText = connectionStatus.querySelector('.status-text');
}

function init() {
    initDOMElements();
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Auto-connect with provided config
    connectToFirebase(firebaseConfig);

    setupEventListeners();
}

function resizeCanvas() {
    // Make canvas fill the wrapper but keep 1:1 pixel ratio for simplicity in this demo
    // In a real app, we might want a fixed size canvas that scrolls
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;

    // Set default styles again after resize
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// --- Drawing Logic ---
function startDrawing(e) {
    state.isDrawing = true;
    [state.lastX, state.lastY] = getCoordinates(e);
}

function draw(e) {
    if (!state.isDrawing) return;

    const [x, y] = getCoordinates(e);

    // Draw locally
    ctx.strokeStyle = state.color;
    ctx.lineWidth = state.size;
    ctx.beginPath();
    ctx.moveTo(state.lastX, state.lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Send to Firebase if connected
    if (state.db) {
        sendStroke({
            x0: state.lastX,
            y0: state.lastY,
            x1: x,
            y1: y,
            color: state.color,
            size: state.size
        });
    }

    [state.lastX, state.lastY] = [x, y];
}

function stopDrawing() {
    state.isDrawing = false;
}

function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return [x, y];
}

// --- Firebase Integration ---
function connectToFirebase(config) {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(config);
        }
        state.db = firebase.firestore();

        updateStatus(true);
        startListening();

        // Save valid config
        localStorage.setItem('paintApp_firebaseConfig', JSON.stringify(config));
        if (configModal.classList.contains('active')) {
            configModal.classList.remove('active');
        }

    } catch (error) {
        console.error("Firebase Connection Error:", error);
        alert("Failed to connect to Firebase. Check your configuration.");
        updateStatus(false);
    }
}

function updateStatus(connected) {
    if (connected) {
        connectionStatus.classList.add('connected');
        connectionStatus.classList.remove('disconnected');
        statusText.textContent = "Online";
    } else {
        connectionStatus.classList.remove('connected');
        connectionStatus.classList.add('disconnected');
        statusText.textContent = "Offline";
    }
}

function sendStroke(strokeData) {
    // We add a timestamp to order strokes
    state.db.collection('strokes').add({
        ...strokeData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(err => console.error("Error sending stroke:", err));
}

function startListening() {
    if (state.unsubscribe) state.unsubscribe();

    // Listen for strokes added in the last minute (to avoid loading entire history on refresh for this demo)
    // In a real app, you might want to load history or implement a more robust sync strategy
    const now = new Date();
    // const oneMinuteAgo = new Date(now.getTime() - 60000);

    state.unsubscribe = state.db.collection('strokes')
        .orderBy('timestamp')
        .limitToLast(1000) // Limit to recent strokes
        .onSnapshot(snapshot => {
            const changes = snapshot.docChanges();
            const hasRemovals = changes.some(change => change.type === 'removed');

            if (hasRemovals) {
                // If any strokes were removed, clear and redraw all remaining
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                snapshot.docs.forEach(doc => {
                    drawRemoteStroke(doc.data());
                });
            } else {
                // Only new strokes added, draw them
                changes.forEach(change => {
                    if (change.type === 'added') {
                        drawRemoteStroke(change.doc.data());
                    }
                });
            }
        });
}

function drawRemoteStroke(data) {
    if (!data.x0) return; // Basic validation

    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.size;
    ctx.beginPath();
    ctx.moveTo(data.x0, data.y0);
    ctx.lineTo(data.x1, data.y1);
    ctx.stroke();
}

// --- Event Listeners ---
function setupEventListeners() {
    // Canvas Mouse Events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Toolbar
    colorPicker.addEventListener('input', (e) => state.color = e.target.value);
    sizeSlider.addEventListener('input', (e) => {
        state.size = e.target.value;
        sizeValue.textContent = `${state.size}px`;
    });

    clearBtn.addEventListener('click', async () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Clear strokes from Firestore if connected
        if (state.db) {
            try {
                const snapshot = await state.db.collection('strokes').get();
                console.log("Found", snapshot.docs.length, "strokes to delete");

                // Firestore batch limit is 500, so we may need multiple batches
                const batchSize = 500;
                const docs = snapshot.docs;

                for (let i = 0; i < docs.length; i += batchSize) {
                    const batch = state.db.batch();
                    const chunk = docs.slice(i, i + batchSize);
                    chunk.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                    console.log("Deleted batch", Math.floor(i / batchSize) + 1);
                }
                console.log("All strokes deleted");
            } catch (err) {
                console.error("Error clearing strokes:", err);
                alert("Error clearing: " + err.message);
            }
        }
    });

    // Config Modal
    configBtn.addEventListener('click', () => configModal.classList.add('active'));
    closeConfigBtn.addEventListener('click', () => configModal.classList.remove('active'));

    saveConfigBtn.addEventListener('click', () => {
        const input = firebaseConfigInput.value.trim();
        try {
            const config = JSON.parse(input);
            connectToFirebase(config);
        } catch (e) {
            alert("Invalid JSON configuration. Please check the format.");
        }
    });
}

// Start App when DOM is ready
document.addEventListener('DOMContentLoaded', init);
