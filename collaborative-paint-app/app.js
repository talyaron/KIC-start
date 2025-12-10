// Collaborative Paint App Logic

// --- State ---
const state = {
    isDrawing: false,
    currentTool: 'brush', // 'brush' or 'eraser'
    color: '#000000',
    size: 5,
    lastX: 0,
    lastY: 0,
    db: null,
    unsubscribe: null,
    myStrokeIds: [], // Stack of document IDs created by this user
    undoneStrokes: [] // Stack of stroke data for redo
};

<<<<<<< Updated upstream
// --- DOM Elements (initialized after DOM loads) ---
let canvas, ctx, wrapper, colorPicker, sizeSlider, sizeValue;
let clearBtn, configBtn, configModal, saveConfigBtn, closeConfigBtn;
let firebaseConfigInput, connectionStatus, statusText;
=======
// --- DOM Elements ---
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvasWrapper');
const colorPicker = document.getElementById('colorPicker');
const sizeSlider = document.getElementById('sizeSlider');
const sizeValue = document.getElementById('sizeValue');
const clearBtn = document.getElementById('clearBtn');
const brushBtn = document.getElementById('brushBtn');
const eraserBtn = document.getElementById('eraserBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const saveConfigBtn = document.getElementById('saveConfigBtn');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const firebaseConfigInput = document.getElementById('firebaseConfigInput');
const connectionStatus = document.getElementById('connectionStatus');
>>>>>>> Stashed changes

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

    // Determine style based on tool
    const strokeColor = state.currentTool === 'eraser' ? '#ffffff' : state.color;
    const strokeSize = state.size;

    // Draw locally
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
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
            color: strokeColor,
            size: strokeSize,
            tool: state.currentTool
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
    } else {
        connectionStatus.classList.remove('connected');
        connectionStatus.classList.add('disconnected');
    }
}

function sendStroke(strokeData) {
    // We add a timestamp to order strokes
    state.db.collection('strokes').add({
        ...strokeData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userId: getUserId() // Helper to track ownership
    }).then(docRef => {
        // Track for Undo
        state.myStrokeIds.push(docRef.id);
        // Clear redo stack on new action
        state.undoneStrokes = [];
    }).catch(err => console.error("Error sending stroke:", err));
}

function startListening() {
    if (state.unsubscribe) state.unsubscribe();

    // Listen for strokes added in the last minute (to avoid loading entire history on refresh for this demo)
    // In a real app, you might want to load history or implement a more robust sync strategy
    const now = new Date();

    state.unsubscribe = state.db.collection('strokes')
        .orderBy('timestamp')
        .limitToLast(1000) // Limit to recent strokes
        .onSnapshot(snapshot => {
<<<<<<< Updated upstream
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
=======
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    // Only draw if it's not our own stroke (optional optimization, but for now we draw everything to ensure sync)
                    // Actually, since we draw locally immediately, we might double draw. 
                    // A simple way to avoid this is to check if the data originated from us, 
                    // but for this simple MVP, double drawing over the exact same pixels is fine and ensures consistency.
                    // To be cleaner, we'll just draw it.
                    drawRemoteStroke(data);
                }
                if (change.type === 'removed') {
                    // Handle Undo (Remote)
                    // Since we can't easily "un-draw" pixels on a raster canvas without clearing,
                    // a full redraw is required for perfect sync.
                    // For this MVP, we will trigger a full redraw from history.
                    redrawCanvasFromSnapshot(snapshot);
                }
            });
>>>>>>> Stashed changes
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

function redrawCanvasFromSnapshot(snapshot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    snapshot.forEach(doc => {
        drawRemoteStroke(doc.data());
    });
}

// --- Undo / Redo Logic ---
function undo() {
    if (state.myStrokeIds.length === 0) return;

    const lastId = state.myStrokeIds.pop();

    // Get the data before deleting (if we want to support Redo)
    // For simplicity in Firestore, we just delete. 
    // To support Redo, we'd need to fetch it first or store it locally.
    // Let's try to fetch locally from our memory if possible, or just delete.
    // Real Redo with Firestore deletion is hard because the data is gone.
    // Strategy: We won't support Redo for *deleted* strokes in this simple version, 
    // OR we implement "soft delete". 
    // Let's stick to simple Undo (Delete) for now as per plan.

    state.db.collection('strokes').doc(lastId).delete()
        .catch(err => console.error("Error undoing:", err));
}

// Helper for user ID (simple session ID)
function getUserId() {
    let id = sessionStorage.getItem('paintApp_userId');
    if (!id) {
        id = 'user_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('paintApp_userId', id);
    }
    return id;
}

// --- Event Listeners ---
function setupEventListeners() {
    // Canvas Mouse Events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Toolbar
    brushBtn.addEventListener('click', () => setTool('brush'));
    eraserBtn.addEventListener('click', () => setTool('eraser'));

    colorPicker.addEventListener('input', (e) => state.color = e.target.value);
    sizeSlider.addEventListener('input', (e) => {
        state.size = e.target.value;
        sizeValue.textContent = `${state.size} px`;
    });

<<<<<<< Updated upstream
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
=======
    undoBtn.addEventListener('click', undo);
    // Redo is disabled for this version as discussed in logic
    redoBtn.addEventListener('click', () => alert("Redo is not available in this version."));

    clearBtn.addEventListener('click', () => {
        if (confirm("Clear your local canvas? This won't affect others.")) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
>>>>>>> Stashed changes
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
            alert("Invalid JSON configuration.");
        }
    });
}

<<<<<<< Updated upstream
// Start App when DOM is ready
document.addEventListener('DOMContentLoaded', init);
=======
function setTool(tool) {
    state.currentTool = tool;
    if (tool === 'brush') {
        brushBtn.classList.add('active');
        eraserBtn.classList.remove('active');
    } else {
        brushBtn.classList.remove('active');
        eraserBtn.classList.add('active');
    }
}

// Start App
init();
>>>>>>> Stashed changes
