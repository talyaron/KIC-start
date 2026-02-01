import Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Extreme dark base to hide checkerboard during load or error
        this.add.rectangle(0, 0, width, height, 0x050510).setOrigin(0, 0);

        // 1. Dynamic Menu Background
        const skyTint = 0x2c3e50;
        const forestTint = 0x1a1a2e;
        this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0, 0).setTint(skyTint);
        this.forest = this.add.tileSprite(0, height - 400, width, 512, 'forest').setOrigin(0, 0).setAlpha(0.6).setScale(1.2).setTint(forestTint);

        // 2. Title with Glow and Animation
        this.title = this.add.text(width / 2, height * 0.3, 'RUN BOY RUN\nULTRA MULTIPLAYER', {
            fontSize: '90px',
            fill: '#f1c40f',
            fontStyle: 'bold',
            align: 'center',
            stroke: '#000',
            strokeThickness: 12,
            shadow: { blur: 20, color: '#f39c12', fill: true }
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.title,
            y: height * 0.3 + 30,
            scale: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. Start Button with Hover Effects
        const startBtn = this.add.container(width / 2, height * 0.65);
        const bg = this.add.rectangle(0, 0, 350, 90, 0x2ecc71).setInteractive({ useHandCursor: true });
        const text = this.add.text(0, 0, 'CORE START', { fontSize: '48px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        startBtn.add([bg, text]);

        bg.on('pointerdown', () => {
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('GameScene');
            });
        });

        bg.on('pointerover', () => {
            this.tweens.add({ targets: startBtn, scale: 1.1, duration: 100 });
            bg.setFillStyle(0x27ae60);
        });

        bg.on('pointerout', () => {
            this.tweens.add({ targets: startBtn, scale: 1.0, duration: 100 });
            bg.setFillStyle(0x2ecc71);
        });

        // 4. Instructions
        const style = { fontSize: '20px', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 4 };
        this.add.text(width / 2, height * 0.85,
            'P1: WASD Control | SPACE=Jump | F=Attack\nP2: ARROWS Control | ENTER=Jump | L=Attack', style).setOrigin(0.5);

        this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    update() {
        this.forest.tilePositionX += 1;
    }
}
