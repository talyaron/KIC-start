// Main Game Class

import { Player } from './Player.js';
import { Bullet } from './Bullet.js';
import { EnemySpawner } from './spawner.js';
import { CONFIG } from '../config.js';
import { audioManager } from '../audio/audioManager.js';
import { throttle } from '../utils/helpers.js';

export class Game {
    constructor(canvas, roomCode, currentUser, roomData, isHost) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.roomCode = roomCode;
        this.currentUser = currentUser;
        this.isHost = isHost;

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

        // Enemy spawner (host only)
        if (isHost && roomData.matchSeed) {
            this.spawner = new EnemySpawner(roomData.matchSeed, this.canvas.width);
        }

        // Initialize players from room data
        this.initializePlayers(roomData);

        // Input handling
        this.keys = {};
        this.setupInput();

        // Network sync (throttled)
        this.syncPosition = throttle(this.syncPositionToServer.bind(this), CONFIG.NETWORK.POSITION_UPDATE_RATE);

        // Animation frame ID
        this.animationId = null;
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

            // Sync position to server
            this.syncPosition();
        }

        // Update all players
        for (const player of this.players.values()) {
            if (player !== this.localPlayer) {
                player.update(this.canvas.width, this.canvas.height);
            }
        }

        // Spawn enemies (host only)
        if (this.isHost && this.spawner) {
            this.spawner.spawn(this.enemies, currentTime);
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
    shoot(player, currentTime) {
        const bulletX = player.x + player.width / 2 - CONFIG.BULLET.WIDTH / 2;
        const bulletY = player.y;

        const bullet = new Bullet(bulletX, bulletY, player.uid, player.damage);
        this.bullets.push(bullet);

        player.shoot(currentTime);
        audioManager.play('shoot');
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

                        // Sync score if local player
                        if (owner === this.localPlayer) {
                            this.syncScore(enemy.type, enemy.score);
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

                    // Sync HP if local player
                    if (player === this.localPlayer) {
                        this.syncHP();
                        this.syncDamage(enemy.damage);
                    }

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
        // Implement via networking module
        // This would call updateTeamScore from realtime.js
        console.log('Enemy reached bottom, team penalty:', CONFIG.SCORING.ENEMY_BOTTOM_PENALTY);
    }

    /**
     * Sync local player position to server
     */
    syncPositionToServer() {
        if (!this.localPlayer) return;
        // This would call updatePlayerPosition from realtime.js
        // Implementation in networking/syncManager.js
    }

    /**
     * Sync local player score to server
     * @param {string} enemyType - Enemy type killed
     * @param {number} score - Score earned
     */
    syncScore(enemyType, score) {
        // This would call updatePlayerScore from realtime.js
        console.log('Score sync:', enemyType, score);
    }

    /**
     * Sync local player HP to server
     */
    syncHP() {
        if (!this.localPlayer) return;
        // This would call updatePlayerHP from realtime.js
        console.log('HP sync:', this.localPlayer.hp);
    }

    /**
     * Sync damage taken to server
     * @param {number} damage - Damage amount
     */
    syncDamage(damage) {
        // This would call updatePlayerDamage from realtime.js
        console.log('Damage sync:', damage);
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
        const player = this.players.get(uid);
        if (!player || player === this.localPlayer) return;

        // Update position
        if (data.x !== undefined) player.x = data.x;
        if (data.y !== undefined) player.y = data.y;

        // Update stats
        if (data.hp !== undefined) player.hp = data.hp;
        if (data.score !== undefined) player.score = data.score;
    }
}
