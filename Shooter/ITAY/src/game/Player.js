// Player Entity

import { CONFIG } from '../config.js';
import { clamp } from '../utils/helpers.js';

export class Player {
    constructor(uid, x, y, color = '#8338ec') {
        this.uid = uid;
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER.WIDTH;
        this.height = CONFIG.PLAYER.HEIGHT;
        this.color = color;

        // Stats
        this.hp = CONFIG.PLAYER.BASE_HP;
        this.maxHp = CONFIG.PLAYER.BASE_HP;
        this.score = 0;
        this.exp = 0; // Experience points
        this.kills = { red: 0, yellow: 0, blue: 0 };
        this.damageTaken = 0;

        // Movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = CONFIG.PLAYER.BASE_SPEED;
        this.onGround = true;

        // Shooting
        this.fireRate = CONFIG.PLAYER.BASE_FIRE_RATE;
        this.lastShotTime = 0;
        this.damage = CONFIG.PLAYER.BASE_DAMAGE;

        // Input
        this.inputs = {
            left: false,
            right: false,
            jump: false,
            shoot: false,
        };
    }

    /**
     * Apply upgrades to player
     * @param {Object} upgrades - Upgrade levels
     */
    applyUpgrades(upgrades) {
        if (!upgrades) return;

        // Fire rate
        if (upgrades.fireRateLevel) {
            this.fireRate = CONFIG.UPGRADES.FIRE_RATE.effect(upgrades.fireRateLevel);
        }

        // Damage
        if (upgrades.damageLevel) {
            this.damage = CONFIG.UPGRADES.DAMAGE.effect(upgrades.damageLevel);
        }

        // HP
        if (upgrades.hpLevel) {
            const newMaxHp = CONFIG.UPGRADES.HP.effect(upgrades.hpLevel);
            const hpRatio = this.hp / this.maxHp;
            this.maxHp = newMaxHp;
            this.hp = Math.floor(newMaxHp * hpRatio);
        }

        // Speed
        if (upgrades.speedLevel) {
            this.speed = CONFIG.UPGRADES.SPEED.effect(upgrades.speedLevel);
        }
    }

    /**
     * Update player state
     * @param {number} canvasWidth - Canvas width
     * @param {number} canvasHeight - Canvas height
     */
    update(canvasWidth, canvasHeight) {
        // Horizontal movement
        if (this.inputs.left) {
            this.velocityX = -this.speed;
        } else if (this.inputs.right) {
            this.velocityX = this.speed;
        } else {
            this.velocityX = 0;
        }

        // Jump
        if (this.inputs.jump && this.onGround) {
            this.velocityY = -CONFIG.PLAYER.JUMP_FORCE;
            this.onGround = false;
        }

        // Apply gravity
        if (!this.onGround) {
            this.velocityY += CONFIG.PLAYER.GRAVITY;
        }

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Ground collision
        const groundY = canvasHeight - this.height - 50; // 50px from bottom
        if (this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.onGround = true;
        }

        // Bounds checking
        this.x = clamp(this.x, 0, canvasWidth - this.width);
        this.y = clamp(this.y, 0, canvasHeight - this.height);
    }

    /**
     * Can shoot
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} True if can shoot
     */
    canShoot(currentTime) {
        return currentTime - this.lastShotTime >= this.fireRate;
    }

    /**
     * Record shot
     * @param {number} currentTime - Current timestamp
     */
    shoot(currentTime) {
        this.lastShotTime = currentTime;
    }

    /**
     * Take damage
     * @param {number} damage - Damage amount
     */
    takeDamage(damage) {
        this.hp -= damage;
        this.damageTaken += damage;

        if (this.hp < 0) {
            this.hp = 0;
        }
    }

    /**
     * Add kill
     * @param {string} enemyType - Enemy type ('red', 'yellow', 'blue')
     * @param {number} score - Score to add
     * @param {number} exp - EXP to add
     */
    addKill(enemyType, score, exp = 0) {
        this.kills[enemyType.toLowerCase()]++;
        this.score += score;
        this.exp += exp;
    }

    /**
     * Check if dead
     * @returns {boolean} True if dead
     */
    isDead() {
        return this.hp <= 0;
    }

    /**
     * Render player
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     */
    render(ctx) {
        // Draw player body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw health bar above player
        const barWidth = this.width;
        const barHeight = 6;
        const barY = this.y - 12;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(this.x, barY, barWidth, barHeight);

        // Health
        const healthPercent = this.hp / this.maxHp;
        const healthBarWidth = barWidth * healthPercent;

        // Color based on health
        if (healthPercent > 0.6) {
            ctx.fillStyle = '#06ffa5';
        } else if (healthPercent > 0.3) {
            ctx.fillStyle = '#ffbe0b';
        } else {
            ctx.fillStyle = '#ff006e';
        }

        ctx.fillRect(this.x, barY, healthBarWidth, barHeight);

        // HP text
        ctx.fillStyle = 'white';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.hp)}`, this.x + this.width / 2, barY - 2);
    }
}
