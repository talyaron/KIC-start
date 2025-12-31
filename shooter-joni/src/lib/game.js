
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
        this.starLayers = this.initStarLayers(); // Pre-rendered star fields
        this.shake = 0;

        this.running = false;
        this.lastTime = 0;
        this.paused = false;

        // Local ID
        this.myUid = null;

        // Assets
        this.assets = {};
        this.processedAssets = {};
        this.tintedShipCache = {};
        this.spriteCache = {}; // { 'alien1_normal', 'alien2_frozen', etc. }
        this.loadGameAssets();

        // Audio
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Config
        this.playerSpeed = 18; // Even faster
        this.enemySpeed = 2.5;
        this.spawnTimer = 0;
        this.lastShootTimes = {};
        this.processedShootTimes = {};
        this.enemyFreezeEnd = 0;

        // Boosts state
        this.playerBoosts = {}; // { uid: { type: 'speed'|'triple'|'shield'|'freeze', end: timestamp } }
    }

    initStarLayers() {
        const layers = [];
        for (let i = 0; i < 3; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            for (let j = 0; j < 40; j++) {
                const x = Math.random() * this.width;
                const y = Math.random() * this.height;
                const size = Math.random() * 2 + 0.5;
                ctx.globalAlpha = 0.3 + Math.random() * 0.4;
                ctx.fillRect(x, y, size, size);
            }
            layers.push({
                canvas,
                y: 0,
                speed: (i + 1) * 0.7
            });
        }
        return layers;
    }

    loadGameAssets() {
        const sources = {
            spaceship: '/assets/spaceship.png',
            alien1: '/assets/alien_1.png',
            alien2: '/assets/alien_2.png',
            alien3: '/assets/alien_3.png',
            star: '/assets/star.png'
        };

        Object.entries(sources).forEach(([key, src]) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = () => {
                console.log(`Asset loaded: ${key}`);
                const processed = this.processAsset(img, key === 'spaceship' ? 128 : 256);
                this.processedAssets[key] = processed;

                if (key === 'spaceship') this.tintedShipCache = {};

                // Pre-generate filtered versions for aliens to avoid real-time ctx.filter
                if (key.startsWith('alien')) {
                    const size = key === 'alien1' ? 1 : key === 'alien2' ? 2 : 3;
                    this.preCacheAlien(key, processed, size);
                }
            };
            this.assets[key] = img;
        });
    }

    preCacheAlien(key, canvas, size) {
        if (!canvas) return;

        // 1. Normal/Base version
        const base = document.createElement('canvas');
        base.width = canvas.width;
        base.height = canvas.height;
        const bctx = base.getContext('2d');

        if (size === 3) {
            bctx.filter = 'hue-rotate(90deg) brightness(1.2)';
        } else if (size === 2) {
            bctx.filter = 'hue-rotate(200deg) brightness(1.1)';
        }
        bctx.drawImage(canvas, 0, 0);
        this.spriteCache[`${key}_normal`] = base;

        // 2. Frozen version
        const frozen = document.createElement('canvas');
        frozen.width = canvas.width;
        frozen.height = canvas.height;
        const fctx = frozen.getContext('2d');
        fctx.filter = 'brightness(1.5) hue-rotate(180deg) saturate(0.5)';
        fctx.drawImage(canvas, 0, 0);
        this.spriteCache[`${key}_frozen`] = frozen;
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
        } else if (type === 'shieldHit') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start();
            oscillator.stop(now + 0.1);
        }
    }

    loadImage(src) {
        // Obsolete, handled in loadGameAssets now
        return null;
    }

    addParticles(x, y, color, count = 10) {
        if (this.particles.length > 300) return; // Lag prevention: cap total particles
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color,
                size: Math.random() * 3 + 1
            });
        }
    }

    processAsset(img, targetSize = 256) {
        if (!img.complete || img.naturalWidth <= 0) return null;

        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = img.naturalWidth;
        fullCanvas.height = img.naturalHeight;
        const fctx = fullCanvas.getContext('2d', { willReadFrequently: true });
        fctx.drawImage(img, 0, 0);

        const imageData = fctx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
        const data = imageData.data;

        // Sample the top-left pixel to detect the "fake" transparency color
        const bgR = data[0], bgG = data[1], bgB = data[2];
        const isBgWhiteish = (bgR + bgG + bgB) / 3 > 128;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

            const brightness = (r + g + b) / 3;
            const maxVal = Math.max(r, g, b);
            const minVal = Math.min(r, g, b);
            const saturation = maxVal - minVal;

            // 1. Kill pixels close to the sample background color
            let shouldKill = dist < 40;

            // 2. Kill grey/white patterns (common checkerboard)
            if (saturation < 35) {
                if (brightness > 80 || brightness < 40) shouldKill = true;
            }

            // 3. Kill extreme white/black
            if (brightness > 230 || brightness < 15) shouldKill = true;

            if (shouldKill) {
                data[i + 3] = 0;
            } else {
                // Alpha Hardening: Remove fuzzy fringes
                // If it's not background, make it 100% opaque to prevent "haze"
                data[i + 3] = 255;
            }
        }
        fctx.putImageData(imageData, 0, 0);

        const finalCanvas = document.createElement('canvas');
        const ratio = img.naturalHeight / img.naturalWidth;
        finalCanvas.width = targetSize;
        finalCanvas.height = targetSize * ratio;
        const ctx = finalCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(fullCanvas, 0, 0, finalCanvas.width, finalCanvas.height);

        return finalCanvas;
    }

    getTintedShip(color) {
        const shipCanvas = this.processedAssets['spaceship'];
        if (!shipCanvas) return null;
        if (this.tintedShipCache[color]) return this.tintedShipCache[color];

        const offscreen = document.createElement('canvas');
        offscreen.width = 120;
        offscreen.height = 120;
        const octx = offscreen.getContext('2d');

        octx.drawImage(shipCanvas, 30, 30, 60, 60);

        // Tint
        octx.globalCompositeOperation = 'source-atop';
        octx.fillStyle = color;
        octx.globalAlpha = 0.5;
        octx.fillRect(0, 0, 120, 120);
        octx.globalAlpha = 1.0;

        // Subtle center glow
        octx.globalCompositeOperation = 'destination-over';
        const grad = octx.createRadialGradient(60, 60, 10, 60, 60, 35);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        octx.fillStyle = grad;
        octx.globalAlpha = 0.3;
        octx.fillRect(0, 0, 120, 120);
        octx.globalAlpha = 1.0;

        this.tintedShipCache[color] = offscreen;
        return offscreen;
    }

    start() {
        if (this.running && !this.paused) return; // Prevent duplicate loops
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    pause() {
        this.paused = true;
        this.playSound('gameOver');
    }

    updatePlayers(rawServerPlayers) {
        if (!rawServerPlayers) {
            this.players = {};
            return;
        }

        // Filter out ghosts/inactive players (older than 8s)
        const now = Date.now();
        const serverPlayers = {};
        Object.keys(rawServerPlayers).forEach(uid => {
            const p = rawServerPlayers[uid];
            // If it's ME, it's always active. If it's someone else, check heartbeat.
            if (uid === this.myUid || (now - (p.lastActive || 0)) < 8000) {
                serverPlayers[uid] = p;
            }
        });

        if (this.isHost) {
            Object.keys(serverPlayers).forEach(uid => {
                const p = serverPlayers[uid];
                const last = this.processedShootTimes[uid] || 0;
                if (p.lastShoot && p.lastShoot > last) {
                    this.processedShootTimes[uid] = p.lastShoot;

                    // SKip duplicate add for local host ship (already added in local loop)
                    if (uid === this.myUid) return;

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

        // Apply filtered server updates
        Object.keys(serverPlayers).forEach(uid => {
            const serverP = serverPlayers[uid];
            if (!this.players[uid]) {
                const p = { ...serverP };
                if (uid !== this.myUid) {
                    p.x = serverP.x;
                    p.y = serverP.y;
                    p.targetX = serverP.x;
                    p.targetY = serverP.y;
                }
                this.players[uid] = p;
                return;
            }

            // Sync Logic:
            // If it's NOT ME, interpolate towards server position.
            // If it's ME, KEEP my local X/Y but update health/score/etc. from server.
            if (uid !== this.myUid) {
                // Store target position for interpolation
                this.players[uid] = {
                    ...this.players[uid],
                    ...serverP,
                    targetX: serverP.x,
                    targetY: serverP.y
                };
                // If it's a new player, snap immediately
                if (this.players[uid].x === undefined) {
                    this.players[uid].x = serverP.x;
                    this.players[uid].y = serverP.y;
                }
            } else {
                const { x, y, ...meta } = serverP;
                this.players[uid] = { ...this.players[uid], ...meta };
            }
        });

        // Cleanup stale players
        Object.keys(this.players).forEach(uid => {
            if (!serverPlayers[uid]) delete this.players[uid];
        });
    }

    updateEnemies(serverEnemies) {
        if (!this.isHost) {
            this.enemies = serverEnemies ? Object.values(serverEnemies) : [];
        }
    }

    updateBoosts(serverBoosts) {
        if (!this.isHost) {
            this.boosts = serverBoosts ? Object.values(serverBoosts) : [];
        }
    }

    updateProjectiles(serverProjectiles) {
        if (!this.isHost) {
            this.projectiles = serverProjectiles ? Object.values(serverProjectiles) : [];
        }
    }

    handleInput(input, myUid, dt = 16.6) {
        if (this.paused) return null;
        const p = this.players[myUid];
        if (!p) return null;

        const boost = this.playerBoosts[myUid];
        const multiplier = boost && boost.type === 'speed' ? 1.7 : 1.0;
        const speed = this.playerSpeed * multiplier * (dt / 16.6);

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
        const delay = boost && boost.type === 'speed' ? 200 : 400;

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
        // Update Star Layers
        this.starLayers.forEach(layer => {
            layer.y += layer.speed * (dt / 16.6);
            if (layer.y >= this.height) layer.y = 0;
        });

        // Update Particles
        this.particles.forEach(p => {
            const ratio = dt / 16.6;
            p.x += p.vx * ratio;
            p.y += p.vy * ratio;
            p.life -= 0.02 * ratio;
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Update Other Players (Interpolation)
        Object.keys(this.players).forEach(uid => {
            if (uid === this.myUid) return;
            const p = this.players[uid];
            if (p.targetX !== undefined && p.targetY !== undefined) {
                // Smoothly move towards target (lerp)
                // Using a factor that feels responsive but smooth at 20Hz updates
                const lerpFactor = 0.15;
                p.x += (p.targetX - p.x) * lerpFactor;
                p.y += (p.targetY - p.y) * lerpFactor;
            }
        });

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

        const isFrozen = this.enemyFreezeEnd > now;

        if (this.isHost) {
            const ratio = dt / 16.6;
            this.projectiles.forEach(p => p.y -= 10 * ratio);
            this.projectiles = this.projectiles.filter(p => p.y > -50);

            this.spawnTimer += dt || 16;
            if (this.spawnTimer > 1000) {
                this.spawnTimer = 0;
                // Randomly spawn size 1, 2, or 3
                const roll = Math.random();
                let size = 1;
                let hp = 2;
                if (roll > 0.8) {
                    size = 3;
                    hp = 7;
                }
                else if (roll > 0.5) {
                    size = 2;
                    hp = 4;
                }

                this.enemies.push({
                    id: Date.now() + Math.random(),
                    x: Math.random() * (this.width - (40 + size * 20)),
                    y: -100,
                    size: size,
                    hp: hp,
                    maxHp: hp,
                    width: 40 + size * 20,
                    height: 40 + size * 20
                });

                // Spawn boost occasionally
                if (Math.random() > 0.85) { // Slightly more frequent
                    const bRoll = Math.random();
                    let bType = 'speed';
                    if (bRoll > 0.80) bType = 'heal';
                    else if (bRoll > 0.60) bType = 'freeze';
                    else if (bRoll > 0.40) bType = 'shield';
                    else if (bRoll > 0.20) bType = 'triple';

                    this.boosts.push({
                        id: 'boost_' + Date.now(),
                        x: Math.random() * (this.width - 40),
                        y: -50,
                        type: bType
                    });
                }
            }

            if (!isFrozen) {
                this.enemies.forEach(e => {
                    const eSpeed = this.enemySpeed * (1.5 - (e.size * 0.2));
                    e.y += eSpeed * ratio;
                });
            }

            this.boosts.forEach(b => {
                b.y += 3 * ratio;
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
                        const boost = this.playerBoosts[uid];
                        if (boost && boost.type === 'shield') {
                            this.addParticles(e.x + e.width / 2, e.y + e.height / 2, '#00ffff', 10);
                            this.playSound('shieldHit');
                            this.enemies.splice(eIdx, 1);
                            return;
                        }

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

                // Shared Death Check (Host Only)
                if (pl.hp <= 0 && this.onGameOver) {
                    this.onGameOver(); // Trigger global game over
                }

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

                        if (b.type === 'heal') {
                            const newHp = Math.min(100, (pl.hp || 100) + 30);
                            if (this.onStateUpdate) {
                                this.onStateUpdate({ type: 'DAMAGE', uid, newHp });
                            }
                            this.addScorePopup(pl.x, pl.y, '+30 HP', '#00ff9d');
                        } else {
                            this.playerBoosts[uid] = {
                                type: b.type,
                                end: Date.now() + 8000 // 8 seconds
                            };

                            // New: Freeze Logic
                            if (b.type === 'freeze') {
                                this.enemyFreezeEnd = Date.now() + 4000; // 4 seconds
                            }
                            this.addScorePopup(pl.x, pl.y, b.type.toUpperCase() + ' BOOST!', '#00ffff');
                        }
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

    drawEnemyFallback(e) {
        this.ctx.fillStyle = e.size === 3 ? '#ff00ff' : e.size === 2 ? '#ff8800' : '#00ff00';
        this.ctx.fillRect(e.x, e.y, e.width, e.height);
    }

    draw() {
        this.ctx.save();
        if (this.shake > 0) {
            this.ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }

        // Clear background with deep black
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Star Layers
        this.starLayers.forEach(layer => {
            this.ctx.drawImage(layer.canvas, 0, layer.y);
            this.ctx.drawImage(layer.canvas, 0, layer.y - this.height);
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;

        const isFrozen = this.enemyFreezeEnd > Date.now();

        // Draw Players
        Object.keys(this.players).forEach(uid => {
            const p = this.players[uid];
            const boost = this.playerBoosts[uid];

            // Shield Effect
            if (boost && boost.type === 'shield') {
                this.ctx.strokeStyle = '#00f0ff';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(p.x + 30, p.y + 30, 45, 0, Math.PI * 2);
                this.ctx.stroke();

                // Low-cost inner glow
                this.ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
                this.ctx.fill();
            }

            // Render ship sprite
            const tintedShip = this.getTintedShip(p.color || '#fff');
            if (tintedShip) {
                try {
                    // Offset for higher res canvas
                    this.ctx.drawImage(tintedShip, p.x - 30, p.y - 30);
                } catch (e) { }
            } else if (this.assets.spaceship.complete && this.assets.spaceship.naturalWidth > 0) {
                try {
                    // Draw fallback at same centered offset as tinted ships
                    this.ctx.drawImage(this.assets.spaceship, p.x - 30, p.y - 30, 120, 120);
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
            const state = isFrozen ? 'frozen' : 'normal';
            const cacheKey = `alien${e.size || 1}_${state}`;
            const sprite = this.spriteCache[cacheKey] || this.processedAssets['alien' + (e.size || 1)];

            if (sprite) {
                this.ctx.drawImage(sprite, e.x, e.y, e.width, e.height);
            } else {
                this.drawEnemyFallback(e);
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
            // Speed: Gold, Shield: Blue, Triple: Pink, Freeze: Cyan/Ice, Heal: Green
            this.ctx.fillStyle = b.type === 'speed' ? '#ffcc00' :
                b.type === 'shield' ? '#0066ff' :
                    b.type === 'freeze' ? '#99ffff' :
                        b.type === 'heal' ? '#00ff9d' : '#ff00ff';

            // Draw a glowing hex (no shadowBlur)
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

            // Simple halo
            this.ctx.globalAlpha = 0.2;
            this.ctx.beginPath();
            this.ctx.arc(b.x + 20, b.y + 20, 25, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;

            // Icon letter
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 16px Outfit';
            this.ctx.textAlign = 'center';
            let label = b.type === 'speed' ? 'S' :
                b.type === 'shield' ? 'H' :
                    b.type === 'freeze' ? 'F' :
                        b.type === 'heal' ? '+' : 'T';
            this.ctx.fillText(label, b.x + 20, b.y + 26);
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
            this.ctx.fillRect(p.x - 2, p.y, 4, 15);
            // Simpler neon halo (just a semi-transparent rect underneath)
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillRect(p.x - 4, p.y - 2, 8, 19);
            this.ctx.globalAlpha = 1.0;
        });

        this.ctx.restore();
    }
}

