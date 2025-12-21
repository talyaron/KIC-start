// Enhanced Lobby Screen with Multiplayer Support

import { createRoom, joinRoom, onRoomChange, setPlayerReady, startGameCountdown, updateCountdown, updateLobbyCountdown, leaveRoom, isHost } from '../firebase/realtime.js';
import { getUserProfile } from '../firebase/firestore.js';
import { showToast, copyToClipboard } from '../utils/helpers.js';
import { validateRoomCode } from '../utils/validators.js';
import { audioManager } from '../audio/audioManager.js';
import { CONFIG } from '../config.js';

export class LobbyScreen {
    constructor(onNavigate, onStartGame) {
        this.onNavigate = onNavigate;
        this.onStartGame = onStartGame;
        this.screenEl = document.getElementById('lobby-screen');
        this.currentUser = null;
        this.currentRoomCode = null;
        this.isHost = false;
        this.isReady = false;
        this.unsubscribeRoom = null;
        this.mode = 'menu'; // menu, lobby, countdown

        this.render();
    }

    render() {
        this.screenEl.innerHTML = `
      <div class="lobby-container">
        <button id="back-to-home-btn" class="icon-btn" style="position: absolute; top: 1.5rem; left: 1.5rem; z-index: 100; width: 50px; height: 50px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </button>
        
        <!-- Menu Screen -->
        <div id="lobby-menu" class="lobby-menu">
          <h2 style="font-size: 3rem; margin-bottom: 3rem; text-align: center; background: var(--gradient-primary); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
            Choose Game Mode
          </h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 900px; margin: 0 auto;">
            <!-- Solo Play -->
            <button id="solo-mode-btn" class="mode-card">
              <div class="mode-icon">🎮</div>
              <div class="mode-title">Solo Play</div>
              <div class="mode-desc">Play alone, practice your skills</div>
            </button>
            
            <!-- Multiplayer -->
            <button id="multi-mode-btn" class="mode-card">
              <div class="mode-icon">👥</div>
              <div class="mode-title">Play with Friends</div>
              <div class="mode-desc">Create or join a room</div>
            </button>
          </div>
        </div>
        
        <!-- Multiplayer Lobby Screen -->
        <div id="lobby-multiplayer" class="lobby-multiplayer" style="display:none;">
          <!-- Room Code Display -->
          <div class="room-code-display" id="room-code-section" style="display:none;">
            <div class="room-info-header">
              <div class="lobby-timer" id="lobby-timer-disp">Waiting for friends: 30s</div>
            </div>
            <div class="room-code-label">ROOM CODE</div>
            <div class="room-code-value" id="room-code-value">------</div>
            <div class="copy-hint">Click to copy • Share with friends</div>
          </div>
          
          <!-- Join Section -->
          <div class="join-by-id-section" id="join-section">
            <h2>Join or Create Room</h2>
            <div class="join-input-group">
              <input type="text" id="room-code-input" placeholder="Enter 6-digit code" maxlength="6">
              <button id="join-btn">Join Room</button>
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
              <div style="color: var(--color-text-muted); margin-bottom: 1rem;">— OR —</div>
              <button id="create-room-btn" class="menu-btn primary-action">Create New Room</button>
            </div>
          </div>
          
          <!-- Lobby Area -->
          <div id="lobby-area" style="display:none;">
            <div class="player-slots" id="player-slots"></div>
            
            <div class="lobby-controls">
              <button id="ready-btn" class="ready-btn">Ready</button>
              <button id="start-btn" class="start-btn" style="display:none;">Start Game</button>
              <button id="leave-btn" class="leave-btn">Leave Room</button>
            </div>
          </div>
        </div>
      </div>
    `;

        this.lobbyCountdown = 30;
        this.lobbyTimerInterval = null;
        this.setupListeners();
    }

