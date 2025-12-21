// Enemy Entity

import { CONFIG } from '../config.js';
import { assets } from './AssetManager.js';

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

        let img = assets.get('asteroid');

        if (img) {
            ctx.save();

            // Move to center for rotation
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

            // Rotation speed linked to size (Small = super fast, Large = super slow/menacing)
            const rotFactor = this.width / 2.5;
            const rotation = (this.y / rotFactor) % (Math.PI * 2);
            ctx.rotate(rotation);

            // Visual Hierarchy: Glow intensity and menace increases with size
            ctx.shadowColor = this.color;
            ctx.shadowBlur = this.width / 4;

            // Draw centered
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);

            // Extra menacing effects for giant asteroids
            if (this.width > 120) {
                ctx.globalAlpha = 0.25;
                ctx.shadowBlur = this.width / 2;
                ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
            }

            ctx.restore();
        }
    }
}
