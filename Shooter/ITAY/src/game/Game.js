// Main Game Class

import { Player } from './Player.js';
import { Bullet } from './Bullet.js';
import { EnemySpawner } from './spawner.js';
import { Collectible } from './Collectible.js';
import { CONFIG } from '../config.js';
import { audioManager } from '../audio/audioManager.js';
import { throttle, showToast } from '../utils/helpers.js';
import { database } from '../firebase/config.js';
import { updatePlayerPosition, onRoomChange } from '../firebase/realtime.js';
import { assets } from './AssetManager.js';

export class Game {
    constructor(canvas, roomCode, currentUser, roomData, isHost) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.roomCode = roomCode;
        this.currentUser = currentUser;
        this.isHost = isHost;

        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        this.players = new Map();
        this.enemies = [];
        this.bullets = [];
        this.collectibles = [];
        this.running = false;
        this.gameStartTime = Date.now();
        this.teamScore = roomData?.teamScore || 0;

        this.cameraX = 0;
        this.cameraY = 0;
        this.keys = {};

        this.localPlayer = new Player(currentUser.uid, CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);
        this.players.set(currentUser.uid, this.localPlayer);

        if (roomData && roomData.matchSeed) {
            this.spawner = new EnemySpawner(roomData.matchSeed, CONFIG.WORLD_WIDTH);
        } else {
            this.spawner = new EnemySpawner(Math.floor(Math.random() * 1000000), CONFIG.WORLD_WIDTH);
        }

        this.starLayers = [
            this.generateStars(300, 0.1),
            this.generateStars(200, 0.3),
            this.generateStars(100, 0.6)
        ];

