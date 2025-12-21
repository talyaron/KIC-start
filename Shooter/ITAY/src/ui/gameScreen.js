// Premium Game HUD implementation

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
            <div class="premium-hud">
                <div class="hud-top">
                    <div class="hud-score-card">
                        <div class="hud-label">SCORE</div>
                        <div class="hud-value main" id="player-score">0</div>
                    </div>
                    <div class="hud-timer-card">
                        <div class="hud-label">SURVIVAl</div>
                        <div class="hud-value" id="survival-time">0:00</div>
                    </div>
                    <div class="hud-kills-card">
                        <div class="hud-label">KILLS</div>
                        <div class="hud-value success" id="player-kills">0</div>
                    </div>
                </div>
                
                <div class="hud-bottom">
                    <div class="health-container">
                        <div class="hp-header">
                            <span class="hp-label">HEALTH</span>
                            <span class="hp-count" id="player-hp">100</span>
                        </div>
                        <div class="hp-bar-outer">
                            <div class="hp-bar-inner" id="hp-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    updateGameUI() {
        if (!this.currentGame || !this.currentGame.localPlayer) return;

        const player = this.currentGame.localPlayer;
        const maxHp = player.maxHp || 100;

        // Update score
        const scoreEl = document.getElementById('player-score');
        if (scoreEl) scoreEl.textContent = player.score;

        // Update HP
        const hpCountEl = document.getElementById('player-hp');
        const hpFillEl = document.getElementById('hp-fill');
        if (hpCountEl && hpFillEl) {
            const currentHp = Math.max(0, Math.ceil(player.hp));
            hpCountEl.textContent = currentHp;
            const percent = (currentHp / maxHp) * 100;
            hpFillEl.style.width = `${percent}%`;

            if (percent < 30) hpFillEl.style.background = 'var(--color-error)';
            else if (percent < 60) hpFillEl.style.background = 'var(--color-warning)';
            else hpFillEl.style.background = 'var(--color-success)';
        }

        // Update kills
        const killsEl = document.getElementById('player-kills');
        if (killsEl) {
            const totalKills = (player.kills.small || 0) + (player.kills.medium || 0) + (player.kills.large || 0);
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

        // End game if player is dead OR if the game loop was stopped (e.g. by server signal)
        if (this.currentGame.localPlayer.isDead() || !this.currentGame.running) {
            this.endGame();
        }
    }

    async endGame() {
        if (!this.currentGame) return;

        this.currentGame.stop();

        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.checkGameOverInterval) clearInterval(this.checkGameOverInterval);

        const survivalTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const player = this.currentGame.localPlayer;
        const totalKills = (player.kills.small || 0) + (player.kills.medium || 0) + (player.kills.large || 0);

        await updateGameStats(this.currentGame.currentUser.uid, {
            totalKills: totalKills,
            smallKills: player.kills.small,
            mediumKills: player.kills.medium,
            largeKills: player.kills.large,
            score: player.score,
            survivalTime: survivalTime,
            currencyEarned: Math.floor(player.score / 10)
        });

        const stats = {};
        for (const [uid, p] of this.currentGame.players.entries()) {
            stats[uid] = {
                displayName: p.displayName || 'Player',
                score: p.score,
                kills: p.kills,
                damageTaken: p.damageTaken,
                survivalTime: uid === this.currentGame.currentUser.uid ? survivalTime : 0 // Only local knows its survival time correctly for now
            };
        }

        this.onGameEnd(stats);
    }

    stopGame() {
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.checkGameOverInterval) clearInterval(this.checkGameOverInterval);
    }

    show() {
        this.screenEl.classList.add('active');
    }

    hide() {
        this.screenEl.classList.remove('active');
        this.stopGame();
    }
}