    setupListeners() {
        const backBtn = document.getElementById('back-to-home-btn');
        const soloBtn = document.getElementById('solo-mode-btn');
        const multiBtn = document.getElementById('multi-mode-btn');

        if (backBtn) backBtn.addEventListener('click', () => this.handleBack());
        if (soloBtn) soloBtn.addEventListener('click', () => this.handleSoloMode());
        if (multiBtn) multiBtn.addEventListener('click', () => this.handleMultiMode());

        // Multiplayer listeners
        const joinBtn = document.getElementById('join-btn');
        const createBtn = document.getElementById('create-room-btn');
        const readyBtn = document.getElementById('ready-btn');
        const startBtn = document.getElementById('start-btn');
        const leaveBtn = document.getElementById('leave-btn');
        const roomCodeValue = document.getElementById('room-code-value');

        if (joinBtn) joinBtn.addEventListener('click', () => this.handleJoinRoom());
        if (createBtn) createBtn.addEventListener('click', () => this.handleCreateRoom());
        if (readyBtn) readyBtn.addEventListener('click', () => this.toggleReady());
        if (startBtn) startBtn.addEventListener('click', () => this.handleStartGame());
        if (leaveBtn) leaveBtn.addEventListener('click', () => this.handleLeaveRoom());
        if (roomCodeValue) {
            roomCodeValue.addEventListener('click', () => {
                copyToClipboard(this.currentRoomCode);
            });
        }
    }

    handleBack() {
        if (this.mode === 'lobby') {
            this.handleLeaveRoom();
        } else if (this.mode === 'menu') {
            this.onNavigate('home');
        } else {
            this.showMenu();
        }
    }

    async handleSoloMode() {
        showToast('Starting solo game...', 'success');
        await this.playCountdown();

        const localGameData = {
            matchSeed: Math.floor(Math.random() * 1000000),
            players: {
                [this.currentUser.uid]: {
                    userCode: this.currentUser.userCode,
                    displayName: this.currentUser.displayName,
                    ready: true,
                    hp: 100,
                    score: 0,
                    x: 0,
                    y: 0,
                    color: '#8338ec',
                    kills: { red: 0, yellow: 0, blue: 0 },
                    damageTaken: 0,
                    survivalTime: 0
                }
            }
        };

        this.onStartGame('local', localGameData, this.currentUser.uid, true);
    }

    handleMultiMode() {
        this.setMode('multiplayer');
    }

    setMode(mode) {
        this.mode = mode;
        if (mode === 'multiplayer') {
            document.getElementById('lobby-menu').style.display = 'none';
            document.getElementById('lobby-multiplayer').style.display = 'block';
            document.getElementById('join-section').style.display = 'block';
            document.getElementById('room-code-section').style.display = 'none';
            document.getElementById('lobby-area').style.display = 'none';
        } else if (mode === 'menu') {
            document.getElementById('lobby-menu').style.display = 'block';
            document.getElementById('lobby-multiplayer').style.display = 'none';
        }
    }

    showMenu() {
        this.setMode('menu');
    }

    async setUser(user) {
        this.currentUser = await getUserProfile(user.uid);
    }

    async handleCreateRoom() {
        try {
            console.log('🏗️ Creating room for:', this.currentUser?.uid);
            showToast('Creating room...', 'info');

            const roomCode = await createRoom(this.currentUser);
            console.log('✅ Room created:', roomCode);

            this.currentRoomCode = roomCode;
            this.isHost = true;

            showToast('Room created! Friends can join with your ID!', 'success');
            this.showLobby();
            this.listenToRoom();
        } catch (error) {
            console.error('❌ [UI] Create room error:', error);
            // The error.message now contains specific networking advice if it was a timeout
            showToast(error.message || 'Failed to create room. Check your internet!', 'error');
        }
    }

