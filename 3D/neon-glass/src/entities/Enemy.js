import Phaser from 'phaser';

class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'point_icon'); // Using point_icon texture for variety
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.health = 2;
        this.direction = 1;
        this.speed = 150;

        if (this.postFX) {
            this.postFX.addGlow(0xffaa00, 2, 0);
        }
    }

    update() {
        this.setVelocityX(this.speed * this.direction);

        if (this.body.blocked.left) {
            this.direction = 1;
        } else if (this.body.blocked.right) {
            this.direction = -1;
        }
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.destroy();
        } else {
            this.setTint(0xffffff);
            this.scene.time.delayedCall(100, () => { if (this.active) this.clearTint(); });
        }
    }
}

export default Enemy;
