import Phaser from 'phaser';

class ShopScene extends Phaser.Scene {
    constructor() {
        super('ShopScene');
    }

    init(data) {
        this.points = data.points || 0;
    }

    create() {
        const { width, height } = this.scale;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000, 0.9);
        this.add.text(width / 2, 50, 'NEON SKIN DEPOT', { fontSize: '48px', fill: '#0ff', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
        this.add.text(width / 2, 120, `POINTS: ${this.points}`, { fontSize: '24px', fill: '#ff0' }).setOrigin(0.5);

        const skins = [
            { name: 'Crystal Clear', cost: 1, color: 0xffffff },
            { name: 'Magma Core', cost: 2, color: 0xff4400 },
            { name: 'Void Walker', cost: 3, color: 0x8800ff }
        ];

        skins.forEach((skin, index) => {
            const y = 220 + index * 80;
            const btn = this.add.rectangle(width / 2, y, 400, 60, 0x111).setInteractive();
            btn.setStrokeStyle(2, 0x00ffff, 0.5);

            this.add.text(width / 2 - 180, y, skin.name, { fontSize: '20px', fill: '#fff' }).setOrigin(0, 0.5);
            this.add.text(width / 2 + 180, y, `${skin.cost} PTS`, { fontSize: '18px', fill: '#ff0' }).setOrigin(1, 0.5);

            btn.on('pointerdown', () => {
                if (this.points >= skin.cost) {
                    this.points -= skin.cost;
                    this.messageText.setText(`Unlocked ${skin.name}!`);
                    // Update player skin logic here
                } else {
                    this.messageText.setText("Need more points!");
                }
            });
        });

        this.messageText = this.add.text(width / 2, 480, '', { fontSize: '20px', fill: '#f00' }).setOrigin(0.5);

        const playBtn = this.add.text(width / 2, 530, 'BACK TO THE VOID', { fontSize: '32px', fill: '#0f0' }).setOrigin(0.5).setInteractive();
        playBtn.on('pointerdown', () => {
            this.scene.start('GameScene', { level: 0, points: this.points });
        });
    }
}

export default ShopScene;
