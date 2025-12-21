// Main Game Class

import { Player } from './Player.js';
import { Bullet } from './Bullet.js';
import { EnemySpawner } from './spawner.js';
import { CONFIG } from '../config.js';
import { audioManager } from '../audio/audioManager.js';
import { throttle } from '../utils/helpers.js';
import { database } from '../firebase/config.js';
import { updatePlayerPosition, onRoomChange, updateTeamScore, broadcastGameEvent, onGameEvent } from '../firebase/realtime.js';

export class Game {
    constructor(canvas, roomCode, currentUser, roomData, isHost) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.roomCode = roomCode;
        this.currentUser = currentUser;
        this.isHost = isHost;
        this.matchStartTime = roomData.matchStartTime || Date.now();
        this.playerCountAtStart = Object.keys(roomData.players || {}).length;

        // Setup canvas
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Game state
        this.players = new Map();
        this.enemies = [];
        this.bullets = [];
        this.running = false;
        this.gameStartTime = Date.now();

        // Local player
        this.localPlayer = null;

        // Enemy spawner (synchronized via matchSeed)
        if (roomData && roomData.matchSeed) {
            this.spawner = new EnemySpawner(roomData.matchSeed, this.canvas.width);
        } else if (roomCode === 'local') {
            this.spawner = new EnemySpawner(Math.floor(Math.random() * 1000000), this.canvas.width);
        }

        // Initialize players from room data
        this.initializePlayers(roomData);

        // Input handling
        this.keys = {};
        this.setupInput();

        // Network sync (throttled)
        this.syncPosition = throttle(this.syncPositionToServer.bind(this), CONFIG.NETWORK.POSITION_UPDATE_RATE);
        this.syncStats = throttle(this.syncStatsToServer.bind(this), CONFIG.NETWORK.SCORE_UPDATE_RATE);

        // Animation frame ID
        this.animationId = null;

