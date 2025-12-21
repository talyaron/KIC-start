// Enemy Entity (Asteroids)
import { CONFIG } from '../config.js';
import { assets } from './AssetManager.js';

export class Enemy {
    constructor(type, x, y, angle = 0) {
        const stats = CONFIG.ENEMIES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = stats.size;
        this.height = stats.size;
        this.color = stats.color;
        this.damage = stats.damage;
        this.score = stats.score;
        this.hp = 10; // Default health
        this.active = true;

        // 360-degree movement direction
        const speed = stats.speed;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.active = false;
    }

    isOffWorld() {
        // Broad check for despawning if far from world
        return (
            this.x < -1000 ||
            this.x > CONFIG.WORLD_WIDTH + 1000 ||
            this.y < -1000 ||
            this.y > CONFIG.WORLD_HEIGHT + 1000
        );
    }

    update() {
        if (!this.active) return;
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.rotation += this.rotationSpeed;

        if (this.isOffWorld()) {
            this.destroy();
        }
    }

    render(ctx) {
        if (!this.active) return;

        let img = assets.get('asteroid');

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);

        // Visibility boost
        ctx.filter = 'brightness(1.1) contrast(1.1)';
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.width / 4;

        if (img) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

            // Menacing glow for large asteroids
            if (this.width > 120) {
                ctx.globalAlpha = 0.35;
                ctx.shadowBlur = this.width / 2;
                ctx.filter = 'brightness(1.3) contrast(1.2)';
                ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
            }
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();
    }
}
