// Bullet Entity
import { CONFIG } from '../config.js';
import { assets } from './AssetManager.js';

export class Bullet {
    constructor(x, y, angle, ownerId, damage) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.width = CONFIG.BULLET.WIDTH;
        this.height = CONFIG.BULLET.HEIGHT;
        this.speed = CONFIG.BULLET.SPEED;
        this.color = CONFIG.BULLET.COLOR;
        this.ownerId = ownerId;
        this.damage = damage;
        this.active = true;

        // Visual trajectory
        this.velocityX = Math.cos(angle - Math.PI / 2) * this.speed;
        this.velocityY = Math.sin(angle - Math.PI / 2) * this.speed;

        // Trail effect for high visibility
        this.trail = [];
        this.maxTrailLength = 10;
    }

    /**
     * Update bullet position
     */
    update() {
        if (!this.active) return;

        // Store positions for the trail
        this.trail.unshift({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Move along angle
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    /**
     * Check if bullet is off world boundaries or traveled too far
     */
    isExpired(worldWidth, worldHeight) {
        return this.x < 0 || this.x > worldWidth || this.y < 0 || this.y > worldHeight;
    }

    /**
     * Destroy bullet
     */
    destroy() {
        this.active = false;
    }

    collidesWith(x, y, width, height) {
        return this.active &&
            this.x > x && this.x < x + width &&
            this.y > y && this.y < y + height;
    }

    /**
     * Render bullet
     */
    render(ctx) {
        if (!this.active) return;

        // Draw energy trail
        ctx.save();
        this.trail.forEach((pos, index) => {
            const alpha = (this.maxTrailLength - index) / this.maxTrailLength;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha * 0.5;
            const trailSize = this.width * (0.3 + alpha * 0.7);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, trailSize / 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        const img = assets.get('missile');

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (img) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 25;
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

            // Double pass for glow
            ctx.globalAlpha = 0.6;
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }
        ctx.restore();
    }
}
