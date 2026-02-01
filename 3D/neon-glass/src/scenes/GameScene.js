import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { Levels } from '../data/Levels.js';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.levelIndex = data.level || 0;
        this.points = data.points || 0;
        this.levelReady = false;
    }

    create() {
        const worldWidth = 3200;
        this.physics.world.setBounds(0, 0, worldWidth, 600);

        // --- VISUALS ---
        this.add.rectangle(worldWidth / 2, 300, worldWidth, 600, 0x000205).setScrollFactor(0);
        this.add.grid(worldWidth / 2, 300, worldWidth, 600, 64, 64, 0x000000, 0, 0x00ffff, 0.05).setScrollFactor(0);

        // --- INITIALIZE GROUPS IMMEDIATELY ---
        this.platforms = this.physics.add.staticGroup();
        this.crushers = this.physics.add.group();
        this.spikes = this.physics.add.staticGroup();
        this.trolls = this.physics.add.group();

        // --- LEVEL DATA ---
        const levelData = Levels[this.levelIndex];
        if (!levelData) {
            this.add.text(480, 270, 'CHAMPION OF VOID', { fontSize: '64px', fill: '#0ff' }).setOrigin(0.5);
            return;
        }

        this.setupLevel(levelData);

        // --- PLAYER ---
        this.player = new Player(this, 100, 500);
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.crushers, () => this.player.takeDamage());
        this.physics.add.collider(this.player, this.trolls, (p, t) => {
            if (t.isFalling) {
                t.setTint(0xff0000);
                this.time.delayedCall(200, () => { if (t.active) t.destroy(); });
            }
        });

        this.physics.add.overlap(this.player, this.spikes, () => this.player.takeDamage());
        this.physics.add.overlap(this.player, this.portal, () => this.nextLevel());

        // --- CAMERA ---
        this.cameras.main.setBounds(0, 0, worldWidth, 600);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        if (this.cameras.main.postFX) this.cameras.main.postFX.addBloom(0xffffff, 1, 1, 2, 1.2);

        this.cursors = this.input.keyboard.createCursorKeys();

        // --- UI ---
        this.ui = this.add.text(20, 20, `${levelData.name}\nPOINTS: ${this.points}`, {
            fontSize: '24px',
            fill: '#fff',
            fontFamily: 'monospace'
        }).setScrollFactor(0);

        this.levelReady = true;
    }

    setupLevel(data) {
        // Base Floor
        for (let i = 0; i < 100; i++) {
            this.platforms.create(i * 32, 584, 'ground');
        }

        // Custom Objects
        data.platforms.forEach(p => {
            if (p.crusher) {
                const c = this.physics.add.sprite(p.x, -500, 'ground').setScale(p.w, p.h);
                c.body.allowGravity = false;
                c.body.immovable = true;
                c.triggerX = p.trigger;
                this.crushers.add(c);
            } else if (p.fake) {
                this.add.image(p.x, p.y, 'fake_ground').setScale(p.w, p.h);
            } else if (p.gravity) {
                const t = this.trolls.create(p.x, p.y, 'ground').setScale(p.w, p.h);
                t.body.allowGravity = false;
                t.body.immovable = true;
                t.isFalling = true;
            } else {
                this.platforms.create(p.x, p.y, 'ground').setScale(p.w, p.h).refreshBody();
            }
        });

        if (data.spikes) {
            data.spikes.forEach(s => {
                for (let i = 0; i < s.count; i++) {
                    this.spikes.create(s.x + (i * 32), s.y, 'spike').setOrigin(0.5, 1).refreshBody();
                }
            });
        }

        // Portal Visual
        this.portal = this.physics.add.sprite(data.gate.x, data.gate.y, 'portal');
        this.portal.body.allowGravity = false;
        this.tweens.add({
            targets: this.portal,
            angle: 360,
            duration: 2000,
            repeat: -1
        });
    }

    update() {
        if (!this.levelReady || !this.player || !this.player.body) return;
        this.player.update(this.cursors);

        // Crusher logic
        this.crushers.getChildren().forEach(c => {
            if (!c.triggered && this.player.x > c.triggerX) {
                c.triggered = true;
                this.tweens.add({
                    targets: c,
                    y: 500,
                    duration: 300,
                    ease: 'Bounce.easeOut',
                    onComplete: () => {
                        this.cameras.main.shake(100, 0.01);
                        this.time.delayedCall(1500, () => {
                            if (c.active) this.tweens.add({ targets: c, y: -500, duration: 1000 });
                        });
                    }
                });
            }
        });
    }

    nextLevel() {
        this.levelReady = false;
        this.points += 1;
        this.levelIndex += 1;
        this.cameras.main.flash(500, 0, 255, 0);
        this.time.delayedCall(500, () => {
            this.scene.start('GameScene', { level: this.levelIndex, points: this.points });
        });
    }
}

export default GameScene;
