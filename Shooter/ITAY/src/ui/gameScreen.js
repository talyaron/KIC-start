// Simplified Game Screen - Local Play

import { Game } from '../game/Game.js';
import { getUserProfile, updateGameStats } from '../firebase/firestore.js';

export class GameScreen {
    constructor(onGameEnd) {
        this.onGameEnd = onGameEnd;
        this.screenEl = document.getElementById('game-screen');
        this.canvas = document.getElementById('game-canvas');
        this.uiEl = document.getElementById('game-ui');
        this.currentGame = null;
        this.gameStartTime = 0;
        this.updateInterval = null;
    }

    async startGame(roomCode, roomData, currentUser, isHost) {
        console.log('🎮 Game starting...', { roomCode, isHost });

        // Load user profile with upgrades
        const profile = await getUserProfile(currentUser.uid);

        // Create game instance
        this.currentGame = new Game(this.canvas, roomCode, profile, roomData, isHost);

        // Setup UI
        this.setupGameUI(roomData);

        // Start game
        this.gameStartTime = Date.now();
        this.currentGame.start();

        // Start UI update loop
        this.updateInterval = setInterval(() => this.updateGameUI(), 100);

        // Check for game over
        this.checkGameOverInterval = setInterval(() => this.checkGameOver(), 1000);
    }

    setupGameUI(roomData) {
        this.uiEl.innerHTML = `
      <div class="game-hud">
        <div class="score-display">
          <div class="score-label">Your Score</div>
          <div class="score-value" id="player-score">0</div>
          <div class="team-score">Survival: <span id="survival-time">0:00</span></div>
        </div>
        
        <div class="players-list">
          <div class="player-hud-item">
            <span class="player-hud-name">Health</span>
            <span class="player-hud-hp" id="player-hp">100</span>
          </div>
          <div class="player-hud-item">
            <span class="player-hud-name">Kills</span>
            <span class="player-hud-hp" id="player-kills" style="color: var(--color-success);">0</span>
          </div>
        </div>
      </div>
    `;
    }

    updateGameUI() {
        if (!this.currentGame || !this.currentGame.localPlayer) return;

        const player = this.currentGame.localPlayer;

        // Update score
        const scoreEl = document.getElementById('player-score');
        if (scoreEl) scoreEl.textContent = player.score;

        // Update HP
        const hpEl = document.getElementById('player-hp');
        if (hpEl) {
            hpEl.textContent = Math.ceil(player.hp);
            hpEl.className = 'player-hud-hp';
            if (player.hp < 30) hpEl.classList.add('critical');
            else if (player.hp < 60) hpEl.classList.add('low');
        }

        // Update kills
        const killsEl = document.getElementById('player-kills');
        if (killsEl) {
            const totalKills = player.kills.red + player.kills.yellow + player.kills.blue;
            killsEl.textContent = totalKills;
        }

        // Update survival time
        const timeEl = document.getElementById('survival-time');
        if (timeEl) {
            const seconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    checkGameOver() {
        if (!this.currentGame || !this.currentGame.localPlayer) return;

        const player = this.currentGame.localPlayer;

        if (player.isDead()) {
            this.endGame();
        }
    }

    async endGame() {
        if (!this.currentGame) return;

        // Stop game
        this.currentGame.stop();

        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        if (this.checkGameOverInterval) {
            clearInterval(this.checkGameOverInterval);
            this.checkGameOverInterval = null;
        }

        // Calculate survival time
        const survivalTime = Math.floor((Date.now() - this.gameStartTime) / 1000);

        // Get player stats
        const player = this.currentGame.localPlayer;
        const totalKills = player.kills.red + player.kills.yellow + player.kills.blue;

        // Save stats to Firebase
        await updateGameStats(this.currentGame.currentUser.uid, {
            totalKills: totalKills,
            redKills: player.kills.red,
            yellowKills: player.kills.yellow,
            blueKills: player.kills.blue,
            score: player.score,
            survivalTime: survivalTime,
            currencyEarned: Math.floor(player.score / 10) // 10% of score as currency
        });

        // Prepare stats for end screen
        const stats = {};
        stats[this.currentGame.currentUser.uid] = {
            displayName: player.displayName || 'Player',
            score: player.score,
            kills: player.kills,
            damageTaken: player.damageTaken,
            survivalTime: survivalTime
        };

        // Show end screen
        this.onGameEnd(stats);
    }

    stopGame() {
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.checkGameOverInterval) {
            clearInterval(this.checkGameOverInterval);
            this.checkGameOverInterval = null;
        }
    }

    show() {
        this.screenEl.classList.add('active');
    }

    hide() {
        this.screenEl.classList.remove('active');
        this.stopGame();
    }
}
