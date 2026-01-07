// Multiplayer Logic

const lobbyElements = {
    screen: document.getElementById('lobby-screen'),
    createBtn: document.getElementById('create-room-btn'),
    joinBtn: document.getElementById('join-room-btn'),
    roomInput: document.getElementById('room-code-input'),
    initialView: document.getElementById('lobby-initial'),
    waitingView: document.getElementById('lobby-waiting'),
    roomCodeDisplay: document.getElementById('display-room-code')
};

const mpElements = {
    opponentBar: document.getElementById('opponent-bar'),
    oppScore: document.getElementById('opp-score'),
    oppProgressFill: document.getElementById('opp-progress-fill'),
    resultMsg: document.getElementById('mp-result-msg')
};

let myPlayerId = 'p_' + Math.floor(Math.random() * 100000);
let roomCode = null;
let isHost = false;
let gameRef = null;
let opponentId = null;
let isMultiplayer = false;

// Event Listeners for Menu
document.getElementById('multi-player-btn').addEventListener('click', () => {
    isMultiplayer = true;
    showScreen('lobby');
});

document.getElementById('single-player-btn').addEventListener('click', () => {
    isMultiplayer = false;
    showScreen('start'); // Go to normal start screen
});

lobbyElements.createBtn.addEventListener('click', createRoom);
lobbyElements.joinBtn.addEventListener('click', joinRoom);

// Handle "Back" buttons in lobby
document.querySelectorAll('[data-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        if (target) showScreen(target);
        if (target === 'mode') cleanupMultiplayer();
    });
});


function createRoom() {
    roomCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    isHost = true;

    // Create room in Firebase
    gameRef = db.ref('games/' + roomCode);
    gameRef.set({
        host: myPlayerId,
        status: 'waiting',
        created: Date.now()
    });

    showLobbyWaiting();
    listenForPlayers();
}

function joinRoom() {
    const code = lobbyElements.roomInput.value.trim();
    if (code.length !== 6) {
        alert("Please enter a valid 6-digit code");
        return;
    }

    roomCode = code;
    isHost = false;
    gameRef = db.ref('games/' + roomCode);

    // Check if room exists
    gameRef.get().then((snapshot) => {
        if (snapshot.exists() && snapshot.val().status === 'waiting') {
            gameRef.update({
                guest: myPlayerId,
                status: 'ready' // Signal ready
            });
            showLobbyWaiting(); // Show waiting for start
            listenForGameStart();
        } else {
            alert("Room not found or game already started.");
        }
    });
}

function showLobbyWaiting() {
    lobbyElements.initialView.classList.add('hidden');
    lobbyElements.waitingView.classList.remove('hidden');
    lobbyElements.roomCodeDisplay.textContent = roomCode;
}

function listenForPlayers() {
    // Only host listens for guest
    gameRef.child('guest').on('value', (snapshot) => {
        if (snapshot.exists()) {
            opponentId = snapshot.val();
            startGameMultiplayer();
        }
    });
}

function listenForGameStart() {
    // Guest listens for status change to 'playing'
    gameRef.child('status').on('value', (snapshot) => {
        if (snapshot.val() === 'playing') {
            startGameMultiplayer();
        }
    });
}

function startGameMultiplayer() {
    if (isHost) {
        gameRef.update({ status: 'playing' });
    }

    // Initialize common game state via main script
    // We need to override some behaviors in script.js or hook into them

    // Show game screen
    showScreen('game'); // Correct key
    mpElements.opponentBar.classList.remove('hidden');

    // Start the actual game logic (exposed from script.js)
    startActualGame();

    // Set up real-time syncing
    startSyncing();
}

function startSyncing() {
    // 1. Listen for opponent updates
    const opponentRole = isHost ? 'guest' : 'host';
    const myRole = isHost ? 'host' : 'guest';

    // Listen to opponent's state
    gameRef.child(opponentRole + '_state').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateOpponentUI(data);
            if (data.finished) {
                checkWinCondition(data);
            }
        }
    });

    // 2. Push my updates (hook into main game loop)
    // We will do this by polling or intercepting `processAnswer`
    // Let's create a global function that script.js calls
    window.onGameStateUpdate = (state) => {
        if (!isMultiplayer) return;

        gameRef.child(myRole + '_state').set({
            score: state.score,
            progress: state.currentQuestionIndex,
            finished: state.finished || false
        });
    };
}

function updateOpponentUI(data) {
    mpElements.oppScore.textContent = data.score;
    const pct = (data.progress / 20) * 100; // Hardcoded 20 questions for now
    mpElements.oppProgressFill.style.width = `${pct}%`;
}

function checkWinCondition(opponentData) {
    // If opponent finished, and I haven't, they might have won if they have high score?
    // Usually we wait for both. 
    // Simply showing "Opponent Finished" is good enough for MVP.
}

function cleanupMultiplayer() {
    if (gameRef) gameRef.off();
    isMultiplayer = false;
    lobbyElements.initialView.classList.remove('hidden');
    lobbyElements.waitingView.classList.add('hidden');
    lobbyElements.roomInput.value = '';
    mpElements.opponentBar.classList.add('hidden');
}

// Global hooks called by script.js
window.isMultiplayerMode = () => isMultiplayer;
