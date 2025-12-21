
export class GameEngine {
    constructor(canvas, isHost, onStateUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isHost = isHost;
        this.onStateUpdate = onStateUpdate;
        this.onGameOver = onGameOver;

        this.players = {};
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.stars = this.initStars();
        this.shake = 0;

        this.running = false;
        this.lastTime = 0;
        this.paused = false;

        // Assets
        this.assets = {
            spaceship: new Image(),
            alien: new Image(),
            star: new Image()
        };
        this.assets.spaceship.src = '/src/assets/spaceship.png';
        this.assets.alien.src = '/src/assets/alien.png';
        this.assets.star.src = '/src/assets/star.png';

        this.tintedShipCache = {}; // { color: canvas }

        // Audio
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Config
        this.playerSpeed = 10; // Adjusted for better control
        this.enemySpeed = 2;
        this.spawnTimer = 0;
        this.lastShootTimes = {};
        this.processedShootTimes = {};
    }

    initStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 0.5
            });
        }
        return stars;
    }

    playSound(type) {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'shoot') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.exponentialRampToValueAtTime(10, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start();
            oscillator.stop(now + 0.1);
        } else if (type === 'explosion') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(150, now);
            oscillator.frequency.exponentialRampToValueAtTime(10, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start();
            oscillator.stop(now + 0.3);
        } else if (type === 'hit') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.05);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            oscillator.start();
            oscillator.stop(now + 0.05);
        } else if (type === 'gameOver') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.linearRampToValueAtTime(50, now + 1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.linearRampToValueAtTime(0, now + 1);
            oscillator.start();
            oscillator.stop(now + 1);
        }
    }

    addParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1.0,
                color,
                size: Math.random() * 4 + 2
            });
        }
    }

    getTintedShip(color) {
        if (!this.assets.spaceship.complete) return null;
        if (this.tintedShipCache[color]) return this.tintedShipCache[color];

        const offscreen = document.createElement('canvas');
        offscreen.width = 60;
        offscreen.height = 60;
        const octx = offscreen.getContext('2d');

        // Draw ship
        octx.drawImage(this.assets.spaceship, 0, 0, 60, 60);

        // Tint (Multiply blend)
        octx.globalCompositeOperation = 'source-atop';
        octx.fillStyle = color;
        octx.globalAlpha = 0.4; // Subtle tint to keep detail
        octx.fillRect(0, 0, 60, 60);
        octx.globalAlpha = 1.0;

        // Add Glow
        octx.globalCompositeOperation = 'destination-over';
        octx.shadowBlur = 10;
        octx.shadowColor = color;
        octx.fillStyle = color;
        octx.fillRect(10, 10, 40, 40); // Internal glow block

        this.tintedShipCache[color] = offscreen;
        return offscreen;
    }

    start() {
        this.running = true;
        this.paused = false;
        requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    pause() {
        this.paused = true;
        this.playSound('gameOver');
    }

    updatePlayers(serverPlayers) {
        if (this.isHost) {
            Object.keys(serverPlayers).forEach(uid => {
                const p = serverPlayers[uid];
                const last = this.processedShootTimes[uid] || 0;
                if (p.lastShoot && p.lastShoot > last) {
                    this.processedShootTimes[uid] = p.lastShoot;
                    this.addProjectile(p.x + 25, p.y, uid, p.color);
                    this.playSound('shoot');
                }
            });
        }
        this.players = { ...serverPlayers };
    }

    updateEnemies(serverEnemies) {
        if (!this.isHost) {
            this.enemies = serverEnemies || [];
        }
    }

    updateProjectiles(serverProjectiles) {
        if (!this.isHost) {
            this.projectiles = serverProjectiles || [];
        }
    }

    handleInput(input, myUid) {
        if (this.paused) return null;
        const p = this.players[myUid];
        if (!p) return null;

        if (input.left && p.x > 0) p.x -= this.playerSpeed;
        if (input.right && p.x < this.width - 50) p.x += this.playerSpeed;
        if (input.up && p.y > 0) p.y -= this.playerSpeed;
        if (input.down && p.y < this.height - 50) p.y += this.playerSpeed;

        return { x: p.x, y: p.y };
    }

    tryShoot(myUid) {
        if (this.paused) return null;
        const now = Date.now();
        const lastShoot = this.lastShootTimes[myUid] || 0;
        if (now - lastShoot < 250) return null;

        this.lastShootTimes[myUid] = now;
        return now;
    }

    addProjectile(x, y, ownerId, color) {
        this.projectiles.push({
            id: Date.now() + Math.random(),
            x, y, ownerId,
            color: color || '#00f0ff'
        });
    }

    loop(timestamp) {
        if (!this.running) return;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (!this.paused) {
            this.update(dt);
        }
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        // Move Stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = -star.size;
                star.x = Math.random() * this.width;
            }
        });

        // Update Particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        if (this.shake > 0) this.shake -= 0.5;

        if (this.isHost) {
            this.projectiles.forEach(p => p.y -= 10);
            this.projectiles = this.projectiles.filter(p => p.y > -50);

            this.spawnTimer += 16;
            if (this.spawnTimer > 1000) {
                this.spawnTimer = 0;
                this.enemies.push({
                    id: Date.now(),
                    x: Math.random() * (this.width - 50),
                    y: -50,
                    type: Math.random() > 0.7 ? 'elite' : 'normal',
                    width: 50,
                    height: 50
                });
            }

            this.enemies.forEach(e => {
                e.y += this.enemySpeed;
            });

            this.enemies = this.enemies.filter(e => e.y < this.height);

            // Collisions
            this.projectiles.forEach((p, pIdx) => {
                this.enemies.forEach((e, eIdx) => {
                    if (
                        p.x < e.x + e.width &&
                        p.x + 5 > e.x &&
                        p.y < e.y + e.height &&
                        p.y + 10 > e.y
                    ) {
                        this.addParticles(e.x + e.width / 2, e.y + e.height / 2, '#ff4444', 15);
                        this.playSound('explosion');
                        this.enemies.splice(eIdx, 1);
                        this.projectiles.splice(pIdx, 1);

                        if (this.players[p.ownerId]) {
                            this.players[p.ownerId].score = (this.players[p.ownerId].score || 0) + 100;
                            if (this.onStateUpdate) {
                                this.onStateUpdate({
                                    type: 'SCORE_UPDATE',
                                    uid: p.ownerId,
                                    score: this.players[p.ownerId].score
                                });
                            }
                        }
                    }
                });
            });

            Object.keys(this.players).forEach(uid => {
                const pl = this.players[uid];
                this.enemies.forEach((e, eIdx) => {
                    if (
                        pl.x < e.x + e.width &&
                        pl.x + 50 > e.x &&
                        pl.y < e.y + e.height &&
                        pl.y + 50 > e.y
                    ) {
                        this.addParticles(pl.x + 25, pl.y + 25, '#ffffff', 20);
                        this.playSound('hit');
                        this.shake = 10;
                        this.enemies.splice(eIdx, 1);
                        if (this.onStateUpdate) {
                            const newHp = (pl.hp || 100) - 20;
                            this.onStateUpdate({ type: 'DAMAGE', uid, newHp });
                        }
                    }
                });
            });

            if (this.onStateUpdate) {
                this.onStateUpdate({
                    type: 'UPDATE_STATE',
                    enemies: this.enemies,
                    projectiles: this.projectiles
                });
            }
        }
    }

    draw() {
        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Clear background with deep black
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.globalAlpha = 0.5 + Math.random() * 0.5;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.globalAlpha = 1.0;

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;

        // Draw Players
        Object.keys(this.players).forEach(uid => {
            const p = this.players[uid];
            // Render ship sprite
            const tintedShip = this.getTintedShip(p.color || '#fff');
            if (tintedShip) {
                this.ctx.drawImage(tintedShip, p.x, p.y);
            } else if (this.assets.spaceship.complete) {
                this.ctx.drawImage(this.assets.spaceship, p.x, p.y, 60, 60);
            } else {
                this.ctx.fillStyle = p.color || '#fff';
                this.ctx.fillRect(p.x, p.y, 50, 50);
            }

            // HP Bar
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(p.x, p.y - 15, 60, 5);
            this.ctx.fillStyle = p.color || '#00ff00';
            this.ctx.fillRect(p.x, p.y - 15, 60 * ((p.hp || 100) / 100), 5);
        });

        // Draw Enemies
        this.enemies.forEach(e => {
            if (this.assets.alien.complete) {
                this.ctx.drawImage(this.assets.alien, e.x, e.y, e.width, e.height);
            } else {
                this.ctx.fillStyle = e.type === 'elite' ? '#ffd700' : '#ff2a2a';
                this.ctx.fillRect(e.x, e.y, e.width, e.height);
            }
        });

        // Draw Projectiles
        this.projectiles.forEach(p => {
            this.ctx.fillStyle = p.color || '#00f0ff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.fillRect(p.x - 2, p.y, 4, 15);
            this.ctx.shadowBlur = 0;
        });

        this.ctx.restore();
    }
}

