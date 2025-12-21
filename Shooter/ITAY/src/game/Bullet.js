// Bullet Entity

import { CONFIG } from '../config.js';

export class Bullet {
    constructor(x, y, ownerId, damage) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.BULLET.WIDTH;
        this.height = CONFIG.BULLET.HEIGHT;
        this.speed = CONFIG.BULLET.SPEED;
        this.color = CONFIG.BULLET.COLOR;
        this.ownerId = ownerId;
        this.damage = damage;
        this.active = true;
    }

    /**
     * Update bullet position
     */
    update() {
        if (!this.active) return;

        // Move upward
        this.y -= this.speed;
    }

    /**
     * Check if bullet is off screen
     * @returns {boolean} True if off screen
     */
    isOffScreen() {
        return this.y + this.height < 0;
    }

    /**
     * Destroy bullet
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
     * Render bullet
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.shadowBlur = 0;
    }
}
