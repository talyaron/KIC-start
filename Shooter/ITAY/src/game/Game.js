// Main Game Class

import { Player } from './Player.js';
import { Bullet } from './Bullet.js';
import { EnemySpawner } from './spawner.js';
import { EnemyProjectile } from './EnemyProjectile.js';
import { CONFIG } from '../config.js';
import { audioManager } from '../audio/audioManager.js';
import { throttle } from '../utils/helpers.js';
import { database } from '../firebase/config.js';
import { updatePlayerPosition, onRoomChange, updateTeamScore } from '../firebase/realtime.js';

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
        this.enemyProjectiles = []; // Enemy bullets
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

        // Listen for room updates
        this.setupNetworkListeners();
    }

    setupNetworkListeners() {
        if (this.roomCode === 'local') return;

        this.unsubscribeRoom = onRoomChange(this.roomCode, (roomData) => {
            if (!roomData || !this.running) return;

            // Update other players
            Object.keys(roomData.players || {}).forEach(uid => {
                if (uid !== this.currentUser.uid) {
                    this.updatePlayerFromServer(uid, roomData.players[uid]);
                }
            });

            // Update team score if needed
            this.teamScore = roomData.teamScore || 0;
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

        // Update enemies and handle shooting
        for (const enemy of this.enemies) {
            enemy.update();

            // Enemy shooting (host only for consistency)
            if (this.isHost && enemy.canShoot(currentTime) && this.localPlayer) {
                this.handleEnemyShooting(enemy, currentTime);
                enemy.recordShot(currentTime);
            }

            // Check if enemy hit bottom
            if (enemy.isOffScreen(this.canvas.height)) {
                enemy.destroy();
                if (this.isHost) {
                    this.handleEnemyReachedBottom(enemy);
                }
            }
        }

        // Update player bullets
        for (const bullet of this.bullets) {
            bullet.update();

            if (bullet.isOffScreen()) {
                bullet.destroy();
            }
        }

        // Update enemy projectiles
        for (const projectile of this.enemyProjectiles) {
            projectile.update();

            if (projectile.isOffScreen(this.canvas.width, this.canvas.height)) {
                projectile.destroy();
            }
        }

        // Check collisions
        this.checkCollisions();

        // Clean up destroyed entities
        this.enemies = this.enemies.filter(e => e.active);
        this.bullets = this.bullets.filter(b => b.active);
        this.enemyProjectiles = this.enemyProjectiles.filter(p => p.active);
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
     * Handle enemy shooting with different patterns
     * @param {Enemy} enemy - Enemy that's shooting
     * @param {number} currentTime - Current timestamp
     */
    handleEnemyShooting(enemy, currentTime) {
        if (!this.localPlayer) return;

        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        const playerCenterX = this.localPlayer.x + this.localPlayer.width / 2;
        const playerCenterY = this.localPlayer.y + this.localPlayer.height / 2;

        // Calculate direction to player
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize direction
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Apply accuracy (spread/miss chance)
        const spread = (1 - enemy.accuracy) * 100; // Higher accuracy = less spread

        switch (enemy.type) {
            case 'RED':
                // Single straight shot with low accuracy
                this.createEnemyProjectile(
                    enemyCenterX,
                    enemyCenterY,
                    dirX,
                    dirY,
                    enemy.projectileSpeed,
                    spread,
                    enemy.damage,
                    enemy.color
                );
                break;

            case 'YELLOW':
                // Burst of 3 shots with medium accuracy
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        if (enemy.active) {
                            this.createEnemyProjectile(
                                enemyCenterX,
                                enemyCenterY,
                                dirX,
                                dirY,
                                enemy.projectileSpeed,
                                spread,
                                enemy.damage,
                                enemy.color
                            );
                        }
                    }, i * 150); // 150ms between shots
                }
                break;

            case 'BLUE':
                // Spread shot (3 bullets in a fan)
                const angles = [-0.3, 0, 0.3]; // Spread angles
                angles.forEach(angleOffset => {
                    const cos = Math.cos(angleOffset);
                    const sin = Math.sin(angleOffset);
                    const rotatedX = dirX * cos - dirY * sin;
                    const rotatedY = dirX * sin + dirY * cos;

                    this.createEnemyProjectile(
                        enemyCenterX,
                        enemyCenterY,
                        rotatedX,
                        rotatedY,
                        enemy.projectileSpeed,
                        spread * 0.5, // Less spread for blue
                        enemy.damage,
                        enemy.color
                    );
                });
                break;
        }
    }

    /**
     * Create an enemy projectile with spread
     * @param {number} x - Starting x
     * @param {number} y - Starting y
     * @param {number} dirX - Direction X (normalized)
     * @param {number} dirY - Direction Y (normalized)
     * @param {number} speed - Projectile speed
     * @param {number} spread - Spread amount in pixels
     * @param {number} damage - Damage amount
     * @param {string} color - Projectile color
     */
    createEnemyProjectile(x, y, dirX, dirY, speed, spread, damage, color) {
        // Add random spread
        const spreadX = (Math.random() - 0.5) * spread;
        const spreadY = (Math.random() - 0.5) * spread;

        const velocityX = dirX * speed + spreadX * 0.01;
        const velocityY = dirY * speed + spreadY * 0.01;

        const projectile = new EnemyProjectile(x, y, velocityX, velocityY, damage, color);
        this.enemyProjectiles.push(projectile);
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

                    // Apply damage to enemy
                    const enemyDied = enemy.takeDamage(bullet.damage);

                    audioManager.play('enemyHit');

                    // Only award score/exp if enemy died
                    if (enemyDied) {
                        const owner = this.players.get(bullet.ownerId);
                        if (owner) {
                            owner.addKill(enemy.type, enemy.score, enemy.exp);
                            // score/exp sync is now handled by throttled syncStats()
                        }
                    }

                    break;
                }
            }
        }

        // Enemy-Player collisions (removed - only projectiles damage player now)
        // Enemies can pass through the player without harm

        // Enemy Projectile-Player collisions
        for (const projectile of this.enemyProjectiles) {
            if (!projectile.active) continue;

            for (const player of this.players.values()) {
                if (projectile.collidesWith(player.x, player.y, player.width, player.height)) {
                    projectile.destroy();
                    player.takeDamage(projectile.damage);
                    audioManager.play('playerHit');

                    // HP sync is handled by throttled syncStats()
                    break;
                }
            }
        }
    }

    /**
     * Handle enemy reaching bottom (host only  
     * @param {Enemy} enemy - Enemy that reached bottom
     */
    handleEnemyReachedBottom(enemy) {
        // Enemies that reach bottom just disappear (no damage to players)
        console.log('Enemy reached bottom - disappeared safely');
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
     * Batch sync for stats (score, kills, hp, damageTaken, exp)
     */
    syncStatsToServer() {
        if (!this.localPlayer || this.roomCode === 'local') return;

        // Use a generic update for the entire player object in the room
        // to minimize individual update calls
        const updates = {
            score: this.localPlayer.score,
            exp: this.localPlayer.exp,
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

        // Render enemy projectiles
        for (const projectile of this.enemyProjectiles) {
            projectile.render(this.ctx);
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

        // Update kills and damage
        if (data.kills) {
            player.kills = { ...data.kills };
        }
        if (data.damageTaken !== undefined) {
            player.damageTaken = data.damageTaken;
        }
    }
}
