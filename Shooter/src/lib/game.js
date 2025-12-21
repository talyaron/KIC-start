export class GameEngine {
    constructor(canvas, isHost, onStateUpdate, onGameOver) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.isHost = isHost;
        this.onStateUpdate = onStateUpdate; // Callback to send state to server
        this.onGameOver = onGameOver;

        this.players = {}; // { uid: { x, y, hp, color } }
        this.enemies = []; // [{ id, x, y, type, hp }]
        this.projectiles = []; // [{ id, x, y, ownerId }]

        this.running = false;
        this.lastTime = 0;

        // Config
        this.playerSpeed = 30; // SUPER FAST
        this.enemySpeed = 2;
        this.spawnTimer = 0;
        this.lastShootTimes = {}; // Map { uid: timestamp } local debounce
        this.processedShootTimes = {}; // Map { uid: timestamp } host state tracking
    }

    start() {
        this.running = true;
        requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    // External input
    updatePlayers(serverPlayers) {
        // If Host, check for new shoot timestamps
        if (this.isHost) {
            Object.keys(serverPlayers).forEach(uid => {
                const p = serverPlayers[uid];
                const last = this.processedShootTimes[uid] || 0;
                if (p.lastShoot && p.lastShoot > last) {
                    // New shot detected from client
                    this.processedShootTimes[uid] = p.lastShoot;
                    this.addProjectile(p.x + 20, p.y, uid, p.color);
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
        const p = this.players[myUid];
        if (!p) return;

        if (input.left && p.x > 0) p.x -= this.playerSpeed;
        if (input.right && p.x < this.width - 50) p.x += this.playerSpeed;
        if (input.up && p.y > this.height - 100) p.y -= this.playerSpeed; // Minor vertical
        if (input.down && p.y < this.height - 50) p.y += this.playerSpeed;

        // Return Position
        return { x: p.x, y: p.y };
    }

    // Client calls this to try to shoot (returns timestamp if success)
    tryShoot(myUid) {
        const now = Date.now();
        const lastShoot = this.lastShootTimes[myUid] || 0;
        if (now - lastShoot < 400) return null; // Cooldown

        this.lastShootTimes[myUid] = now;
        return now;
    }

    addProjectile(x, y, ownerId, color) {
        this.projectiles.push({
            id: Date.now() + Math.random(),
            x, y, ownerId,
            color: color || '#00f0ff' // Default to Cyan if undefined
        });
    }

    loop(timestamp) {
        if (!this.running) return;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        // Sim Projectiles (Host & Client for smoothness, but overwritten by server)
        // Actually, if we sync projectiles, client shouldn't move them twice or we get jitters if we just replace.
        // For MVP, simple replacement is safer. Host simulates.
        if (this.isHost) {
            this.projectiles.forEach(p => p.y -= 15); // Faster bullets
            this.projectiles = this.projectiles.filter(p => p.y > -50);
        }

        if (this.isHost) {
            // Host Logic: Spawn Enemies
            this.spawnTimer += 16; // approx ms per frame
            if (this.spawnTimer > 1000) { // spawn every 1s
                this.spawnTimer = 0;
                const typeProb = Math.random();
                let type = 'red';
                if (typeProb > 0.7) type = 'yellow';
                if (typeProb > 0.9) type = 'blue';

                this.enemies.push({
                    id: Date.now(),
                    x: Math.random() * (this.width - 40),
                    y: -40,
                    type: type,
                    width: 40,
                    height: 40
                });
            }

            // Move Enemies
            this.enemies.forEach(e => {
                e.y += this.enemySpeed;
            });

            // Cleanup Enemies
            this.enemies = this.enemies.filter(e => e.y < this.height);

            // Host Collision Logic: Projectile vs Enemy
            // Naive O(N*M)
            this.projectiles.forEach((p, pIdx) => {
                this.enemies.forEach((e, eIdx) => {
                    if (
                        p.x < e.x + e.width &&
                        p.x + 10 > e.x &&
                        p.y < e.y + e.height &&
                        p.y + 10 > e.y
                    ) {
                        // Hit
                        this.enemies.splice(eIdx, 1);
                        this.projectiles.splice(pIdx, 1);
                        // Award points todo
                    }
                });
            });

            // Player vs Enemy
            Object.keys(this.players).forEach(uid => {
                const pl = this.players[uid];
                this.enemies.forEach((e, eIdx) => {
                    if (
                        pl.x < e.x + e.width &&
                        pl.x + 50 > e.x &&
                        pl.y < e.y + e.height &&
                        pl.y + 50 > e.y
                    ) {
                        // Collision
                        this.enemies.splice(eIdx, 1);
                        if (this.onStateUpdate) {
                            // Calc new HP
                            const newHp = (pl.hp || 100) - 10;
                            this.onStateUpdate({ type: 'DAMAGE', uid, newHp, amount: 10 });
                        }
                    }
                });
            });

            // Send state
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
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Players
        Object.keys(this.players).forEach(uid => {
            const p = this.players[uid];
            this.ctx.fillStyle = p.color || '#fff';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = p.color || '#fff';
            this.ctx.fillRect(p.x, p.y, 50, 50);

            // HP Bar
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(p.x, p.y - 15, 50, 5);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(p.x, p.y - 15, 50 * ((p.hp || 100) / 100), 5);

            this.ctx.shadowBlur = 0;
        });

        // Draw Enemies
        this.enemies.forEach(e => {
            this.ctx.fillStyle = e.type === 'red' ? '#ff2a2a' : e.type === 'yellow' ? '#ffd700' : '#00f0ff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.ctx.fillStyle;
            this.ctx.fillRect(e.x, e.y, e.width, e.height);
            this.ctx.shadowBlur = 0;
        });

        // Draw Projectiles
        this.projectiles.forEach(p => {
            this.ctx.fillStyle = p.color || '#fff';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowColor = p.color || '#fff';
            this.ctx.fillRect(p.x, p.y, 10, 10);
            this.ctx.shadowBlur = 0;
        });
    }
}
