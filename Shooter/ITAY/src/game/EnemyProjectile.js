// Enemy Projectile Entity

import { CONFIG } from '../config.js';

export class EnemyProjectile {
    constructor(x, y, velocityX, velocityY, damage, color = '#ff006e') {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.width = 6;
        this.height = 12;
        this.damage = damage;
        this.color = color;
        this.active = true;
    }

    /**
     * Update projectile position
     */
    update() {
        if (!this.active) return;

        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    /**
     * Check if projectile is off screen
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     * @returns {boolean} True if off screen
     */
    isOffScreen(canvasWidth, canvasHeight) {
        return this.x < -20 || this.x > canvasWidth + 20 ||
            this.y < -20 || this.y > canvasHeight + 20;
    }

    /**
     * Destroy projectile
     */
    destroy() {
        this.active = false;
    }

    /**
     * Check collision with rect
     * @param {number} x - Rect x
     * @param {number} y - Rect y
     * @param {number} width - Rect width
     * @param {number} height - Rect height
     * @returns {boolean} True if colliding
     */
    collidesWith(x, y, width, height) {
        return this.active &&
            this.x < x + width &&
            this.x + this.width > x &&
            this.y < y + height &&
            this.y + this.height > y;
    }

    /**
     * Render projectile
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.active) return;

        // Draw glowing projectile
        ctx.save();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;

        // Draw projectile
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Brighter core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 2, this.y + 4, 2, 4);

        ctx.restore();
    }
}
