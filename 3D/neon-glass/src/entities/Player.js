import Phaser from 'phaser';

class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setDragX(1500);
        this.body.setMaxVelocity(500, 1000);

        this.speed = 350;
        this.jumpForce = -550;
        this.canDoubleJump = false;

        if (this.postFX) {
            this.postFX.addGlow(0x00ffff, 4, 1);
        }
    }

    update(cursors) {
        if (!this.body) return;

        const onGround = this.body.blocked.down;

        if (cursors.left.isDown) {
            this.setVelocityX(-this.speed);
            this.setFlipX(true);
        } else if (cursors.right.isDown) {
            this.setVelocityX(this.speed);
            this.setFlipX(false);
        }

        const jumpJustDown = Phaser.Input.Keyboard.JustDown(cursors.up);

        if (jumpJustDown && onGround) {
            this.setVelocityY(this.jumpForce);
            // Double jump removed as requested
        }
    }

    takeDamage() {
        // Red flash and restart
        this.scene.cameras.main.flash(200, 255, 0, 0);
        this.scene.scene.restart();
    }
}

export default Player;