    async handleJoinRoom() {
        const input = document.getElementById('room-code-input');
        const roomCode = input.value.trim();

        if (!validateRoomCode(roomCode)) {
            showToast('Please enter a valid 6-digit code', 'error');
            return;
        }

        try {
            showToast('Joining room...', 'info');
            await joinRoom(roomCode, this.currentUser);
            this.currentRoomCode = roomCode;
            this.isHost = false;

            showToast('Joined room successfully!', 'success');
            this.showLobby();
            this.listenToRoom();
        } catch (error) {
            console.error('Join room error:', error);
            showToast(error.message || 'Failed to join room', 'error');
        }
    }

    showLobby() {
        this.mode = 'lobby';
        document.getElementById('join-section').style.display = 'none';
        document.getElementById('room-code-section').style.display = 'block';
        document.getElementById('lobby-area').style.display = 'block';
        document.getElementById('room-code-value').textContent = this.currentRoomCode;
    }

    listenToRoom() {
        this.unsubscribeRoom = onRoomChange(this.currentRoomCode, (roomData) => {
            if (!roomData) {
                showToast('Room closed or deleted', 'warning');
                this.handleLeaveRoom();
                return;
            }

            this.updateLobbyUI(roomData);
            this.handleLobbyCountdownSync(roomData);

            if (roomData.status === 'countdown') {
                this.handleCountdown(roomData.countdown);
            } else if (roomData.status === 'playing') {
                this.startGame(roomData);
            }
        });
    }

    handleLobbyCountdownSync(roomData) {
        if (roomData.status !== 'lobby') {
            if (this.lobbyTimerInterval) {
                clearInterval(this.lobbyTimerInterval);
                this.lobbyTimerInterval = null;
            }
            return;
        }

        const timerDisp = document.getElementById('lobby-timer-disp');
        if (timerDisp) {
            timerDisp.textContent = `Waiting for friends: ${roomData.lobbyCountdown}s`;
        }

        // Host manages the timer
        if (this.isHost && !this.lobbyTimerInterval && roomData.lobbyCountdown > 0) {
            this.startLobbyTimer(roomData.lobbyCountdown);
        }
    }

    startLobbyTimer(initialValue) {
        this.lobbyCountdown = initialValue;
        if (this.lobbyTimerInterval) clearInterval(this.lobbyTimerInterval);

        this.lobbyTimerInterval = setInterval(async () => {
            if (!this.currentRoomCode || !this.isHost) {
                clearInterval(this.lobbyTimerInterval);
                return;
            }

            this.lobbyCountdown--;
            if (this.lobbyCountdown <= 0) {
                clearInterval(this.lobbyTimerInterval);
                await this.handleStartGame(); // Automatic start
            } else {
                await updateLobbyCountdown(this.currentRoomCode, this.lobbyCountdown);
            }
        }, 1000);
    }

    updateLobbyUI(roomData) {
        const slotsEl = document.getElementById('player-slots');
        const players = roomData.players || {};
        const playerUids = Object.keys(players);

        const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5'];

        slotsEl.innerHTML = '';

        for (let i = 0; i < CONFIG.NETWORK.MAX_PLAYERS; i++) {
            const slot = document.createElement('div');
            slot.className = 'player-slot';

            if (i < playerUids.length) {
                const uid = playerUids[i];
                const player = players[uid];
                const isHost = roomData.hostUid === uid;

                slot.classList.add('occupied');
                if (player.ready) slot.classList.add('ready');

                slot.style.borderColor = colors[i];

                slot.innerHTML = `
          <div class="player-avatar" style="background: ${colors[i]}">
            ${player.displayName?.charAt(0) || 'P'}
          </div>
          <div class="player-info">
            <div class="player-name">
              ${player.displayName}
              ${isHost ? '<span class="host-badge">HOST</span>' : ''}
            </div>
            <div class="player-code">#${player.userCode}</div>
            ${player.ready
                        ? '<div class="ready-badge">✓ READY</div>'
                        : '<div class="waiting-badge">WAITING</div>'}
          </div>
        `;
            } else {
                slot.classList.add('empty');
                slot.innerHTML = `
          <div class="empty-slot-icon">+</div>
          <div class="empty-slot-text">Waiting for player...</div>
        `;
            }

            slotsEl.appendChild(slot);
        }

        this.updateControls(roomData);
    }

