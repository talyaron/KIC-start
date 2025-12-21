const GameEngine = {
    game: null,
    roomId: null,
    isHost: false,

    start: function (roomId, isHost) {
        if (this.game) return; // Already running
        this.roomId = roomId;
        this.isHost = isHost;

        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#050510',
            transparent: true,
            scene: [GameScene],
            physics: { default: 'arcade', arcade: { debug: false } }
        };
        this.game = new Phaser.Game(config);
    }
};

class GameScene extends Phaser.Scene {
    constructor() { super({ key: 'GameScene' }); }

    create() {
        this.playerGroup = this.add.group();
        this.enemyGroup = this.add.group();
        this.projectileGroup = this.add.group();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // State
        this.myShip = null;
        this.playersData = {};
        this.lastSync = 0;
        this.lastShot = 0;

        // Setup Sync
        this.setupFirestoreSync();

        // Host Logic
        if (GameEngine.isHost) {
            this.time.addEvent({ delay: 1500, callback: this.spawnEnemy, callbackScope: this, loop: true });
        }
    }

    update(time, delta) {
        // Player Movement
        if (this.myShip && !this.myShip.isDead) {
            this.handleInput();
            this.autoFire(time);
        }

        // Interpolation could go here for other players

        // Host Logic: Move Enemies & Check Collisions
        if (GameEngine.isHost) {
            this.hostLoop();
        }
    }

    handleInput() {
        const speed = 5;
        let moved = false;

        if (this.cursors.left.isDown) { this.myShip.x -= speed; moved = true; }
        if (this.cursors.right.isDown) { this.myShip.x += speed; moved = true; }

        this.myShip.x = Phaser.Math.Clamp(this.myShip.x, 20, this.scale.width - 20);

        if (moved) this.syncPlayerPos();
    }

    syncPlayerPos() {
        // Throttle to avoid Firestore Writes
        const now = Date.now();
        if (now - this.lastSync > 100) { // 100ms
            db.collection('rooms').doc(GameEngine.roomId).collection('players').doc(App.user.uid).update({
                x: this.myShip.x
            }).catch(() => { });
            this.lastSync = now;
        }
    }

    autoFire(time) {
        if (time > this.lastShot + 400) {
            const id = App.user.uid + '_' + Date.now();
            db.collection('rooms').doc(GameEngine.roomId).collection('projectiles').doc(id).set({
                x: this.myShip.x,
                y: this.myShip.y - 20,
                owner: App.user.uid,
                ts: Date.now()
            });
            this.lastShot = time;
        }
    }

    hostLoop() {
        // Move Enemies (Simplified: Clients animate, Host deletes if OOB)
        // Ideally Host writes new Y, but that's too expensive.
        // We will assume constant speed and Host just cleans up.

        // Check Collisions
        // We need local references to checking overlap.
        // Phaser overlaps require Physics sprites.

        // Firestore is NOT suitable for 60fps physics sync. 
        // We will do a "Logic Check" against the data snapshots.
    }

    setupFirestoreSync() {
        const roomRef = db.collection('rooms').doc(GameEngine.roomId);

        // 1. Players
        roomRef.collection('players').onSnapshot(snap => {
            snap.forEach(doc => {
                const data = doc.data();
                if (data.uid === App.user.uid) return; // Skip self (local pred)

                let sprite = this.playerGroup.getChildren().find(p => p.name === data.uid);
                if (!sprite) {
                    sprite = this.add.triangle(data.x || 400, 500, 0, 20, 10, 0, 20, 20, 0x00f3ff);
                    sprite.name = data.uid;
                    sprite.setStrokeStyle(2, 0xffffff);
                    this.playerGroup.add(sprite);
                } else {
                    // Lerp
                    this.tweens.add({ targets: sprite, x: data.x, duration: 100 });
                }
            });
        });

        // 2. Enemies
        roomRef.collection('enemies').onSnapshot(snap => {
            snap.docChanges().forEach(change => {
                const id = change.doc.id;
                const data = change.doc.data();

                if (change.type === 'added') {
                    // Color based on type
                    let color = 0xff0000;
                    if (data.type === 2) color = 0xffff00; // Yellow
                    if (data.type === 3) color = 0x0000ff; // Blue

                    const e = this.add.rectangle(data.x, -50, 40, 40, color);
                    e.name = id;
                    e.setData('speed', data.speed);
                    e.setStrokeStyle(2, 0xffffff);
                    this.physics.add.existing(e); // Enable physics to move it locally
                    e.body.setVelocityY(data.speed * 60); // Simple fall
                    this.enemyGroup.add(e);
                }
                if (change.type === 'removed') {
                    const e = this.enemyGroup.getChildren().find(c => c.name === id);
                    if (e) e.destroy();
                }
            });
        });

        // 3. Projectiles
        roomRef.collection('projectiles').onSnapshot(snap => {
            snap.docChanges().forEach(change => {
                const id = change.doc.id;
                const data = change.doc.data();
                if (change.type === 'added') {
                    const p = this.add.circle(data.x, data.y, 5, 0x00ff00);
                    p.name = id;
                    p.setData('owner', data.owner);
                    this.physics.add.existing(p);
                    p.body.setVelocityY(-400);
                    this.projectileGroup.add(p);
                }
                if (change.type === 'removed') {
                    const p = this.projectileGroup.getChildren().find(c => c.name === id);
                    if (p) p.destroy();
                }
            });
        });

        // Spawn Self
        this.myShip = this.add.triangle(400, 500, 0, 20, 10, 0, 20, 20, 0x00ff00);
        this.physics.add.existing(this.myShip);
        this.myShip.body.setCollideWorldBounds(true);
        this.playerGroup.add(this.myShip);

        // Collision Logic
        this.physics.add.overlap(this.projectileGroup, this.enemyGroup, (proj, enemy) => {
            if (GameEngine.isHost) {
                // Host Authoritative Delete
                const pId = proj.name;
                const eId = enemy.name;
                db.collection('rooms').doc(GameEngine.roomId).collection('enemies').doc(eId).delete();
                db.collection('rooms').doc(GameEngine.roomId).collection('projectiles').doc(pId).delete();

                // Score
                const points = 10;
                // Add Score to Player (Needs Transaction, streamlined for now)
            }
            // Client-side visual remove (optional, wait for sync)
            proj.destroy();
            enemy.destroy();
        });
    }

    spawnEnemy() {
        const type = Math.random() > 0.8 ? 3 : (Math.random() > 0.5 ? 2 : 1);
        const speed = type === 1 ? 2 : (type === 2 ? 3 : 1);

        db.collection('rooms').doc(GameEngine.roomId).collection('enemies').add({
            x: Phaser.Math.Between(50, this.scale.width - 50),
            type: type,
            speed: speed,
            hp: 1
        });
    }
}