        this.setupNetworking();
        this.setupInput();
    }

    generateStars(count, depth) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                size: Math.random() * 2 * depth,
                opacity: Math.random() * 0.5 + 0.2,
                depth: depth
            });
        }
        return stars;
    }

    setupNetworking() {
        if (this.roomCode === 'local') return;
        this.unsubscribeRoom = onRoomChange(this.roomCode, (roomData) => {
            if (roomData.status === 'ended' && this.running) {
                this.stop();
                return;
            }
            Object.keys(roomData.players || {}).forEach(uid => {
                if (uid !== this.currentUser.uid) {
                    this.updatePlayerFromServer(uid, roomData.players[uid]);
                }
            });
            this.teamScore = roomData.teamScore || 0;
        });
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (!this.localPlayer) return;
            switch (e.key.toLowerCase()) {
                case 'a': case 'arrowleft': this.localPlayer.inputs.left = true; break;
                case 'd': case 'arrowright': this.localPlayer.inputs.right = true; break;
                case 'w': case 'arrowup': this.localPlayer.inputs.up = true; break;
                case 's': case 'arrowdown': this.localPlayer.inputs.down = true; break;
                case ' ': this.localPlayer.inputs.shoot = true; e.preventDefault(); break;
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
            if (!this.localPlayer) return;
            switch (e.key.toLowerCase()) {
                case 'a': case 'arrowleft': this.localPlayer.inputs.left = false; break;
                case 'd': case 'arrowright': this.localPlayer.inputs.right = false; break;
                case 'w': case 'arrowup': this.localPlayer.inputs.up = false; break;
                case 's': case 'arrowdown': this.localPlayer.inputs.down = false; break;
                case ' ': this.localPlayer.inputs.shoot = false; break;
            }
        });
    }

    start() {
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.syncStatsToServer();
    }

    gameLoop() {
        if (!this.running) return;
        const currentTime = Date.now();
        this.update(currentTime);
        this.render();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(currentTime) {
        if (this.localPlayer) {
            this.localPlayer.update();
            const targetX = this.localPlayer.x - this.canvas.width / 2;
            const targetY = this.localPlayer.y - this.canvas.height / 2;
            this.cameraX += (targetX - this.cameraX) * 0.1;
            this.cameraY += (targetY - this.cameraY) * 0.1;

            if (this.localPlayer.inputs.shoot && this.localPlayer.canShoot(currentTime)) {
                this.shoot(this.localPlayer, currentTime);
            }
            this.syncPosition();
            this.syncStats();
        }

        if (this.spawner) {
            this.spawner.spawnAround(this.enemies, this.collectibles, currentTime, this.localPlayer.x, this.localPlayer.y);
        }

        this.enemies.forEach(e => e.update());
        this.bullets.forEach(b => b.update());
        this.collectibles.forEach(c => c.update());

        this.checkCollisions();

        this.bullets = this.bullets.filter(b => b.active && !b.isExpired(CONFIG.WORLD_WIDTH, CONFIG.WORLD_HEIGHT));
        this.enemies = this.enemies.filter(e => e.active);
        this.collectibles = this.collectibles.filter(c => c.active);
    }

    shoot(player, time) {
        const bullet = new Bullet(player.x, player.y, player.angle, player.uid, player.damage);
        this.bullets.push(bullet);
        player.lastShotTime = time;
        audioManager.play('shoot');
    }

    checkCollisions() {
        if (!this.localPlayer) return;

        // 1. Enemy (Asteroid) collisions
        for (const enemy of this.enemies) {
            if (!enemy.active) continue;

            // Bullet hit asteroid
            for (const bullet of this.bullets) {
                if (bullet.active && bullet.collidesWith(enemy.x, enemy.y, enemy.width, enemy.height)) {
                    enemy.takeDamage(bullet.damage);
                    bullet.destroy();

                    if (!enemy.active) {
                        this.localPlayer.score += enemy.score;

                        // Track asteroid kills by type correctly
                        const category = enemy.type.toLowerCase(); // small, medium, large
                        if (this.localPlayer.kills.hasOwnProperty(category)) {
                            this.localPlayer.kills[category]++;
                        }

                        audioManager.play('enemyHit');
                    }
                }
            }

            // Asteroid hit player
            if (this.localPlayer.collidesWith(enemy.x, enemy.y, enemy.width, enemy.height)) {
                this.localPlayer.takeDamage(enemy.damage);
                enemy.destroy();
                audioManager.play('playerHit');
            }
        }

        // 2. Collectible collisions
        for (const collectible of this.collectibles) {
            if (!collectible.active) continue;
            if (this.localPlayer.collidesWith(collectible.x, collectible.y, collectible.width, collectible.height)) {
                if (collectible.type === 'WRENCH') {
                    // Restore 25 HP
                    this.localPlayer.hp = Math.min(this.localPlayer.maxHp, this.localPlayer.hp + 25);
                    audioManager.play('go');
                    showToast('🔧 Hull Repaired! +25 HP', 'success');
                }
                collectible.active = false;
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.starLayers.forEach(layer => {
            this.ctx.save();
            layer.forEach(star => {
                const px = (star.x - this.cameraX * star.depth) % this.canvas.width;
                const py = (star.y - this.cameraY * star.depth) % this.canvas.height;
                const finalX = px < 0 ? px + this.canvas.width : px;
                const finalY = py < 0 ? py + this.canvas.height : py;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                this.ctx.beginPath();
                this.ctx.arc(finalX, finalY, star.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.restore();
        });

        this.ctx.save();
        this.ctx.translate(-this.cameraX, -this.cameraY);
        this.collectibles.forEach(c => c.render(this.ctx));
        this.enemies.forEach(e => e.render(this.ctx));
        this.bullets.forEach(b => b.render(this.ctx));
        for (const p of this.players.values()) p.render(this.ctx);
        this.ctx.restore();
    }

    syncPosition = throttle(() => {
        if (this.roomCode === 'local') return;
        updatePlayerPosition(this.roomCode, this.currentUser.uid, this.localPlayer.x, this.localPlayer.y, this.localPlayer.angle);
    }, CONFIG.NETWORK.POSITION_UPDATE_RATE);

    syncStats = throttle(() => {
        this.syncStatsToServer();
    }, CONFIG.NETWORK.SCORE_UPDATE_RATE);

    syncStatsToServer() {
        if (this.roomCode === 'local') return;
        const updates = {
            score: this.localPlayer.score,
            hp: Math.ceil(this.localPlayer.hp),
            angle: this.localPlayer.angle
        };
        database.ref(`rooms/${this.roomCode}/players/${this.currentUser.uid}`).update(updates);
    }

    updatePlayerFromServer(uid, data) {
        let player = this.players.get(uid);
        if (!player) {
            player = new Player(uid, data.x, data.y);
            this.players.set(uid, player);
        }
        if (player === this.localPlayer) return;
        player.x = data.x ?? player.x;
        player.y = data.y ?? player.y;
        player.angle = data.angle ?? player.angle;
        player.hp = data.hp ?? player.hp;
        player.score = data.score ?? player.score;
    }
}
