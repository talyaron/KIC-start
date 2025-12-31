// Enemy Entity

import { CONFIG } from '../config.js';

export class Enemy {
    constructor(type, x, y) {
        const config = CONFIG.ENEMIES[type];

        this.type = type;
        this.x = x;
        this.y = y;
        this.width = config.size;
        this.height = config.size;
        this.color = config.color;
        this.damage = config.damage;
        this.score = config.score;
        this.speed = config.speed;
        this.active = true;
    }

    /**
     * Update enemy position
     */
    update() {
        if (!this.active) return;

        // Move downward
        this.y += this.speed;
    }

    /**
     * Check if enemy is off screen
     * @param {number} canvasHeight - Canvas height
     * @returns {boolean} True if off screen
     */
    isOffScreen(canvasHeight) {
        return this.y > canvasHeight;
    }

    /**
     * Destroy enemy
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
     * Render enemy
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Optional: Add outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
