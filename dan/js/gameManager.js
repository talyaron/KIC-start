const GameManager = {
    game: null,
    roomId: null,
    isHost: false,

    startGame: function (roomId, isHost) {
        if (this.game) return;
        this.roomId = roomId;
        this.isHost = isHost;

        const config = {
            type: Phaser.AUTO,
            parent: 'game-canvas',
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            scene: [MainScene],
            physics: { default: 'arcade', arcade: { debug: false } },
            scale: { mode: Phaser.Scale.RESIZE }
        };

        this.game = new Phaser.Game(config);
        document.getElementById('game-hud').classList.remove('hidden');
    },

    stopGame: function () {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
        document.getElementById('game-hud').classList.add('hidden');
    }
};

class MainScene extends Phaser.Scene {
    constructor() { super({ key: 'MainScene' }); }

    create() {
        this.playerGroup = this.add.group();
        this.enemyGroup = this.add.group();
        this.projectileGroup = this.add.group();

        this.cursors = this.input.keyboard.createCursorKeys();
        this.myShip = null;
        this.lastShot = 0;

        this.roomRef = db.collection('rooms').doc(GameManager.roomId);

        this.setupSync();
        if (GameManager.isHost) {
            this.time.addEvent({ delay: 1500, callback: this.spawnEnemy, callbackScope: this, loop: true });
        }
    }

    update(time, delta) {
        if (this.myShip && this.myShip.active) {
            this.handleMovement();
            this.autoFire(time);
        }

        // Host Physics
        if (GameManager.isHost) {
            // Very simple authoritative checks
        }
    }

    handleMovement() {
        const speed = 6;
        let dx = 0; let dy = 0;
        if (this.cursors.left.isDown) dx = -speed;
        if (this.cursors.right.isDown) dx = speed;
        if (this.cursors.up.isDown) dy = -speed;
        if (this.cursors.down.isDown) dy = speed;

        if (dx !== 0 || dy !== 0) {
            this.myShip.x += dx;
            this.myShip.y += dy;
            this.myShip.x = Phaser.Math.Clamp(this.myShip.x, 30, this.scale.width - 30);
            this.myShip.y = Phaser.Math.Clamp(this.myShip.y, 30, this.scale.height - 30);

            // Sync
            this.roomRef.collection('players').doc(FirebaseManager.user.uid).update({ x: this.myShip.x, y: this.myShip.y }).catch(() => { });
        }
    }

    autoFire(time) {
        if (time > this.lastShot + 400) {
            const id = FirebaseManager.user.uid + '_' + Date.now();
            this.roomRef.collection('projectiles').doc(id).set({
                x: this.myShip.x,
                y: this.myShip.y - 30,
                owner: FirebaseManager.user.uid
            });
            this.lastShot = time;
        }
    }

    spawnEnemy() {
        const type = Math.random() > 0.8 ? 3 : (Math.random() > 0.5 ? 2 : 1);
        this.roomRef.collection('enemies').add({
            x: Phaser.Math.Between(50, this.scale.width - 50),
            y: -50,
            type: type,
            hp: 1
        });
    }

    setupSync() {
        // Players
        this.roomRef.collection('players').onSnapshot(snap => {
            snap.forEach(doc => {
                const data = doc.data();
                if (data.uid === FirebaseManager.user.uid) {
                    // Update Self Data (HP/Score)
                    const hpBar = document.getElementById('hp-bar-fill');
                    hpBar.style.width = data.hp + '%';
                    hpBar.style.backgroundColor = data.hp < 30 ? 'red' : (data.hp < 60 ? 'yellow' : '#00ff41');
                    document.getElementById('hud-score').textContent = data.score;

                    if (!this.myShip) {
                        this.myShip = this.add.triangle(400, 500, 0, 20, 10, 0, 20, 20, 0x00ff41);
                        this.physics.add.existing(this.myShip);
                        this.playerGroup.add(this.myShip);
                    }
                    if (data.hp <= 0 && this.myShip.active) {
                        this.myShip.setActive(false).setVisible(false);
                        alert("DEPLOYMENT FAILED. SPECTATING."); // Simple death
                    }
                } else {
                    // Other Players
                    let p = this.playerGroup.getChildren().find(s => s.name === data.uid);
                    if (!p) {
                        p = this.add.triangle(data.x, data.y, 0, 20, 10, 0, 20, 20, 0x00f3ff);
                        p.name = data.uid;
                        this.playerGroup.add(p);
                    } else {
                        this.tweens.add({ targets: p, x: data.x, y: data.y, duration: 100 });
                    }
                }
            });
        });

        // Enemies
        this.roomRef.collection('enemies').onSnapshot(snap => {
            snap.docChanges().forEach(c => {
                const id = c.doc.id;
                const data = c.doc.data();
                if (c.type === 'added') {
                    let color = 0xff0000;
                    if (data.type === 2) color = 0xffff00;
                    if (data.type === 3) color = 0x0000ff;
                    const e = this.add.rectangle(data.x, -50, 40, 40, color);
                    e.name = id;
                    this.physics.add.existing(e);
                    e.body.setVelocityY(100 + (data.type * 20)); // Sim speed
                    this.enemyGroup.add(e);
                }
                if (c.type === 'removed') {
                    const e = this.enemyGroup.getChildren().find(x => x.name === id);
                    if (e) e.destroy();
                }
            });
        });

        // Projectiles
        this.roomRef.collection('projectiles').onSnapshot(snap => {
            snap.docChanges().forEach(c => {
                const id = c.doc.id;
                const data = c.doc.data();
                if (c.type === 'added') {
                    const p = this.add.circle(data.x, data.y, 5, 0x00ff41);
                    p.name = id;
                    p.owner = data.owner; // Store owner
                    this.physics.add.existing(p);
                    p.body.setVelocityY(-400);
                    this.projectileGroup.add(p);
                }
                if (c.type === 'removed') {
                    const p = this.projectileGroup.getChildren().find(x => x.name === id);
                    if (p) p.destroy();
                }
            });
        });

        // Host Collisions (The Brain)
        if (GameManager.isHost) {
            this.physics.add.overlap(this.projectileGroup, this.enemyGroup, (proj, enemy) => {
                const points = 10; // Simplify points
                const owner = proj.owner;

                // Remove from DB
                this.roomRef.collection('projectiles').doc(proj.name).delete();
                this.roomRef.collection('enemies').doc(enemy.name).delete();

                // Add Score (Via transaction helper would be better, but simple update here)
                // We'd update players/{owner}.score += points
                db.runTransaction(async t => {
                    const ref = this.roomRef.collection('players').doc(owner);
                    const doc = await t.get(ref);
                    if (doc.exists) t.update(ref, { score: doc.data().score + points });
                });
            });
        }
    }
}
