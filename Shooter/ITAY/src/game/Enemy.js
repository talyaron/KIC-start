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
        this.exp = config.exp;
        this.active = true;

        // HP System
        this.maxHp = config.hp;
        this.hp = config.hp;

        // Shooting System
        this.shootInterval = config.shootInterval || 3000;
        this.projectileSpeed = config.projectileSpeed || 4;
        this.accuracy = config.accuracy || 0.5;
        this.lastShootTime = Date.now() + Math.random() * 2000; // Random initial delay
    }

    /**
     * Take damage
     * @param {number} damage - Damage amount
     * @returns {boolean} True if enemy died from this damage
     */
    takeDamage(damage) {
        if (!this.active) return false;

        this.hp -= damage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.destroy();
            return true; // Enemy died
        }

        return false; // Enemy survived
    }

    /**
     * Check if enemy can shoot
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if can shoot
     */
    canShoot(currentTime) {
        return currentTime - this.lastShootTime >= this.shootInterval;
    }

    /**
     * Record that enemy shot
     * @param {number} currentTime - Current timestamp
     */
    recordShot(currentTime) {
        this.lastShootTime = currentTime;
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
     * Render enemy with HP bar
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        if (!this.active) return;

        // Draw enemy body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Draw HP bar above enemy
        const barWidth = this.width;
        const barHeight = 4;
        const barY = this.y - 8;

        // Background (dark)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(this.x, barY, barWidth, barHeight);

        // HP fill
        const hpPercent = this.hp / this.maxHp;
        const hpBarWidth = barWidth * hpPercent;

        // Color based on HP percentage
        if (hpPercent > 0.6) {
            ctx.fillStyle = '#06ffa5'; // Green
        } else if (hpPercent > 0.3) {
            ctx.fillStyle = '#ffbe0b'; // Yellow
        } else {
            ctx.fillStyle = '#ff006e'; // Red
        }

        ctx.fillRect(this.x, barY, hpBarWidth, barHeight);
    }
}
