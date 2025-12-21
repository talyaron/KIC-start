
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
        this.boosts = [];
        this.projectiles = [];
        this.particles = [];
        this.scorePopups = []; // Floating text
        this.stars = this.initStars();
        this.shake = 0;

        this.running = false;
        this.lastTime = 0;
        this.paused = false;

        // Assets
        this.assets = {
            spaceship: this.loadImage('/assets/spaceship.png'),
            alien1: this.loadImage('/assets/alien_1.png'),
            alien2: this.loadImage('/assets/alien_2.png'),
            alien3: this.loadImage('/assets/alien_3.png'),
            star: this.loadImage('/assets/star.png')
        };
        this.processedAssets = {}; // { key: processedCanvas }

        this.tintedShipCache = {}; // { color: canvas }

        // Audio
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Config
        this.playerSpeed = 10; // Adjusted for better control
        this.enemySpeed = 2;
        this.spawnTimer = 0;
        this.lastShootTimes = {};
        this.processedShootTimes = {};

        // Boosts state
        this.playerBoosts = {}; // { uid: { type: 'speed'|'triple', end: timestamp } }
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
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
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
        } else if (type === 'alienDeath') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, now);
            oscillator.frequency.linearRampToValueAtTime(20, now + 0.4);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            oscillator.start();
            oscillator.stop(now + 0.4);
        } else if (type === 'boost') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.linearRampToValueAtTime(880, now + 0.2);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start();
            oscillator.stop(now + 0.2);
        }
    }

    loadImage(src) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
            console.log('Loaded asset:', src);
        };
        return img;
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

    processAsset(img) {
        if (!img.complete || img.naturalWidth <= 0) return null;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Chromakey: Kill ANYTHING white-ish, light grey (checkerboard), or purely black
        // Checkerboards are usually alternations of very light grey and white.
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Aggressive white/grey removal:
            // If R, G, B are all high (light colors) and close to each other (grey/white)
            const maxVal = Math.max(r, g, b);
            const minVal = Math.min(r, g, b);
            const diff = maxVal - minVal;

            if (maxVal > 180 && diff < 30) {
                data[i + 3] = 0;
            }

            // Also pure black backgrounds
            if (maxVal < 20) {
                data[i + 3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    getTintedShip(color) {
        const ship = this.assets.spaceship;
        if (!ship.complete || ship.naturalWidth <= 0) return null;
        if (this.tintedShipCache[color]) return this.tintedShipCache[color];

        const processed = this.processAsset(ship);
        if (!processed) return null;

        const offscreen = document.createElement('canvas');
        offscreen.width = 60;
        offscreen.height = 60;
        const octx = offscreen.getContext('2d');

        // Draw processed ship
        octx.drawImage(processed, 0, 0, 60, 60);

        // Tint (Multiply blend)
        octx.globalCompositeOperation = 'source-atop';
        octx.fillStyle = color;
        octx.globalAlpha = 0.5;
        octx.fillRect(0, 0, 60, 60);
        octx.globalAlpha = 1.0;

        // Add Glow
        octx.globalCompositeOperation = 'destination-over';
        octx.shadowBlur = 15;
        octx.shadowColor = color;
        octx.fillStyle = color;
        octx.globalAlpha = 0.3;
        octx.beginPath();
        octx.arc(30, 30, 20, 0, Math.PI * 2);
        octx.fill();
        octx.globalAlpha = 1.0;

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
                    const boost = this.playerBoosts[uid];
                    if (boost && boost.type === 'triple') {
                        this.addProjectile(p.x + 5, p.y + 10, uid, p.color);
                        this.addProjectile(p.x + 25, p.y, uid, p.color);
                        this.addProjectile(p.x + 45, p.y + 10, uid, p.color);
                    } else {
                        this.addProjectile(p.x + 25, p.y, uid, p.color);
                    }
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

    updateBoosts(serverBoosts) {
        if (!this.isHost) {
            this.boosts = serverBoosts || [];
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

        const boost = this.playerBoosts[myUid];
        const speed = boost && boost.type === 'speed' ? this.playerSpeed * 1.6 : this.playerSpeed;

        if (input.left && p.x > 0) p.x -= speed;
        if (input.right && p.x < this.width - 50) p.x += speed;
        if (input.up && p.y > 0) p.y -= speed;
        if (input.down && p.y < this.height - 50) p.y += speed;

        return { x: p.x, y: p.y };
    }

    tryShoot(myUid) {
        if (this.paused) return null;
        const now = Date.now();
        const lastShoot = this.lastShootTimes[myUid] || 0;
        const boost = this.playerBoosts[myUid];
        const delay = boost && boost.type === 'speed' ? 120 : 250;

        if (now - lastShoot < delay) return null;

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

    addScorePopup(x, y, text, color) {
        this.scorePopups.push({
            x, y, text, color,
            life: 1.0,
            vy: -2
        });
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

        // Update Score Popups
        this.scorePopups.forEach(p => {
            p.y += p.vy;
            p.life -= 0.015;
        });
        this.scorePopups = this.scorePopups.filter(p => p.life > 0);

        if (this.shake > 0) this.shake -= 0.5;

        // Expire boosts
        const now = Date.now();
        Object.keys(this.playerBoosts).forEach(uid => {
            if (this.playerBoosts[uid].end < now) {
                delete this.playerBoosts[uid];
            }
        });

        if (this.isHost) {
            this.projectiles.forEach(p => p.y -= 10);
            this.projectiles = this.projectiles.filter(p => p.y > -50);

            this.spawnTimer += 16;
            if (this.spawnTimer > 1000) {
                this.spawnTimer = 0;
                // Randomly spawn size 1, 2, or 3
                const roll = Math.random();
                let size = 1;
                if (roll > 0.9) size = 3;
                else if (roll > 0.7) size = 2;

                this.enemies.push({
                    id: Date.now() + Math.random(),
                    x: Math.random() * (this.width - (40 + size * 20)),
                    y: -100,
                    size: size,
                    hp: size,
                    maxHp: size,
                    width: 40 + size * 20,
                    height: 40 + size * 20
                });

                // Spawn boost occasionally
                if (Math.random() > 0.9) {
                    this.boosts.push({
                        id: 'boost_' + Date.now(),
                        x: Math.random() * (this.width - 40),
                        y: -50,
                        type: Math.random() > 0.5 ? 'speed' : 'triple'
                    });
                }
            }

            this.enemies.forEach(e => {
                e.y += this.enemySpeed * (1.5 - (e.size * 0.2)); // Larger ones are slower
            });

            this.boosts.forEach(b => {
                b.y += 3;
            });

            this.enemies = this.enemies.filter(e => e.y < this.height);
            this.boosts = this.boosts.filter(b => b.y < this.height);

            // Collisions
            this.projectiles.forEach((p, pIdx) => {
                this.enemies.forEach((e, eIdx) => {
                    if (
                        p.x < e.x + e.width &&
                        p.x + 5 > e.x &&
                        p.y < e.y + e.height &&
                        p.y + 10 > e.y
                    ) {
                        this.addParticles(p.x, p.y, p.color, 5);
                        this.playSound('hit');
                        e.hp -= 1;
                        this.projectiles.splice(pIdx, 1);

                        if (e.hp <= 0) {
                            const partColor = e.size === 3 ? '#ff00ff' : e.size === 2 ? '#ff8800' : '#ffaa00';
                            this.addParticles(e.x + e.width / 2, e.y + e.height / 2, partColor, 30);
                            this.playSound('alienDeath');
                            this.enemies.splice(eIdx, 1);

                            if (this.players[p.ownerId]) {
                                const points = e.size * 200;
                                this.players[p.ownerId].score = (this.players[p.ownerId].score || 0) + points;
                                this.addScorePopup(e.x, e.y, '+' + points, '#ffff00');

                                if (this.onStateUpdate) {
                                    this.onStateUpdate({
                                        type: 'SCORE_UPDATE',
                                        uid: p.ownerId,
                                        score: this.players[p.ownerId].score,
                                        alienSize: e.size
                                    });
                                }
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

                // Boost Pickup
                this.boosts.forEach((b, bIdx) => {
                    if (
                        pl.x < b.x + 40 &&
                        pl.x + 60 > b.x &&
                        pl.y < b.y + 40 &&
                        pl.y + 60 > b.y
                    ) {
                        this.playSound('boost');
                        this.boosts.splice(bIdx, 1);
                        this.playerBoosts[uid] = {
                            type: b.type,
                            end: Date.now() + 8000 // 8 seconds
                        };
                        this.addScorePopup(pl.x, pl.y, b.type.toUpperCase() + ' BOOST!', '#00ffff');
                    }
                });
            });

            if (this.onStateUpdate) {
                this.onStateUpdate({
                    type: 'UPDATE_STATE',
                    enemies: this.enemies,
                    boosts: this.boosts,
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
                try {
                    this.ctx.drawImage(tintedShip, p.x, p.y);
                } catch (e) { }
            } else if (this.assets.spaceship.complete && this.assets.spaceship.naturalWidth > 0) {
                try {
                    this.ctx.drawImage(this.assets.spaceship, p.x, p.y, 60, 60);
                } catch (e) { }
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
            const rawAsset = this.assets['alien' + (e.size || 1)];
            if (rawAsset && rawAsset.complete && rawAsset.naturalWidth > 0) {
                const cacheKey = 'processed_alien_' + e.size;
                if (!this.processedAssets[cacheKey]) {
                    this.processedAssets[cacheKey] = this.processAsset(rawAsset);
                }
                const imgToDraw = this.processedAssets[cacheKey] || rawAsset;

                try {
                    if (e.size === 3) {
                        this.ctx.save();
                        this.ctx.filter = 'hue-rotate(90deg) brightness(1.2)';
                        this.ctx.drawImage(imgToDraw, e.x, e.y, e.width, e.height);
                        this.ctx.restore();
                    } else {
                        this.ctx.drawImage(imgToDraw, e.x, e.y, e.width, e.height);
                    }
                } catch (e) {
                    this.ctx.fillStyle = e.size === 3 ? '#ff00ff' : e.size === 2 ? '#ff8800' : '#00ff00';
                    this.ctx.fillRect(e.x, e.y, e.width, e.height);
                }
            } else {
                this.ctx.fillStyle = e.size === 3 ? '#ff00ff' : e.size === 2 ? '#ff8800' : '#00ff00';
                this.ctx.fillRect(e.x, e.y, e.width, e.height);
            }

            // HP Bar for elite aliens
            if (e.maxHp > 1) {
                this.ctx.fillStyle = 'rgba(255,0,0,0.3)';
                this.ctx.fillRect(e.x, e.y - 10, e.width, 4);
                this.ctx.fillStyle = '#ff3300';
                this.ctx.fillRect(e.x, e.y - 10, e.width * (e.hp / e.maxHp), 4);
            }
        });

        // Draw Boosts
        this.boosts.forEach(b => {
            this.ctx.fillStyle = b.type === 'speed' ? '#00ffff' : '#ff00ff';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.ctx.fillStyle;

            // Draw a glowing hex
            this.ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const ang = (i * Math.PI) / 3;
                const px = b.x + 20 + 15 * Math.cos(ang);
                const py = b.y + 20 + 15 * Math.sin(ang);
                if (i === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Icon letter
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(b.type === 'speed' ? 'S' : 'T', b.x + 20, b.y + 26);
        });

        // Draw Score Popups
        this.scorePopups.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.font = 'bold 20px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(p.text, p.x, p.y);
        });
        this.ctx.globalAlpha = 1.0;

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

