import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.createCreativeAssets();
        this.load.on('complete', () => {
            this.scene.start('GameScene', { level: 0, points: 0 });
        });
    }

    createCreativeAssets() {
        const graphics = this.add.graphics();

        // Hero (Glowing Cyan Cube)
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(0, 0, 30, 30);
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.strokeRect(0, 0, 30, 30);
        graphics.generateTexture('player', 32, 32);

        // Solid Neon Block
        graphics.clear();
        graphics.fillStyle(0x001122, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.generateTexture('ground', 32, 32);

        // Fake/Troll Block (Looks identical but has a tiny "glitch" line)
        graphics.clear();
        graphics.fillStyle(0x001122, 1);
        graphics.fillRect(0, 0, 32, 32);
        graphics.lineStyle(2, 0x00ffff, 1);
        graphics.strokeRect(0, 0, 32, 32);
        graphics.lineStyle(1, 0xff00ff, 0.3); // Tiny magenta hint
        graphics.moveTo(2, 30); graphics.lineTo(30, 30);
        graphics.generateTexture('fake_ground', 32, 32);

        // Spike (Geometry Dash style, Electric Magenta)
        graphics.clear();
        graphics.fillStyle(0xff00ff, 1);
        const points = [{ x: 16, y: 0 }, { x: 32, y: 32 }, { x: 0, y: 32 }];
        graphics.fillPoints(points, true);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokePoints(points, true);
        graphics.generateTexture('spike', 32, 32);

        // The Gateway (Green Pulse)
        graphics.clear();
        graphics.fillStyle(0x00ff00, 0.3);
        graphics.fillRect(0, 0, 64, 128);
        graphics.lineStyle(4, 0x00ff00, 1);
        graphics.strokeRect(0, 0, 64, 128);
        graphics.generateTexture('gate', 64, 128);

        // Point/Shard (Yellow Star)
        graphics.clear();
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(16, 16, 10);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.strokeCircle(16, 16, 10);
        graphics.generateTexture('point', 32, 32);
    }
}

export default BootScene;
