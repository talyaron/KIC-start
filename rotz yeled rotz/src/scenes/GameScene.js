import Phaser from 'phaser';


export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.scrollSpeed = 5;
        this.distance = 0;
        this.nextSpawnTime = 0;
        this.nextCoinTime = 0;
        this.nextBossTime = 5000; // First boss at 5000 distance
        this.score = 0;
        this.gameStarted = false;
        this.isBossActive = false;
    }

    create() {
        const { width, height } = this.scale;

        // Base sky color to prevent checkerboard if images fail
        this.add.rectangle(0, 0, width, height, 0x050510).setOrigin(0, 0).setScrollFactor(0);

        // 1. Dynamic Parallax Background (Unified Magical Night Theme)
        const skyTint = 0x2c3e50;
        const forestTint = 0x1a1a2e;

        this.sky = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0, 0).setScrollFactor(0).setTint(skyTint);

        // Midground forest - ensuring they wrap and align well
        this.forestBack = this.add.tileSprite(0, height - 550, width, 512, 'forest').setOrigin(0, 0).setScrollFactor(0).setAlpha(0.3).setTint(forestTint);
        this.forestFront = this.add.tileSprite(0, height - 450, width, 512, 'forest').setOrigin(0, 0).setScrollFactor(0).setAlpha(0.6).setTint(forestTint);

        // 2. Physics groups
        this.platforms = this.physics.add.staticGroup(); // Use StaticGroup for actual platforms
        this.enemies = this.physics.add.group();
        this.coins = this.physics.add.group({ allowGravity: false });
        this.attacks = this.physics.add.group({ allowGravity: false });

        // 3. Seamless Floor (TileSprite)
        this.floor = this.add.tileSprite(0, height - 100, width + 200, 128, 'tiles').setOrigin(0, 0);
        this.physics.add.existing(this.floor, true); // Keep it separate from the Group to avoid crash

        // 4. Players group
        this.players = this.add.group();
        this.player1 = this.setupPlayer(200, height - 250, 0, '#3498db');
        this.player2 = this.setupPlayer(350, height - 250, 4, '#e74c3c'); // Frame 4 for distinct look

        // 5. Advanced Particle Systems
        this.createParticles();
        // createSpeedLines() removed as requested (white lines fix)

        // 6. Colliders
        this.physics.add.collider(this.players, this.floor);
        this.physics.add.collider(this.players, this.platforms);
        this.physics.add.collider(this.player1, this.player2);
        this.physics.add.collider(this.enemies, this.floor);
        this.physics.add.collider(this.enemies, this.platforms);

        // 7. Overlaps
        this.physics.add.overlap(this.players, this.enemies, this.handlePlayerEnemyCollision, null, this);
        this.physics.add.overlap(this.players, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.attacks, this.enemies, this.handleAttackEnemyCollision, null, this);

        // 8. Boss Group & Logic
        this.bosses = this.physics.add.group({ allowGravity: false });
        this.physics.add.overlap(this.players, this.bosses, this.handlePlayerEnemyCollision, null, this);
        this.physics.add.overlap(this.attacks, this.bosses, this.handleAttackBossCollision, null, this);

        // 9. Inputs
        this.setupKeys();

        // 10. HUD
        this.createHUD(width);

        this.gameStarted = true;
        this.cameras.main.fadeIn(1000, 0, 0, 0);
    }

    // Speed lines removed for visual clarity

    spawnBoss() {
        this.isBossActive = true;
        const boss = this.bosses.create(1100, 200, 'characters', 14).setScale(2.5).setTint(0x000000);
        boss.setData('hp', 1000);

        const bossText = this.add.text(this.scale.width / 2, 150, 'BOSS UNLEASHED', {
            fontSize: '64px', fill: '#ff0000', fontStyle: 'bold', stroke: '#000', strokeThickness: 10
        }).setOrigin(0.5);

        this.tweens.add({ targets: bossText, scale: 1.5, alpha: 0, duration: 2000, onComplete: () => bossText.destroy() });
    }

    handleAttackBossCollision(attack, boss) {
        this.hitParticles.emitParticleAt(boss.x, boss.y, 25);
        const hp = boss.getData('hp') - 10;
        boss.setData('hp', hp);
        boss.setTint(0xffffff);
        this.time.delayedCall(50, () => boss.setTint(0x000000));
        this.cameras.main.shake(100, 0.015);

        if (hp <= 0) {
            this.hitParticles.emitParticleAt(boss.x, boss.y, 100);
            boss.destroy();
            this.isBossActive = false;
            this.nextBossTime += 5000;
            this.score += 10000;
            this.cameras.main.flash(500, 255, 255, 255);
        }
    }

    createParticles() {
        // Run smoke/dust
        this.runParticles = this.add.particles(0, 0, 'coin', {
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 200,
            frequency: 50,
            gravityY: -50,
            blendMode: 'ADD',
            emitting: false
        });

        // Hit effect
        this.hitParticles = this.add.particles(0, 0, 'enemy', {
            speed: { min: -200, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            blendMode: 'SCREEN',
            emitting: false
        });
    }

    setupPlayer(x, y, frame, color) {
        const player = this.physics.add.sprite(x, y, 'characters', frame).setScale(0.7);
        this.players.add(player);
        player.setCollideWorldBounds(true);
        player.setDragX(1500);
        player.setData('jumps', 0);
        player.setData('hp', 100);
        player.setData('color', color);
        player.setData('attacking', false);
        player.body.setSize(70, 110).setOffset(30, 30);

        // Visual fix for non-transparent backgrounds in PNG assets
        // SCREEN blend mode helps remove black backgrounds
        player.setBlendMode(Phaser.BlendModes.SCREEN);
        player.setTint(parseInt(color.replace('#', '0x')));

        return player;
    }

    setupKeys() {
        this.keys = this.input.keyboard.addKeys({
            w: 'W', a: 'A', s: 'S', d: 'D', space: 'SPACE', shift: 'SHIFT', f: 'F',
            up: 'UP', left: 'LEFT', down: 'DOWN', right: 'RIGHT', enter: 'ENTER', ctrl: 'CONTROL', l: 'L'
        });
    }

    createHUD(width) {
        this.distLabel = this.add.text(width / 2, 45, 'DISTANCE: 0M', {
            fontSize: '32px', fontStyle: 'bold', fill: '#f1c40f', stroke: '#000', strokeThickness: 6, shadow: { blur: 10, color: '#000', fill: true }
        }).setOrigin(0.5);

        this.createHealthBar(60, 50, 'PLAYER 1', '#3498db', (bar) => this.p1Bar = bar);
        this.createHealthBar(width - 260, 50, 'PLAYER 2', '#e74c3c', (bar) => this.p2Bar = bar, true);
    }

    createHealthBar(x, y, label, color, setter, rightAligned = false) {
        const container = this.add.container(x, y);
        const text = this.add.text(rightAligned ? 200 : 0, -5, label, { fontSize: '20px', fill: color, fontStyle: 'bold', stroke: '#000', strokeThickness: 3 });
        if (rightAligned) text.setOrigin(1, 0);
        const bg = this.add.rectangle(rightAligned ? 200 : 0, 25, 200, 20, 0x000000, 0.7).setOrigin(rightAligned ? 1 : 0, 0.5);
        const bar = this.add.rectangle(rightAligned ? 200 : 0, 25, 200, 20, parseInt(color.replace('#', '0x'))).setOrigin(rightAligned ? 1 : 0, 0.5);
        container.add([text, bg, bar]);
        setter(bar);
    }

    update(time) {
        if (!this.gameStarted) return;

        this.distance += this.scrollSpeed / 60;
        this.distLabel.setText(`DISTANCE: ${Math.floor(this.distance)}M | SCORE: ${this.score}`);

        // Precision Parallax: Slower backgrounds to match ground naturally
        this.sky.tilePositionX += this.scrollSpeed * 0.05;
        this.forestBack.tilePositionX += this.scrollSpeed * 0.15;
        this.forestFront.tilePositionX += this.scrollSpeed * 0.3;
        this.floor.tilePositionX += this.scrollSpeed;

        // Speed effects controlled via camera shake rather than lines
        const shakePower = Math.max(0, (this.scrollSpeed - 15) / 100);
        if (shakePower > 0) this.cameras.main.shake(100, shakePower);

        // Safely update health bars
        this.p1Bar.width = Math.max(0, (this.player1 && this.player1.scene ? this.player1.getData('hp') || 0 : 0) / 100 * 200);
        this.p2Bar.width = Math.max(0, (this.player2 && this.player2.scene ? this.player2.getData('hp') || 0 : 0) / 100 * 200);

        // Spawn logic
        if (time > this.nextSpawnTime && !this.isBossActive) {
            this.spawnEnemy();
            this.nextSpawnTime = time + Phaser.Math.Between(1000, 2500);
        }
        if (time > this.nextCoinTime) {
            this.spawnCoin();
            this.nextCoinTime = time + Phaser.Math.Between(400, 1200);
        }

        // Boss Spawn Check
        if (this.distance > this.nextBossTime && !this.isBossActive) {
            this.spawnBoss();
        }

        // Object updates
        this.enemies.children.iterate((e) => { if (e && e.active) { e.x -= this.scrollSpeed; if (e.x < -100) e.destroy(); } });
        this.coins.children.iterate((c) => { if (c && c.active) { c.x -= this.scrollSpeed; if (c.x < -100) c.destroy(); } });
        this.bosses.children.iterate((b) => { if (b && b.active) { b.y = 200 + Math.sin(time / 500) * 150; b.x = 1000 + Math.cos(time / 1000) * 100; } });

        this.handlePlayerInput();
        this.updateAnimations();
        this.checkGameOver();

        this.scrollSpeed = 8 + (this.distance / 150);
    }

    updateAnimations() {
        this.players.children.iterate((p) => {
            if (p.body.touching.down && Math.abs(p.body.velocity.x) > 10) {
                // p.play('walk', true); // Add later
                this.runParticles.emitParticleAt(p.x, p.y + 50, 1);
                p.setAngle(p.body.velocity.x * 0.05);
            } else if (!p.body.touching.down) {
                p.setAngle(p.body.velocity.y * 0.02);
            } else {
                p.setAngle(0);
            }
        });
    }

    spawnEnemy() {
        const x = this.scale.width + 100;
        const type = Phaser.Math.Between(0, 2);
        let frame, scale, y;

        if (type === 0) { // Ground runner
            frame = Phaser.Math.Between(9, 11);
            scale = 0.8;
            y = this.scale.height - 150;
        } else if (type === 1) { // Floating ghost
            frame = 13;
            scale = 0.7;
            y = Phaser.Math.Between(200, 500);
        } else { // Jumping slime
            frame = 12;
            scale = 0.6;
            y = this.scale.height - 150;
        }

        const enemy = this.enemies.create(x, y, 'characters', frame).setScale(scale);
        enemy.setBlendMode(Phaser.BlendModes.SCREEN);
        enemy.setData('type', type);

        if (type === 1) {
            enemy.body.setAllowGravity(false);
            this.tweens.add({ targets: enemy, y: y - 80, duration: 1200, yoyo: true, repeat: -1 });
        } else if (type === 2) {
            enemy.body.setGravityY(1000);
            this.time.addEvent({
                delay: 1500,
                callback: () => { if (enemy.active && enemy.body.touching.down) enemy.setVelocityY(-600); },
                loop: true
            });
        } else {
            enemy.body.setGravityY(1000);
        }
    }

    spawnCoin() {
        const isGold = Phaser.Math.Between(0, 10) > 7;
        const coin = this.coins.create(this.scale.width + 100, Phaser.Math.Between(200, this.scale.height - 250), 'coin')
            .setScale(isGold ? 0.18 : 0.12)
            .setTint(isGold ? 0xffffff : 0xbdc3c7);
        coin.setData('gold', isGold);
        this.tweens.add({ targets: coin, y: coin.y - 40, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    collectCoin(p, c) {
        const isGold = c.getData('gold');
        const value = isGold ? 200 : 50;
        c.destroy();
        this.score += value;
        this.tweens.add({ targets: p, scale: 0.8, duration: 100, yoyo: true });
        const t = this.add.text(p.x, p.y - 60, `+${value}`, { fontSize: isGold ? '32px' : '26px', fill: isGold ? '#f1c40f' : '#ecf0f1', fontStyle: 'bold' });
        this.tweens.add({ targets: t, y: t.y - 120, alpha: 0, duration: 600, onComplete: () => t.destroy() });
    }

    handlePlayerEnemyCollision(p, e) {
        if (p.getData('attacking')) return;

        p.setData('hp', p.getData('hp') - 15);
        this.cameras.main.shake(150, 0.02);
        this.hitParticles.emitParticleAt(p.x, p.y, 10);
        p.setTint(0xff0000);
        this.time.delayedCall(200, () => p.clearTint());
        p.setVelocityX(-600);
        p.setVelocityY(-300);
    }

    handleAttackEnemyCollision(a, e) {
        this.hitParticles.emitParticleAt(e.x, e.y, 15);
        e.destroy();
        this.score += 150;
        this.cameras.main.shake(100, 0.01);
    }

    handlePlayerInput() {
        const jumpF = -850;
        const moveS = 450;

        if (this.player1.active) {
            this.processInput(this.player1, this.keys.a, this.keys.d, this.keys.w, this.keys.space, this.keys.f, moveS, jumpF);
        }
        if (this.player2.active) {
            this.processInput(this.player2, this.keys.left, this.keys.right, this.keys.up, this.keys.enter, this.keys.l, moveS, jumpF);
        }
    }

    processInput(p, left, right, up, jumpAlt, attack, moveS, jumpF) {
        if (left.isDown) p.setVelocityX(-moveS);
        else if (right.isDown) p.setVelocityX(moveS);

        if (Phaser.Input.Keyboard.JustDown(up) || Phaser.Input.Keyboard.JustDown(jumpAlt)) {
            if (p.body.touching.down) { p.setVelocityY(jumpF); p.setData('jumps', 1); }
            else if (p.getData('jumps') < 2) { p.setVelocityY(jumpF * 0.85); p.setData('jumps', 2); }
        }

        if (Phaser.Input.Keyboard.JustDown(attack)) this.executeAttack(p);
        if (p.body.touching.down) p.setData('jumps', 0);
    }

    executeAttack(p) {
        p.setData('attacking', true);
        // Projectile-based ranged attack
        const orb = this.physics.add.sprite(p.x + 40, p.y, 'characters', 15).setScale(0.8);
        orb.setBlendMode(Phaser.BlendModes.ADD);
        orb.setTint(p.getData('color') === '#3498db' ? 0x00ffff : 0xff4444);
        orb.body.setAllowGravity(false);
        orb.setVelocityX(this.scrollSpeed * 60 + 500);
        this.attacks.add(orb);

        p.setTint(0xffffff);
        this.tweens.add({ targets: orb, angle: 360, duration: 300, repeat: -1 });
        this.time.delayedCall(150, () => { p.setData('attacking', false); p.clearTint(); });

        // Destroy orb after traveling distance
        this.time.delayedCall(800, () => { if (orb.active) orb.destroy(); });
    }

    checkGameOver() {
        if (this.player1.active && (this.player1.x < -70 || this.player1.getData('hp') <= 0)) {
            this.player1.destroy();
        }
        if (this.player2.active && (this.player2.x < -70 || this.player2.getData('hp') <= 0)) {
            this.player2.destroy();
        }

        if (!this.player1.active && !this.player2.active) {
            this.scene.start('MainMenuScene');
        }
    }
}