    updateControls(roomData) {
        const readyBtn = document.getElementById('ready-btn');
        const startBtn = document.getElementById('start-btn');

        // Safety check for undefined players
        if (!roomData.players) return;

        const myPlayer = roomData.players[this.currentUser.uid];
        if (myPlayer) {
            this.isReady = myPlayer.ready;
            readyBtn.textContent = this.isReady ? '✓ Ready' : 'Ready Up';
            readyBtn.classList.toggle('is-ready', this.isReady);
        }

        const isRoomHost = roomData.hostUid === this.currentUser.uid;
        if (isRoomHost) {
            startBtn.style.display = 'block';
            const playerCount = Object.keys(roomData.players).length;
            const allReady = Object.values(roomData.players).every(p => p.ready);
            startBtn.disabled = playerCount === 0 || !allReady;
            startBtn.textContent = allReady ? '🚀 START GAME' : 'Waiting for players...';
        } else {
            startBtn.style.display = 'none';
        }
    }

    async toggleReady() {
        this.isReady = !this.isReady;
        await setPlayerReady(this.currentRoomCode, this.currentUser.uid, this.isReady);
    }

    async handleStartGame() {
        try {
            const host = await isHost(this.currentRoomCode, this.currentUser.uid);
            if (!host) {
                showToast('Only the host can start the game', 'error');
                return;
            }

            await startGameCountdown(this.currentRoomCode);
        } catch (error) {
            console.error('Start game error:', error);
            showToast('Failed to start game', 'error');
        }
    }

    async handleCountdown(count) {
        if (count > 0) {
            audioManager.play('countdown');

            if (this.isHost) {
                setTimeout(async () => {
                    await updateCountdown(this.currentRoomCode, count - 1);
                }, CONFIG.COUNTDOWN.INTERVAL);
            }
        } else {
            audioManager.play('go');
        }
    }

    async playCountdown() {
        const overlay = document.createElement('div');
        overlay.className = 'countdown-overlay';
        overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.95); display: flex;
      align-items: center; justify-content: center; z-index: 10000;
    `;

        const countdownNum = document.createElement('div');
        countdownNum.style.cssText = `
      font-size: 15rem; font-weight: 900;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: countdownPulse 1s ease;
    `;

        overlay.appendChild(countdownNum);
        document.body.appendChild(overlay);

        for (let i = 3; i > 0; i--) {
            countdownNum.textContent = i;
            audioManager.play('countdown');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        countdownNum.textContent = 'GO!';
        countdownNum.style.fontSize = '10rem';
        audioManager.play('go');

        await new Promise(resolve => setTimeout(resolve, 500));
        overlay.remove();
    }

    startGame(roomData) {
        if (this.unsubscribeRoom) {
            this.unsubscribeRoom();
            this.unsubscribeRoom = null;
        }

        this.onStartGame(this.currentRoomCode, roomData, this.currentUser.uid, this.isHost);
    }

    async handleLeaveRoom() {
        if (this.currentRoomCode) {
            try {
                await leaveRoom(this.currentRoomCode, this.currentUser.uid);
            } catch (error) {
                console.error('Leave room error:', error);
            }
        }

        if (this.unsubscribeRoom) {
            this.unsubscribeRoom();
            this.unsubscribeRoom = null;
        }

        this.currentRoomCode = null;
        this.isHost = false;
        this.isReady = false;

        this.showMenu();
    }

    show() {
        this.screenEl.classList.add('active');
        // If mode was not explicitly set (e.g. from nav), default to menu
        if (this.mode === 'menu') {
            this.showMenu();
        }
    }

    hide() {
        this.screenEl.classList.remove('active');

        if (this.unsubscribeRoom) {
            this.unsubscribeRoom();
            this.unsubscribeRoom = null;
        }
    }
}