        // Listen for room and game events
        this.setupNetworkListeners();
        this.setupGameEventListeners();
    }

    setupGameEventListeners() {
        if (this.roomCode === 'local') return;

        this.unsubscribeEvents = onGameEvent(this.roomCode, (event) => {
            if (!this.running || event.sender === this.currentUser.uid) return;
            this.handleRemoteEvent(event);
        });
    }

    handleRemoteEvent(event) {
        switch (event.type) {
            case 'SHOT':
                this.handleRemoteShot(event);
                break;
            case 'ENEMY_KILLED':
                this.handleRemoteKill(event);
                break;
        }
    }

    handleRemoteShot(event) {
        // Create bullet for remote player
        const bullet = new Bullet(event.x, event.y, event.sender, event.damage);
        this.bullets.push(bullet);
        audioManager.play('shoot');
    }

    handleRemoteKill(event) {
        // Find and remove enemy by spawnId
        const enemy = this.enemies.find(e => e.spawnId === event.spawnId);
        if (enemy) {
            enemy.destroy();
            audioManager.play('enemyHit');
        }
    }

    setupNetworkListeners() {
        if (this.roomCode === 'local') return;

        this.unsubscribeRoom = onRoomChange(this.roomCode, (roomData) => {
            // Handle game end signal
            if (roomData.status === 'ended' && this.running) {
                console.log('🏁 Game end signal received from server');
                this.stop();
                return;
            }

            // Update other players
            Object.keys(roomData.players || {}).forEach(uid => {
                if (uid !== this.currentUser.uid) {
                    this.updatePlayerFromServer(uid, roomData.players[uid]);
                }
            });

            // Update team score
            this.teamScore = roomData.teamScore || 0;

            // Sync match start time if assigned by host
            if (roomData.matchStartTime) {
                this.matchStartTime = roomData.matchStartTime;
            }
        });
    }

    /**
     * Initialize players from room data
     * @param {Object} roomData - Room data
     */
    initializePlayers(roomData) {
        const playerUids = Object.keys(roomData.players || {});
        const spacing = this.canvas.width / (playerUids.length + 1);

        playerUids.forEach((uid, index) => {
            const playerData = roomData.players[uid];
            const x = spacing * (index + 1) - CONFIG.PLAYER.WIDTH / 2;
            const y = this.canvas.height - CONFIG.PLAYER.HEIGHT - 100;

            const player = new Player(uid, x, y);
            player.hp = playerData.hp || CONFIG.PLAYER.BASE_HP;
            player.score = playerData.score || 0;

            this.players.set(uid, player);

            if (uid === this.currentUser.uid) {
                this.localPlayer = player;

                // Apply upgrades to local player
                if (this.currentUser.upgrades) {
                    player.applyUpgrades(this.currentUser.upgrades);
                }
            }
        });
    }

    /**
     * Setup input handlers
     */
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (!this.localPlayer) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.localPlayer.inputs.left = true;
                    break;
                case 'ArrowRight':
                    this.localPlayer.inputs.right = true;
                    break;
                case 'ArrowUp':
                    this.localPlayer.inputs.jump = true;
                    break;
                case ' ':
                    this.localPlayer.inputs.shoot = true;
                    e.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;

            if (!this.localPlayer) return;

            switch (e.key) {
                case 'ArrowLeft':
                    this.localPlayer.inputs.left = false;
                    break;
                case 'ArrowRight':
                    this.localPlayer.inputs.right = false;
                    break;
                case 'ArrowUp':
                    this.localPlayer.inputs.jump = false;
                    break;
                case ' ':
                    this.localPlayer.inputs.shoot = false;
                    break;
            }
        });
    }

    /**
     * Start game loop
     */
    start() {
        this.running = true;
        this.gameLoop();
    }

    /**
     * Stop game
     */
    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.unsubscribeRoom) {
            this.unsubscribeRoom();
            this.unsubscribeRoom = null;
        }
        if (this.unsubscribeEvents) {
            this.unsubscribeEvents();
            this.unsubscribeEvents = null;
        }

        // Final sync of stats
        this.syncStatsToServer();
    }

    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.running) return;

        const currentTime = Date.now();

        // Update
        this.update(currentTime);

        // Render
        this.render();

        // Continue loop
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * Update game state
     * @param {number} currentTime - Current timestamp
     */
    update(currentTime) {
        // Update local player
        if (this.localPlayer) {
            this.localPlayer.update(this.canvas.width, this.canvas.height);

            // Handle shooting
            if (this.localPlayer.inputs.shoot && this.localPlayer.canShoot(currentTime)) {
                this.shoot(this.localPlayer, currentTime);
            }

            // Sync position and stats to server
            this.syncPosition();
            this.syncStats();
        }

        // NOTE: Remote players skip local physics (gravity/jumping) to prevent jitter.
        // They are updated via setupNetworkListeners -> updatePlayerFromServer.

        // Spawn enemies (Deterministic for all players via matchSeed)
        if (this.spawner) {
            this.spawner.spawn(this.enemies, currentTime, this.playerCountAtStart, this.matchStartTime);
        }

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update();

            // Check if enemy hit bottom
            if (enemy.isOffScreen(this.canvas.height)) {
                enemy.destroy();
                // Penalty: team loses points (host handles this)
                if (this.isHost) {
                    this.handleEnemyReachedBottom(enemy);
                }
            }
        }

        // Update bullets
        for (const bullet of this.bullets) {
            bullet.update();

            if (bullet.isOffScreen()) {
                bullet.destroy();
            }
        }

        // Check collisions
        this.checkCollisions();

        // Clean up destroyed entities
        this.enemies = this.enemies.filter(e => e.active);
        this.bullets = this.bullets.filter(b => b.active);
    }

    /**
     * Shoot bullet
     * @param {Player} player - Player shooting
     * @param {number} currentTime - Current timestamp
     */
    shoot(player, currentTime, isRemote = false) {
        const bulletX = player.x + player.width / 2 - CONFIG.BULLET.WIDTH / 2;
        const bulletY = player.y;

        const bullet = new Bullet(bulletX, bulletY, player.uid, player.damage);
        this.bullets.push(bullet);

        player.shoot(currentTime);
        audioManager.play('shoot');

        // Broadcast shot to other players
        if (!isRemote && this.roomCode !== 'local') {
            broadcastGameEvent(this.roomCode, {
                type: 'SHOT',
                x: bulletX,
                y: bulletY,
                damage: player.damage,
                sender: this.currentUser.uid
            });
        }
    }

    /**
     * Check all collisions
     */
    checkCollisions() {
        // Bullet-Enemy collisions
        for (const bullet of this.bullets) {
            if (!bullet.active) continue;

            for (const enemy of this.enemies) {
                if (!enemy.active) continue;

                if (bullet.collidesWith(enemy.x, enemy.y, enemy.width, enemy.height)) {
                    // Hit!
                    bullet.destroy();
                    enemy.destroy();
                    audioManager.play('enemyHit');

                    // Award score to bullet owner
                    const owner = this.players.get(bullet.ownerId);
                    if (owner) {
                        owner.addKill(enemy.type, enemy.score);

                        // If I killed it, tell everyone else to remove it too
                        if (bullet.ownerId === this.currentUser.uid && this.roomCode !== 'local') {
                            broadcastGameEvent(this.roomCode, {
                                type: 'ENEMY_KILLED',
                                spawnId: enemy.spawnId,
                                sender: this.currentUser.uid
                            });
                        }
                    }

                    break;
                }
            }
        }

        // Enemy-Player collisions
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;

            for (const player of this.players.values()) {
                if (enemy.collidesWith(player.x, player.y, player.width, player.height)) {
                    enemy.destroy();
                    player.takeDamage(enemy.damage);
                    audioManager.play('playerHit');

                    // HP sync is now handled by throttled syncStats()
                    break;
                }
            }
        }
    }

    /**
     * Handle enemy reaching bottom (host only)
     * @param {Enemy} enemy - Enemy that reached bottom
     */
    handleEnemyReachedBottom(enemy) {
        if (this.roomCode !== 'local') {
            updateTeamScore(this.roomCode, CONFIG.SCORING.ENEMY_BOTTOM_PENALTY);
        }
        console.log('Enemy reached bottom, team penalty:', CONFIG.SCORING.ENEMY_BOTTOM_PENALTY);
    }

    /**
     * Sync local player position to server
     */
    syncPositionToServer() {
        if (!this.localPlayer || this.roomCode === 'local') return;
        updatePlayerPosition(this.roomCode, this.currentUser.uid, {
            x: this.localPlayer.x,
            y: this.localPlayer.y
        });
    }

    /**
     * Batch sync for stats (score, kills, hp, damageTaken)
     */
    syncStatsToServer() {
        if (!this.localPlayer || this.roomCode === 'local') return;

        // Use a generic update for the entire player object in the room
        // to minimize individual update calls
        const updates = {
            score: this.localPlayer.score,
            hp: Math.max(0, Math.ceil(this.localPlayer.hp)),
            kills: { ...this.localPlayer.kills },
            damageTaken: this.localPlayer.damageTaken
        };

        // We use the base database ref to do a single update
        database.ref(`rooms/${this.roomCode}/players/${this.currentUser.uid}`).update(updates);
    }

    /**
     * Render game
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.color || '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render ground line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height - 50);
        this.ctx.lineTo(this.canvas.width, this.canvas.height - 50);
        this.ctx.stroke();

        // Render enemies
        for (const enemy of this.enemies) {
            enemy.render(this.ctx);
        }

        // Render bullets
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }

        // Render players
        for (const player of this.players.values()) {
            player.render(this.ctx);
        }
    }

    /**
     * Update player data from server
     * @param {string} uid - Player UID
     * @param {Object} data - Player data
     */
    updatePlayerFromServer(uid, data) {
        let player = this.players.get(uid);

        // Dynamically add player if they join late or were missed at start
        if (!player) {
            console.log(`👤 Adding new player found in room: ${uid}`);
            // Use provided coordinates or default to middle ground
            const x = data.x !== undefined ? data.x : this.canvas.width / 2;
            const y = data.y !== undefined ? data.y : this.canvas.height - 150;
            player = new Player(uid, x, y);
            this.players.set(uid, player);
        }

        if (player === this.localPlayer) return;

        // Update position smoothly
        if (data.x !== undefined) player.x = data.x;
        if (data.y !== undefined) player.y = data.y;

        // Update stats
        if (data.hp !== undefined) player.hp = data.hp;
        if (data.score !== undefined) player.score = data.score;

        // Update kills
        if (data.kills) {
            player.kills = { ...data.kills };
        }
    }
}
